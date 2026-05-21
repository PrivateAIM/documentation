# HALTA Long COVID (PASC) Analysis Tutorial

This guide walks through the **HALTA-FLAME** example, an end-to-end federated pipeline for Post-Acute Sequelae of COVID-19 (PASC, "Long COVID") analysis. It combines **federated descriptive statistics**, **server-side plotting**, and an **iterative federated SVM** in a single STAR-pattern analysis — and shows how to return multiple result files of mixed types.

## 1. Overview

This example implements a complete Long COVID study across distributed clinical sites. In this scenario:

- Multiple hospitals (nodes) hold local, labeled patient CSV files
- Each node computes descriptive statistics (age, sex, PASC label distributions, missingness) and trains a **local linear SVM**
- A central aggregator merges the statistics, **renders plots**, and performs **weighted Federated Averaging (FedAvg)** of the SVM weights
- The process iterates until the model converges
- **No patient data ever leaves the local hospitals** — only aggregate counts and model coefficients are shared

### 1.1. What makes this example different

Compared to the [Federated Logistic Regression](/guide/user/coding_examples/federated-logistic-regression) example, this pipeline demonstrates several additional capabilities:

- **Mixed federated workloads**: descriptive statistics *and* model training in one analyzer
- **Server-side artifact generation**: the aggregator writes `.png` plots and a `.txt` report
- **Multiple, mixed-type results**: returns a list of files using `multiple_results=True`, `output_type=[...]`, and `filename=[...]`
- **Weighted FedAvg**: nodes are averaged proportionally to their sample count
- **Custom convergence**: an overridden `has_converged()` based on the L2 norm of coefficient deltas

### 1.2. Architecture

```
┌─────────────────┐         ┌─────────────────┐
│   Hospital 1    │         │   Hospital 2    │
│                 │         │                 │
│  *labeled.csv   │         │  *labeled.csv   │
│      ↓          │         │      ↓          │
│  HaltaAnalyzer  │         │  HaltaAnalyzer  │
│      ↓          │         │      ↓          │
│ Local stats +   │         │ Local stats +   │
│ Local SVM       │         │ Local SVM       │
└────────┬────────┘         └────────┬────────┘
         │                           │
         └────────────┬──────────────┘
                      ↓
         ┌────────────────────────┐
         │   HaltaAggregator      │
         │                        │
         │  Merge statistics      │
         │  Render plots (.png)   │
         │  Weighted FedAvg (SVM) │
         └────────────────────────┘
                      ↓
         (Iterate until convergence)
                      ↓
         age / sex / PASC plots + report
```

## 2. Code Walkthrough

### 2.1. Imports and Configuration

```python
import os
from io import BytesIO
from pathlib import Path
from typing import Dict, List, Optional, Tuple, Union

import matplotlib
matplotlib.use("Agg")            # headless backend — no display on a node
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from sklearn.linear_model import SGDClassifier
from sklearn.metrics import accuracy_score
from sklearn.preprocessing import StandardScaler

from flame.star import StarModel, StarAnalyzer, StarAggregator
```

**Key points:**

- `matplotlib.use("Agg")` is set **before** importing `pyplot`. Nodes run headless, so a non-interactive backend is required to render plots to disk.
- `SGDClassifier(loss="hinge")` is a linear SVM that supports `partial_fit` — essential for warm-starting from aggregated weights each round.

The pipeline is driven by a small configuration block:

```python
RESULTS_DIR = Path("results/")
MAX_ITERATIONS = 10
CONVERGENCE_TOL = 1e-4

RESULT_FILENAMES = [
    "age_distribution_federated.png",
    "dataset_description_federated.txt",
    "pasc_distribution_federated.png",
    "sex_distribution_federated.png",
]
```

`RESULT_FILENAMES` defines the four artifacts the analysis ultimately returns. The order matters — it must line up with `output_type` in the `StarModel` call (see [Section 2.4](#_2-4-starmodel-instantiation)).

### 2.2. The HaltaAnalyzer Class

The analyzer runs at each hospital. It parses the local CSV, computes descriptive statistics, and trains a local SVM.

```python
class HaltaAnalyzer(StarAnalyzer):
    """
    Each node parses its local CSV, computes descriptive statistics,
    trains a local linear SVM, and returns both to the aggregator.
    """

    def __init__(self, flame):
        super().__init__(flame)
```

#### 2.2.1. Loading node-local data

```python
def analysis_method(self, data, aggregator_results):
    file_bytes = [v for k, v in data[0].items() if k.endswith('labeled.csv')][0]
    df = pd.read_csv(BytesIO(file_bytes))
    node_id = getattr(self, "id", "unknown")
```

Instead of hard-coding a filename, the analyzer picks **any file whose name ends in `labeled.csv`**. This makes the example robust to slightly different file names across sites. `BytesIO` turns the raw bytes into an in-memory file for `pandas`.

#### 2.2.2. Descriptive statistics

The analyzer computes — entirely locally — the dataset shape, per-column missingness, an age histogram, sex counts, and PASC label counts:

```python
n_rows, n_cols = df.shape
missing_by_col = df.isna().sum().astype(int).to_dict()

age_hist, age_edges = None, None
if "age" in df.columns:
    ages = pd.to_numeric(df["age"], errors="coerce").dropna()
    bins = np.arange(0, 105, 5)
    h, e = np.histogram(ages, bins=bins)
    age_hist = h.astype(int).tolist()
    age_edges = e.astype(float).tolist()
```

Only **histogram bin counts** leave the node — never the raw ages. Using a fixed set of bins (`0, 5, 10, … 100`) means every node produces histograms with the same shape, so the aggregator can simply add them element-wise.

#### 2.2.3. Local SVM training and warm start

```python
X, y, feature_names = _prepare_features(df)
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)

svm = SGDClassifier(loss="hinge", penalty="l2", alpha=1e-4,
                    max_iter=1000, tol=1e-3, random_state=42)

if aggregator_results is not None and "svm_coef" in aggregator_results:
    svm.partial_fit(X_scaled[:1], y[:1], classes=[0, 1])
    svm.coef_ = np.array(aggregator_results["svm_coef"])
    svm.intercept_ = np.array(aggregator_results["svm_intercept"])
    for _ in range(10):
        svm.partial_fit(X_scaled, y)
else:
    svm.fit(X_scaled, y)
```

**How the warm start works:**

- **First round** (`aggregator_results is None`): the SVM is trained from scratch with `.fit()`.
- **Later rounds**: the analyzer needs an initialized estimator before it can overwrite the weights, so it makes one tiny `partial_fit` call (with `classes=[0, 1]`), then **injects the aggregated global weights** into `svm.coef_` / `svm.intercept_`, and finally refines them with 10 `partial_fit` passes over the local data.

The analyzer returns a dictionary containing both the statistics and the model state (coefficients, intercept, scaler parameters, local accuracy, and sample count):

```python
return {
    "node_id": node_id,
    "n_rows": int(n_rows),
    "age_edges": age_edges, "age_hist": age_hist,
    "sex_counts": sex_counts, "pasc_counts": pasc_counts,
    "svm_coef": svm.coef_.tolist(),
    "svm_intercept": svm.intercept_.tolist(),
    "local_accuracy": local_acc,
    "local_n_samples": int(len(y)),
    # ... missingness, feature names, scaler params
}
```

> **Tip:** values returned to the aggregator must be JSON-serializable, which is why every numpy array is converted with `.tolist()`.

### 2.3. The HaltaAggregator Class

The aggregator merges everything coming back from the nodes.

#### 2.3.1. Merging statistics

Counts are summed across nodes; histograms (which share identical bins) are added element-wise:

```python
total_rows = sum(r["n_rows"] for r in analysis_results)

age_hist = np.zeros(len(age_edges) - 1)
for r in analysis_results:
    if r.get("age_hist") is not None:
        age_hist += np.array(r["age_hist"])
```

#### 2.3.2. Weighted Federated Averaging

Unlike a plain mean, this example weights each node by how much data it contributed:

```python
total_samples = sum(r["local_n_samples"] for r in analysis_results)
for r in analysis_results:
    w = r["local_n_samples"] / total_samples
    coef = np.array(r["svm_coef"])
    if coef_avg is None:
        coef_avg = w * coef
        intercept_avg = w * np.array(r["svm_intercept"])
    else:
        coef_avg += w * coef
        intercept_avg += w * np.array(r["svm_intercept"])
```

A hospital with 10,000 patients influences the global model more than one with 500 — this is the standard FedAvg weighting and gives a less biased global model when site sizes differ.

#### 2.3.3. Generating plots on the server

On the first iteration, the aggregator renders bar charts with `matplotlib` and writes them into `RESULTS_DIR`:

```python
if self.num_iterations <= 1:
    self._make_plots(age_edges, age_hist, sex_counts, pasc_counts)
    self._print_description(...)
```

`_make_plots()` saves `age_distribution_federated.png`, `sex_distribution_federated.png`, and `pasc_distribution_federated.png`; `_print_description()` writes the `dataset_description_federated.txt` report. These are exactly the files listed in `RESULT_FILENAMES`.

#### 2.3.4. Convergence check

`has_converged()` is overridden to stop on either a small coefficient delta or a hard iteration cap:

```python
def has_converged(self, result, last_result) -> bool:
    it = self.num_iterations
    if last_result is not None and "svm_coef" in last_result:
        if isinstance(result, list):
            return True
        diff = np.linalg.norm(
            np.array(result["svm_coef"]) - np.array(last_result["svm_coef"])
        )
        if diff < CONVERGENCE_TOL:
            return True
    if it >= MAX_ITERATIONS:
        return True
    return False
```

#### 2.3.5. Returning the final result files

While training, `aggregation_method` returns a **dict** (the next round's global state). Once converged, it instead returns a **list of file contents** read back from disk:

```python
if not self.has_converged(result, self.latest_result):
    return result            # dict → another round
else:
    result_file_paths = [os.path.join(str(RESULTS_DIR), name)
                         for name in RESULT_FILENAMES]
    results = []
    for path in result_file_paths:
        try:
            with open(path, 'r') as f:
                results.append(f.read())
        except UnicodeDecodeError:
            with open(path, 'rb') as f:
                results.append(f.read())
    return results           # list → final output
```

Text files are read as strings, binary `.png` files fall back to bytes — matching the `output_type` list passed to `StarModel`.

### 2.4. StarModel Instantiation

```python
if __name__ == "__main__":
    StarModel(
        analyzer=HaltaAnalyzer,
        aggregator=HaltaAggregator,
        data_type='s3',
        query=[],
        multiple_results=True,
        simple_analysis=False,
        output_type=['bytes', 'str', 'bytes', 'bytes'],
        filename=RESULT_FILENAMES,
    )
```

| Parameter | Value | Purpose |
|-----------|-------|---------|
| `analyzer` | `HaltaAnalyzer` | Local statistics + training logic |
| `aggregator` | `HaltaAggregator` | Merge, plot, FedAvg, convergence |
| `data_type` | `'s3'` | Treats node data as S3-like objects |
| `query` | `[]` | No query filter applied |
| `multiple_results` | `True` | Analysis returns several files |
| `simple_analysis` | `False` | Enables multi-round (iterative) analysis |
| `output_type` | `['bytes', 'str', 'bytes', 'bytes']` | Type of each returned file |
| `filename` | `RESULT_FILENAMES` | Output names for each returned file |

**The lists must align.** `filename[i]` is saved with `output_type[i]`, and the aggregator's final `return` list must be in the same order:

| Index | `filename` | `output_type` |
|-------|-----------|---------------|
| 0 | `age_distribution_federated.png` | `bytes` |
| 1 | `dataset_description_federated.txt` | `str` |
| 2 | `pasc_distribution_federated.png` | `bytes` |
| 3 | `sex_distribution_federated.png` | `bytes` |

## 3. Key Concepts

### 3.1. Returning multiple, mixed-type files

A single FLAME analysis can emit more than one artifact. Set `multiple_results=True`, then provide `output_type` and `filename` as **parallel lists**. The aggregator's converged return value must be a list whose order matches those lists. This is how the example ships three plots and one text report from one run.

### 3.2. Privacy boundary

What **never** leaves a hospital:

❌ Raw patient rows, ages, or identifiers

What **does** get shared:

✅ Aggregate counts and fixed-bin histogram values

✅ SVM coefficients and the standard-scaler parameters (numeric vectors, not patient data)

### 3.3. Weighted vs. unweighted averaging

Plain averaging treats every node equally. Weighted FedAvg (used here) scales each node's contribution by its sample count, which produces a fairer global model when sites differ greatly in size.

## 4. Running the Example

To run this analysis you need a project set up in FLAME with nodes that have access to a `*labeled.csv` file containing at least a `pasc` label column (and ideally `age` and `sex`/`gender` columns).

See [Submitting a Project Proposal](/guide/user/project) and [Starting an Analysis](/guide/user/analysis) for the full workflow.

Before deploying, validate the pipeline locally with the [FlameSDK local testing environment](/guide/user/local-testing).

