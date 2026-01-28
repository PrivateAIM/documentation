# FLAME Pancreas Analysis Tutorial

This guide provides a complete walkthrough of the pancreas analysis example, which demonstrates federated logistic regression using the STAR pattern. This tutorial explains how different components work together to train a machine learning model across distributed healthcare data without centralizing patient information.

## 1. Overview

This example implements **Federated Logistic Regression** for pancreas disease classification. In this scenario:
- Multiple hospitals (nodes) have local patient data with pancreas measurements
- Each hospital trains a logistic regression model on its local data
- A central aggregator combines the model updates using **Federated Averaging (FedAvg)**
- The process iterates until the global model converges
- **No patient data ever leaves the local hospitals**


### 1.1. Why Federated Learning for Healthcare?

Healthcare data is:
- **Private**: Patient data must remain at the source institution
- **Distributed**: Different hospitals have different patient populations
- **Sensitive**: Regulatory requirements (HIPAA, GDPR) restrict data sharing

Federated learning enables collaborative model training while respecting these constraints.

### 1.2. Architecture

```
┌─────────────────┐         ┌─────────────────┐
│   Hospital 1    │         │   Hospital 2    │
│                 │         │                 │
│  PancreasData   │         │  PancreasData   │
│      ↓          │         │      ↓          │
│ PancreasAnalyzer│         │ PancreasAnalyzer│
│      ↓          │         │      ↓          │
│ Local Model     │         │ Local Model     │
│  Coefficients   │         │  Coefficients   │
└────────┬────────┘         └────────┬────────┘
         │                           │
         └────────────┬──────────────┘
                      ↓
         ┌────────────────────────┐
         │   Aggregator Node      │
         │                        │
         │ FederatedLogistic      │
         │    Regression          │
         │         ↓              │
         │  Global Model          │
         │    Parameters          │
         └────────────────────────┘
                      ↓
         (Iterate until convergence)
```

## 2. Code Walkthrough

### 2.1. Imports and Setup

```python
import pandas as pd
import numpy as np
from sklearn.linear_model import LogisticRegression
from io import BytesIO
from flame.star import StarAnalyzer, StarAggregator, StarModel
```

**What's happening:**
- **pandas**: Loads and processes CSV data
- **numpy**: Handles numerical operations (arrays, linear algebra)
- **LogisticRegression**: The machine learning model we're training
- **BytesIO**: Handles in-memory byte streams (data arrives as bytes)
- **flame.star**: FLAME framework components for federated learning

### 2.2. The PancreasAnalyzer Class

The analyzer runs at each hospital and performs local training.

```python
class PancreasAnalyzer(StarAnalyzer):
    """
    Local analyzer executed independently on each federated node.
    Responsible for loading node-local data and computing model updates.
    """

    def __init__(self, flame):
        super().__init__(flame)
        
        self.clf = LogisticRegression(
            max_iter=1,           # One optimization step per federated round
            fit_intercept=False,  # Intercept omitted for simplicity
            warm_start=True       # Enables parameter reuse across iterations
        )
```


**Key Configuration Choices:**

- **`max_iter=1`**: Each federated round does ONE gradient descent step
  - Why? Because we want fine-grained synchronization between nodes
  - Each hospital updates the model slightly, then syncs with others
  
- **`fit_intercept=False`**: Simplifies the model (no bias term)
  - Makes coefficient aggregation straightforward
  - In production, you might want to include the intercept
  
- **`warm_start=True`**: Critical for federated learning!
  - Preserves model parameters between `.fit()` calls
  - Each round starts from the aggregated global parameters
  - Without this, the model would reset each time



#### 2.2.1. The Analysis Method

```python
def analysis_method(self, data, aggregator_results):
    # Load local CSV data from byte stream
    pancreas_df = pd.read_csv(BytesIO(data[0]['pancreasData.csv']))
    
    # Split features and labels (last column assumed to be target)
    data, labels = pancreas_df.iloc[:, :-1], pancreas_df.iloc[:, -1]
    
    # Initialize model coefficients with global parameters
    self.clf.coef_ = aggregator_results
    
    # Perform one local fitting step
    self.clf.fit(data, labels)
    
    # During the first iteration, no global parameters exist yet
    if self.num_iterations == 0:
        aggregator_results = self.clf.coef_.copy()
    
    # Return updated coefficients to the aggregator
    return self.clf.coef_
```

**Step-by-step breakdown:**

1. **Data Loading**:
   ```python
   pancreas_df = pd.read_csv(BytesIO(data[0]['pancreasData.csv']))
   ```
   - `data[0]` is a dictionary: `{'pancreasData.csv': <bytes>}`
   - `BytesIO()` creates an in-memory file from bytes
   - `pd.read_csv()` parses the CSV into a DataFrame

2. **Feature-Label Split**:
   ```python
   data, labels = pancreas_df.iloc[:, :-1], pancreas_df.iloc[:, -1]
   ```
   - All columns except the last are features (patient measurements)
   - Last column is the label (disease classification: 0 or 1)

3. **Initialize with Global Parameters**:
   ```python
   self.clf.coef_ = aggregator_results
   ```
   - Sets the model's starting point to the global parameters
   - This ensures all nodes start from the same synchronized state
   - On first iteration, `aggregator_results` is `None`

4. **Local Training**:
   ```python
   self.clf.fit(data, labels)
   ```
   - Performs ONE step of gradient descent (remember `max_iter=1`)
   - Updates coefficients based on local data
   - The model improves slightly based on this hospital's patients

5. **First Iteration Handling**:
   ```python
   if self.num_iterations == 0:
       aggregator_results = self.clf.coef_.copy()
   ```
   - On the first round, there's no global model yet
   - Each hospital initializes its own coefficients
   - These local initializations will be averaged to create the first global model

6. **Return Local Update**:
   ```python
   return self.clf.coef_
   ```
   - Sends the updated coefficients to the aggregator
   - These are numpy arrays with shape `(1, num_features)`

### 2.3. The FederatedLogisticRegression Aggregator

The aggregator combines updates from all hospitals.

```python
class FederatedLogisticRegression(StarAggregator):
    """
    Aggregator responsible for combining model updates
    and checking convergence across federated rounds.
    """

    def __init__(self, flame):
        super().__init__(flame)
        self.max_iter = 10  # Maximum number of federated iterations
```

**Configuration:**
- `max_iter=10`: Safety limit to prevent infinite training
- Convergence might happen earlier (see `has_converged()`)


#### 2.3.1. The Aggregation Method

```python
def aggregation_method(self, analysis_results):
    # Stack coefficient arrays from all nodes
    coefs = np.stack(analysis_results, axis=0)
    
    # Compute mean across nodes (Federated Averaging)
    global_params_ = coefs.mean(axis=0)
    
    return global_params_
```

**How Federated Averaging Works:**

Imagine two hospitals:
- Hospital 1 has coefficients: `[0.5, 0.8, 0.2]`
- Hospital 2 has coefficients: `[0.3, 0.6, 0.4]`

The aggregation computes:
```
global_model = ([0.5, 0.8, 0.2] + [0.3, 0.6, 0.4]) / 2
             = [0.4, 0.7, 0.3]
```

This global model:
- Represents knowledge from both hospitals
- Doesn't favor any single institution
- Becomes the starting point for the next training round

**Why This Works:**
- Linear models (like logistic regression) can be safely averaged
- The average of local optima approximates the global optimum
- More sophisticated aggregation schemes exist (weighted averaging, momentum, etc.)

#### 2.3.2. The Convergence Check

```python
def has_converged(self, result, last_result):
     # exclude first iteration from convergence check, because last result is None
    if last_result is None:
        return False
    # L2 norm of parameter difference
    if np.linalg.norm(result - last_result, ord=2).item() <= 1e-8:
        self.flame.flame_log(
            "Delta error is smaller than the tolerance threshold",
            log_type="info"
        )
        return True
    
    # Stop if maximum number of iterations is reached
    elif self.num_iterations > (self.max_iter - 1):
        self.flame.flame_log(
            f"Maximum number of {self.max_iter} iterations reached. "
            "Returning current results.",
            log_type="info"
        )
        return True
    
    return False
```

**Convergence Criteria Explained:**

1. **Parameter Stability**:
   ```python
   np.linalg.norm(result - last_result, ord=2) <= 1e-8
   ```
   - Computes the L2 (Euclidean) distance between consecutive models
   - If the model parameters barely change, training has converged
   - `1e-8` is a very small threshold (parameters differ by < 0.00000001)

2. **Maximum Iterations**:
   ```python
   self.num_iterations > (self.max_iter - 1)
   ```
   - Prevents infinite training loops
   - After 10 rounds, stop regardless of convergence
   - Protects against poorly-configured models

**Why Two Criteria?**
- Best case: Model converges early (saves computation)
- Worst case: Model reaches max iterations (prevents hanging)

### 2.4. StarModel Instantiation - Putting It All Together

```python
def main():
    # Run federated training
    StarModel(               
        PancreasAnalyzer,               # Analyzer class
        FederatedLogisticRegression,    # Aggregator class
        's3',                           # Data source type
        simple_analysis=False,          # Multi-round analysis
        output_type='pickle',           # Output format
    )
```

**StarModel Configuration:**

| Parameter | Value | Purpose |
|-----------|-------|---------|
| `PancreasAnalyzer` | Class | Local training logic |
| `FederatedLogisticRegression` | Class | Aggregation logic |
| `'s3'` | Data type | Treats data as S3-like objects |
| `simple_analysis=False` | Iterative | Enables multi-round training |
| `output_type='pickle'` | Format | Serializes the final model |


## 3. Training Flow Example

Let's trace through two complete iterations:

### 3.1. Iteration 0 (First Round)

1. **Hospital 1 Analyzer**:
   - Loads local pancreas data
   - `aggregator_results` is `None` (first iteration)
   - Initializes LogisticRegression and trains for 1 step
   - Returns coefficients: `coef_1 = [0.12, 0.45, 0.33, ...]`

2. **Hospital 2 Analyzer**:
   - Loads local pancreas data
   - `aggregator_results` is `None`
   - Initializes LogisticRegression and trains for 1 step
   - Returns coefficients: `coef_2 = [0.18, 0.52, 0.28, ...]`

3. **Aggregator**:
   - Receives `[coef_1, coef_2]`
   - Computes average: `global_coef = (coef_1 + coef_2) / 2`
   - Checks convergence: `last_result` is `None`, so continues
   - Returns `global_coef` to all analyzers

### 3.2. Iteration 1 (Second Round)

1. **Hospital 1 Analyzer**:
   - Loads local data again
   - `aggregator_results = global_coef` (from iteration 0)
   - Sets `self.clf.coef_ = global_coef` (warm start)
   - Trains for 1 step (refines the global model on local data)
   - Returns updated coefficients: `coef_1_new`

2. **Hospital 2 Analyzer**:
   - Loads local data again
   - `aggregator_results = global_coef`
   - Sets `self.clf.coef_ = global_coef`
   - Trains for 1 step
   - Returns updated coefficients: `coef_2_new`

3. **Aggregator**:
   - Receives `[coef_1_new, coef_2_new]`
   - Computes new average: `global_coef_new`
   - Checks convergence:
     - Computes `||global_coef_new - global_coef||`
     - If small enough, training stops
     - Otherwise, continues to iteration 2

This process repeats until convergence or max iterations.



## 4. Key Concepts Explained

### 4.1. Warm Start vs. Cold Start

Many machine learning model libraries reset their model's parameters on each `.fit()` call by default, a practice often called **Cold Start** (see Example).

#### 4.1.1. Cold Start (warm_start=False):
```
Round 1: Initialize → Train
Round 2: Initialize → Train  (loses progress!)
Round 3: Initialize → Train
```
*Here, each round starts from scratch, which is not useful for federated learning.*

Most libraries, including `sklearn`, thereby provide a **Warm Start** option. This enables the manual application of model coefficients from previous iterations.

#### 4.1.2. Warm Start (warm_start=True):
```
Round 1: Initialize → Train
Round 2: Continue from Round 1 → Train
Round 3: Continue from Round 2 → Train
```
*Each round builds on previous progress. Essential for federated learning.*

### 4.2. Why max_iter=1?

**Multiple iterations per round (max_iter=100)**:
- Each hospital trains independently for 100 steps
- Individual models diverge from each other more rapidly
- Aggregation less effective, slower convergence

**Single iteration per round (max_iter=1)**:
- Each hospital takes one small step
- Frequent synchronization keeps models aligned
- Better convergence properties

### 4.3. Data Privacy Guarantee

##### Notice what NEVER leaves each hospital:

❌ Raw patient data, able to be traced back to individuals

##### What DOES get shared:

✅ Model coefficients, not patient data (ex. numbers like `[0.4, 0.7, 0.3]`; coefficients: mathematical vector parameters used to distinguish arbitrary categories)

## 5. Running the Example

To run this example you need a project set up in FLAME with nodes that have access to pancreas data CSV files. 
How to do that look at the [Submitting a Project Proposal](/guide/user/project) and [Starting an Analysis](/guide/user/analysis)


## 6. Troubleshooting

### 6.1. Issue: "ValueError: This LogisticRegression instance is not fitted yet"

**Cause**: The model's `coef_` attribute wasn't initialized properly.

**Solution**: Ensure the first iteration handles None:
```python
if self.num_iterations == 0:
    aggregator_results = self.clf.coef_.copy()
```

### 6.2. Issue: Training never converges

**Cause**: Convergence threshold too strict or learning not effective.

**Solutions**:
1. Increase tolerance: `1e-8` → `1e-5`
2. Reduce max_iter in analyzer: Forces smaller updates
3. Check data quality: Ensure all nodes have meaningful data

### 6.3. Issue: "Shape mismatch" errors

**Cause**: Different nodes have different numbers of features.

**Solution**: Ensure all `pancreasData.csv` files have the same columns:
```python
# Validate data
pancreas_df = pd.read_csv(BytesIO(data[0]['pancreasData.csv']))
expected_features = 8  # For example
assert pancreas_df.shape[1] == expected_features + 1  # +1 for label
```

### 6.4. Issue: Poor model performance

**Possible causes:**
1. Insufficient iterations (increase `max_iter` in aggregator)
2. Unbalanced data (some nodes have very different distributions)
3. Model too simple (try more complex models)
4. Need feature engineering (normalize, add polynomial features)

**Solutions:**
```python
# Normalize features
from sklearn.preprocessing import StandardScaler

def analysis_method(self, data, aggregator_results):
    pancreas_df = pd.read_csv(BytesIO(data[0]['pancreasData.csv']))
    X, y = pancreas_df.iloc[:, :-1], pancreas_df.iloc[:, -1]
    
    # Normalize
    scaler = StandardScaler()
    X = scaler.fit_transform(X)
    
    # Continue with training...
```


## 7. Best Practices

1. **Always use warm_start=True** for iterative federated learning
2. **Set max_iter=1** in the local model for fine-grained synchronization
3. **Handle the first iteration** where aggregator_results is None
4. **Include convergence checks** to prevent infinite loops
5. **Log important events** using `self.flame.flame_log()`
6. **Validate data shapes** to catch configuration errors early
7. **Test with 2-3 nodes first** before scaling up
8. **Save intermediate results** during development for debugging
9. **Utilize [FlameSDK's built-in testing environments](/guide/user/testing_examples/local-testing-logistic-regression-example)** to simulate and test your federated pipeline execution 
10. **Integrate given class fields** (like ``self.num_iterations``) efficiently instead of creating new tracking variables with identical purpose

