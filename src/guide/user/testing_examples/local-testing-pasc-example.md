# Local Testing in FLAME: Long COVID (PASC) Analysis

::: info
For an explanation of this example's main code, please refer to the [HALTA Long COVID (PASC) coding example](/guide/user/coding_examples/pasc-long-covid-analysis).
:::

This page shows **only what changes** when you take the deployed `run_e2e.py` pipeline and run it locally with `StarModelTester`. The analyzer and aggregator classes are reused unchanged. You can import them straight from the coding example.

## 1. What Changes from `run_e2e.py`

Local testing requires two edits and nothing else:

1. Import **`StarModelTester`** instead of `StarModel`, and reuse the existing analyzer/aggregator classes.
2. Build **`data_splits`** by loading node-local CSV files from disk and pass `data_splits` to `StarModelTester` to simulating S3 objects.

### 1.1. The full test file

```python
"""HALTA-FLAME: Federated Long COVID (PASC) analysis pipeline."""
from flame.star import StarModelTester
from examples.run_e2e import HaltaAnalyzer, HaltaAggregator, RESULT_FILENAMES


if __name__ == "__main__":
    data = [[{'synthetic_eucare_1_labeled.csv': open('test/data/node1/synthetic_eucare_1_labeled.csv', 'rb').read()}],
            [{'synthetic_eucare_2_labeled.csv': open('test/data/node2/synthetic_eucare_2_labeled.csv', 'rb').read()}]]

    StarModelTester(
        data_splits=data,
        analyzer=HaltaAnalyzer,
        aggregator=HaltaAggregator,
        data_type='s3',
        query=[],
        multiple_results=True,
        simple_analysis=False,
        output_type=['bytes', 'str', 'bytes', 'bytes'],
        filename=['test/results/' + f for f in RESULT_FILENAMES]
    )
```

### 1.2. Change 1 — Import `StarModelTester` and reuse the classes

```python
# run_e2e.py
from flame.star import StarModel, StarAnalyzer, StarAggregator
# ... full HaltaAnalyzer / HaltaAggregator class definitions ...

# test_e2e.py
from flame.star import StarModelTester
from examples.run_e2e import HaltaAnalyzer, HaltaAggregator, RESULT_FILENAMES
```

The analyzer and aggregator are **not redefined** — they are imported from `run_e2e.py`. The test file therefore stays tiny and always tests the exact code you deploy.

### 1.3. Change 2 — Provide node data locally

In `run_e2e.py` the node data comes from S3. For local testing you supply it yourself as `data_splits` — a list with **one entry per node**, each entry mirroring the `data` structure the analyzer expects:

```python
data = [
    [{'synthetic_eucare_1_labeled.csv': open('test/data/node1/synthetic_eucare_1_labeled.csv', 'rb').read()}],
    [{'synthetic_eucare_2_labeled.csv': open('test/data/node2/synthetic_eucare_2_labeled.csv', 'rb').read()}],
]
```

- **Outer list**: one element per simulated node (here, two hospitals)
- **Inner list + dict**: `[{'<filename>': <bytes>}]` — matches `data[0]` inside `analysis_method`
- **`open(..., 'rb').read()`**: reads the CSV as raw bytes, mimicking an S3 object

The file name still ends in `labeled.csv`, so the analyzer's `k.endswith('labeled.csv')` lookup works without modification.

### 1.4. Change 3 — Call `StarModelTester`

```python
# run_e2e.py
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

# test_e2e.py
StarModelTester(
    data_splits=data,                                       # added
    analyzer=HaltaAnalyzer,
    aggregator=HaltaAggregator,
    data_type='s3',
    query=[],
    multiple_results=True,
    simple_analysis=False,
    output_type=['bytes', 'str', 'bytes', 'bytes'],
    filename=['test/results/' + f for f in RESULT_FILENAMES],  # changed
)
```

Only two arguments differ:

| Argument | `run_e2e.py` | `test_e2e.py` |
|----------|--------------|---------------|
| `data_splits` | — (data comes from S3) | `data` — the local node datasets |
| `filename` | `RESULT_FILENAMES` | `RESULT_FILENAMES` prefixed with `test/results/` |

Every other argument (`data_type`, `query`, `multiple_results`, `simple_analysis`, `output_type`) is **identical** — the tester runs the same iterative, multi-result pipeline as the real deployment.

## 2. Running the Example

### 2.1. Project structure

```
flame-patterns/
├── examples/
│   └── run_e2e.py
├── test/
│   ├── test_e2e.py
│   ├── data/
│   │   ├── node1/synthetic_eucare_1_labeled.csv
│   │   └── node2/synthetic_eucare_2_labeled.csv
│   └── results/          # plots + report are written here
```

The `test/results/` directory receives the four artifacts defined in `RESULT_FILENAMES` (three `.png` plots and one `.txt` report).

### 2.2. Running the test

Run it as a plain script inside the project's environment:

```bash
poetry run python test/test_e2e.py
```

### 2.3. Expected output

The tester prints each iteration as the federated SVM trains and converges:

```
--- Starting Iteration 0 ---
Analyzer node_0 started
Analyzer node_1 started
Aggregator started
--- Ending Iteration 0 ---

*** ... (iterations 1 through N) ... ***

Converged at iteration N (delta=0.000082 < 0.0001)

------------------------------------------------------------
  Final Federated SVM Model
------------------------------------------------------------
  Iterations:        N
  Nodes:             2
  Avg accuracy:      0.87...
------------------------------------------------------------
```

Afterwards, `test/results/` contains the federated age, sex, and PASC distribution plots plus `dataset_description_federated.txt`.
