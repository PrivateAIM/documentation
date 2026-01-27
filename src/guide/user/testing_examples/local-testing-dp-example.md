# Local Testing in FLAME: Star Pattern with Differential Privacy

::: info
For an explanation of differential privacy concepts and the Star pattern, please refer to the [Star Pattern Testing Guide](./TEST_STAR_PATTERN.md) and [Differential Privacy Documentation](../examples/run_star_model_dp.md). 
:::

## 1. Initializing Local Testing with Differential Privacy

This example demonstrates how to test federated learning with **Local Differential Privacy** locally before deployment. Unlike regular Star pattern testing, this adds calibrated noise to aggregated results to prevent reverse-engineering of individual node contributions.

```python
from typing import Any, Optional
from flame.star import StarModelTester, StarAnalyzer, StarAggregator


class MyAnalyzer(StarAnalyzer):
    def __init__(self, flame):
        super().__init__(flame)

    def analysis_method(self, data, aggregator_results):
        self.flame.flame_log(f"\tAggregator results in MyAnalyzer: {aggregator_results}", log_type='debug')
        analysis_result = sum(data) / len(data) \
            if aggregator_results is None \
            else (sum(data) / len(data) + aggregator_results) + 1 / 2
        self.flame.flame_log(f"MyAnalysis result ({self.id}): {analysis_result}", log_type='notice')
        return analysis_result


class MyAggregator(StarAggregator):
    def __init__(self, flame):
        super().__init__(flame)

    def aggregation_method(self, analysis_results: list[Any]) -> Any:
        self.flame.flame_log(f"\tAnalysis results in MyAggregator: {analysis_results}", log_type='notice')
        result = sum(analysis_results) / len(analysis_results)
        self.flame.flame_log(f"MyAggregator result ({self.id}): {result}", log_type='notice')
        return result

    def has_converged(self, result: Any, last_result: Optional[Any]) -> bool:
        self.flame.flame_log(f"\tLast result: {last_result}, Current result: {result}", log_type="notice")
        self.flame.flame_log(f"\tChecking convergence at iteration {self.num_iterations}", log_type="notice")
        return self.num_iterations >= 5  # Limit to 5 iterations for testing


if __name__ == "__main__":
    data_1 = [1, 2, 3, 4]
    data_2 = [5, 6, 7, 8]
    data_splits = [data_1, data_2]

    StarModelTester(
        data_splits=data_splits,     # List of node-local datasets
        analyzer=MyAnalyzer,         # Custom Analyzer class
        aggregator=MyAggregator,     # Custom Aggregator class
        data_type='s3',              # Data source type
        simple_analysis=False,       # Enable multi-iteration training
        epsilon=1,                   # Privacy budget
        sensitivity=1                # Sensitivity parameter (10**0 = 1)
    )
```

### 1.1. Data Preparation:

```python
data_1 = [1, 2, 3, 4]
data_2 = [5, 6, 7, 8]
data_splits = [data_1, data_2]
```

This creates a simple data structure for testing:
- **`data_1`**: Simulates data from Node 1 (e.g., Hospital A)
- **`data_2`**: Simulates data from Node 2 (e.g., Hospital B)
- **`data_splits`**: List where each element represents one node's local data

**Why this structure?**
- Mimics federated deployments where each node has isolated data
- Simple numeric lists make it easy to verify differential privacy noise
- Each node processes data independently before aggregation

### 1.2. StarModelTester Configuration with Differential Privacy:

| Parameter | Value | Purpose |
|-----------|-------|---------|
| `data_splits` | `[data_1, data_2]` | Two nodes with local data |
| `MyAnalyzer` | Class | Local analysis logic at each node |
| `MyAggregator` | Class | Global aggregation logic |
| `'s3'` | Data type | Treats data as direct objects |
| `simple_analysis=False` | Iterative | Enables multi-round federated learning |
| `epsilon=1` | Privacy budget | Moderate privacy protection |
| `sensitivity=1` | Sensitivity | Max individual contribution (10**0 = 1) |

**Key Difference from Regular Star Pattern:**
- **`epsilon`** and **`sensitivity`** parameters enable differential privacy
- Laplace noise is automatically added to aggregated results
- Noise scale = `sensitivity / epsilon = 1 / 1 = 1.0`

## 2. Understanding the Analysis Logic

### 2.1. MyAnalyzer Class

```python
def analysis_method(self, data, aggregator_results):
    analysis_result = sum(data) / len(data) \
        if aggregator_results is None \
        else (sum(data) / len(data) + aggregator_results) + 1 / 2
    return analysis_result
```

**Iteration 0 (First Round):**
- `aggregator_results` is `None`
- Node 1: `sum([1,2,3,4]) / 4 = 2.5`
- Node 2: `sum([5,6,7,8]) / 4 = 6.5`

**Subsequent Iterations:**
- Uses feedback from previous aggregation
- Blends local average with global result
- Formula: `(local_avg + global_result) + 0.5`

**Example for Node 1 in Iteration 1:**
```python
local_avg = 2.5
global_result = 4.5 (from Iteration 0, with noise)
analysis_result = (2.5 + 4.5) + 0.5 = 7.5
```

### 2.2. MyAggregator Class

```python
def aggregation_method(self, analysis_results):
    result = sum(analysis_results) / len(analysis_results)
    return result
```

**Iteration 0 Example:**
- Receives: `[2.5, 6.5]` from both analyzers
- Computes: `(2.5 + 6.5) / 2 = 4.5` (true result)
- **DP Noise Added**: Result becomes `4.5 + noise` (e.g., `4.523891`)
- Returns noisy result to nodes

**How Differential Privacy Works:**
1. Aggregator computes true result: `4.5`
2. System samples noise: `Laplace(scale=1.0)` → e.g., `+0.024`
3. Noisy result sent to Hub and back to analyzers: `4.524`

### 2.3. Convergence Logic

```python
def has_converged(self, result, last_result):
    return self.num_iterations >= 5
```

**Simple iteration-based stopping:**
- Stops after 5 iterations
- More sophisticated approaches could check:
  - Change between iterations: `abs(result - last_result) < threshold`
  - But must account for DP noise in threshold!

## 3. Running the Example

### 3.1. Prerequisites

1. **Project structure**:
   ```
   test/
   └── test_star_pattern_dp.py
   ```

2. **Dependencies**:
   - `flame` package with Star pattern support
   - `opendp` library (for Laplace noise generation)

### 3.2. Running the Test

```bash
cd test/
python test_star_pattern_dp.py
```

### 3.3. Expected Output

```
--- Starting Iteration 0 ---
Analyzer node_0 started
        Data extracted: [1, 2, 3, 4]
        Aggregator results in MyAnalyzer: None
MyAnalysis result (node_0): 2.5
Analyzer node_1 started
        Data extracted: [5, 6, 7, 8]
        Aggregator results in MyAnalyzer: None
MyAnalysis result (node_1): 6.5
Aggregator started
        Analysis results in MyAggregator: [2.5, 6.5]
MyAggregator result (node_2): 4.5
        Last result: None, Current result: 4.5
        Checking convergence at iteration 0
Aggregated results: 4.5
--- Ending Iteration 0 ---

--- Starting Iteration 1 ---
Analyzer node_0 started
        Data extracted: [1, 2, 3, 4]
        Aggregator results in MyAnalyzer: 4.5
MyAnalysis result (node_0): 7.5
Analyzer node_1 started
        Data extracted: [5, 6, 7, 8]
        Aggregator results in MyAnalyzer: 4.5
MyAnalysis result (node_1): 11.5
Aggregator started
        Analysis results in MyAggregator: [7.5, 11.5]
MyAggregator result (node_2): 9.5
        Last result: 4.5, Current result: 9.5
        Checking convergence at iteration 1
Aggregated results: 9.5
        Last result: 4.5, Current result: 9.5
        Checking convergence at iteration 1
--- Ending Iteration 1 ---

--- Starting Iteration 2 ---
Analyzer node_0 started
        Data extracted: [1, 2, 3, 4]
        Aggregator results in MyAnalyzer: 9.5
MyAnalysis result (node_0): 12.5
Analyzer node_1 started
        Data extracted: [5, 6, 7, 8]
        Aggregator results in MyAnalyzer: 9.5
MyAnalysis result (node_1): 16.5
Aggregator started
        Analysis results in MyAggregator: [12.5, 16.5]
MyAggregator result (node_2): 14.5
        Last result: 9.5, Current result: 14.5
        Checking convergence at iteration 2
Aggregated results: 14.5
        Last result: 9.5, Current result: 14.5
        Checking convergence at iteration 2
--- Ending Iteration 2 ---

--- Starting Iteration 3 ---
Analyzer node_0 started
        Data extracted: [1, 2, 3, 4]
        Aggregator results in MyAnalyzer: 14.5
MyAnalysis result (node_0): 17.5
Analyzer node_1 started
        Data extracted: [5, 6, 7, 8]
        Aggregator results in MyAnalyzer: 14.5
MyAnalysis result (node_1): 21.5
Aggregator started
        Analysis results in MyAggregator: [17.5, 21.5]
MyAggregator result (node_2): 19.5
        Last result: 14.5, Current result: 19.5
        Checking convergence at iteration 3
Aggregated results: 19.5
        Last result: 14.5, Current result: 19.5
        Checking convergence at iteration 3
--- Ending Iteration 3 ---

--- Starting Iteration 4 ---
Analyzer node_0 started
        Data extracted: [1, 2, 3, 4]
        Aggregator results in MyAnalyzer: 19.5
MyAnalysis result (node_0): 22.5
Analyzer node_1 started
        Data extracted: [5, 6, 7, 8]
        Aggregator results in MyAnalyzer: 19.5
MyAnalysis result (node_1): 26.5
Aggregator started
        Analysis results in MyAggregator: [22.5, 26.5]
MyAggregator result (node_2): 24.5
        Last result: 19.5, Current result: 24.5
        Checking convergence at iteration 4
Aggregated results: 24.5
        Last result: 19.5, Current result: 24.5
        Checking convergence at iteration 4
--- Ending Iteration 4 ---

--- Starting Iteration 5 ---
Analyzer node_0 started
        Data extracted: [1, 2, 3, 4]
        Aggregator results in MyAnalyzer: 24.5
MyAnalysis result (node_0): 27.5
Analyzer node_1 started
        Data extracted: [5, 6, 7, 8]
        Aggregator results in MyAnalyzer: 24.5
MyAnalysis result (node_1): 31.5
Aggregator started
        Analysis results in MyAggregator: [27.5, 31.5]
MyAggregator result (node_2): 29.5
        Last result: 24.5, Current result: 29.5
        Checking convergence at iteration 5
Aggregated results: 29.5
        Test mode: Would apply local DP with epsilon=1 and sensitivity=1
        Last result: 24.5, Current result: 30.186171397668105
        Checking convergence at iteration 5
Final result: 30.186171397668105
--- Ending Iteration 5 ---

```

### 3.4. Analyzing the Output

**Key Observations:**

1. **Differential Privacy Noise in Action:**
   - True result (Iteration 5): `29.5`
   - Noisy result: `30.186171397668105`
   - Noise added: `~0.686` from Laplace distribution

2. **Noise added at the last Iteration:**
   - Only the final aggregated result has DP noise
   - Intermediate results are exact averages

3. **Privacy Preserved:**
   - Cannot determine exact individual node contributions from aggregated results
   - Noise makes it infeasible to reverse-engineer original data

## 4. Best Practices for DP Testing

### 4.1. Start Without Privacy

```python
# Step 1: Test basic logic without DP
StarModelTester(..., simple_analysis=False)  # No epsilon/sensitivity

# Step 2: Add weak DP to verify it works
StarModelTester(..., epsilon=10, sensitivity=1)

# Step 3: Use realistic privacy levels
StarModelTester(..., epsilon=1, sensitivity=1)
```

### 4.2. Document Your Privacy Choices

```python
"""
Privacy Parameters:
- epsilon = 1.0 (moderate privacy)
- sensitivity = 1.0 (assuming max individual contribution of 1)
- Total privacy budget: epsilon * num_iterations = 1.0 * 5 = 5.0
- Rationale: Balances utility with privacy for testing purposes
"""
```

### 4.3. Validate Noise Impact (only during testing)

Add logging to track noise (you must not do so productively):
```python
def aggregation_method(self, analysis_results):
    true_result = sum(analysis_results) / len(analysis_results)
    self.flame.flame_log(
        f"True result before DP noise: {true_result}", 
        log_type='notice'
    )
    return true_result
    # DP noise added automatically after this method returns
```

### 4.4. Test Multiple Runs
Since DP adds random noise, run multiple times:
```bash
for i in {1..10}; do
    echo "Run $i"
    python test_star_pattern_dp.py
done
```
Collect results to understand noise distribution and variability.

## 5. Common Issues and Solutions

### Issue 1: Results Too Noisy to Converge
**Problem:**
```python
epsilon=0.1  # Very strong privacy
# Noise is so large that convergence criteria never met
```

**Solution:**
```python
# Either increase epsilon (weaker privacy)
epsilon=1.0

# Or use iteration-based stopping
def has_converged(self, result, last_result):
    return self.num_iterations >= 10  # Don't rely on value changes
```

### Issue 2: Privacy Budget Concerns
**Problem:**
Multiple iterations consume privacy budget additively.

**Solution:**
```python
# Allocate budget per iteration
total_epsilon = 1.0
num_iterations = 5
epsilon_per_iteration = total_epsilon / num_iterations  # 0.2

# Or stop early to preserve budget
def has_converged(self, result, last_result):
    privacy_budget_used = self.num_iterations * self.epsilon
    return privacy_budget_used >= 1.0  # Stop when budget exhausted
```

### Issue 3: Incorrect Sensitivity
**Problem:**
```python
sensitivity=1  # But data actually ranges 0-100
# Privacy guarantee is compromised!
```

**Solution:**
```python
# Calculate proper sensitivity
data_range = max_value - min_value  # 100 - 0 = 100
num_nodes = len(data_splits)  # 2
sensitivity = data_range / num_nodes  # 100 / 2 = 50

StarModelTester(..., sensitivity=50)
```

### Issue 4: Non-Numeric Results
**Problem:**
```python
def aggregation_method(self, analysis_results):
    return {"mean": 4.5, "std": 1.2}  # Dict not supported!
```

**Solution:**
```python
def aggregation_method(self, analysis_results):
    return sum(analysis_results) / len(analysis_results)  # Single number only
```

## 6. Next Steps

### 6.1. Move to Production

After local testing succeeds:

1. **Replace `StarModelTester` with `StarLocalDPModel`**:
   ```python
   from flame.star import StarLocalDPModel
   
   StarLocalDPModel(
       analyzer=MyAnalyzer,
       aggregator=MyAggregator,
       data_type='fhir',  # Real FHIR server
       query='Patient?_summary=count',
       simple_analysis=False,
       epsilon=1.0,
       sensitivity=1.0
   )
   ```
2. **Configure real data sources** (FHIR servers, S3 buckets)
3. **Ensure no logging of true results in production!**
