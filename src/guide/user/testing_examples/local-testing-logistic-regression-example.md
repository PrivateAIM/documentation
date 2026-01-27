# Local Testing in FLAME: Pancreatic Cancer Analysis
::: info
For an explanation of this example's main code, please refer to the [federated logistic regression coding example](../coding_examples/federated-logistic-regression.md). 
:::

## 1. Initializing Local Testing

Other than the coding example, here we simulate node-local data by loading CSV files from local directories instead of S3 buckets. The data structure mimics S3 objects by encoding the CSV content as bytes.

```python
def main():
    # Load node-local CSV files and encode as bytes
    data_1 = [{
        'pancreasData.csv':
            open('node1/pancreasData.csv').read().encode('utf-8')
    }]

    data_2 = [{
        'pancreasData.csv':
            open('node2/pancreasData.csv').read().encode('utf-8')
    }]

    # Combine node data into federated data splits
    data_splits = [data_1, data_2]

    # Run federated training
    StarModelTester(
        data_splits,                    # List of node-local datasets
        PancreasAnalyzer,               # Analyzer class
        FederatedLogisticRegression,    # Aggregator class
        's3',                           # Data source type
        simple_analysis=False,          # Multi-round analysis
        output_type='pickle',           # Output format
        result_filepath="./pancreas.pkl"# Save final model
    )
```

### 1.1. Data Preparation:

```python
data_1 = [{
    'pancreasData.csv': open('node1/pancreasData.csv').read().encode('utf-8')
}]
```

This creates a specific data structure:
- **List**: `[...]` - Each node gets one list entry
- **Dictionary**: `{'pancreasData.csv': <bytes>}` - Maps filenames to content
- **Bytes**: `.encode('utf-8')` - Converts string to bytes (simulating S3 objects)

**Why this structure?**
- Mimics real federated deployments where data comes from S3 buckets
- Each node might have multiple files (hence the dictionary)
- Bytes representation prepares for network transmission

### 1.2. StarModelTester Configuration:

| Parameter | Value | Purpose |
|-----------|-------|---------|
| `data_splits` | `[data_1, data_2]` | Two nodes (hospitals) |
| `PancreasAnalyzer` | Class | Local training logic |
| `FederatedLogisticRegression` | Class | Aggregation logic |
| `'s3'` | Data type | Treats data as S3-like objects |
| `simple_analysis=False` | Iterative | Enables multi-round training |
| `output_type='pickle'` | Format | Serializes the final model |
| `result_filepath` | Path | Saves model to disk |

## 2. Running the Example

### 2.1. Prerequisites (not mandatory, just for clarity in this example)

1. **Project structure**:
   ```
   test/
   ├── test_flame_pancreas_analysis.py
   ├── node1/
   │   └── pancreasData.csv
   └── node2/
       └── pancreasData.csv
   ```

2. **Data format** (pancreasData.csv):
   ```csv
   feature1,feature2,feature3,...,label
   0.5,1.2,3.4,...,0
   0.8,1.5,2.9,...,1
   ...
   ```
   - Multiple feature columns (patient measurements)
   - Last column is binary label (0 = healthy, 1 = disease)

### 2.2. Running the Test

```bash
cd test/
python test_flame_pancreas_analysis.py
```

### 2.3. Expected Output

```
--- Starting Iteration 0 ---
Analyzer node_0 started
	Data extracted: [{'pancreasData.csv': b'5S_rRNA,7SK,A1BG,A1BG-AS1,A1CF,A2M,A2M-AS1,A2ML1,A4GALT,A4GNT,AA06,AAAS,AACS
Analyzer node_1 started
	Data extracted: [{'pancreasData.csv': b'5S_rRNA,7SK,A1BG,A1BG-AS1,A1CF,A2M,A2M-AS1,A2ML1,A4GALT,A4GNT,AA06,AAAS,AACS
Aggregator started
--- Ending Iteration 0 ---

--- Starting Iteration 1 ---
Analyzer node_0 started
	Data extracted: [{'pancreasData.csv': b'5S_rRNA,7SK,A1BG,A1BG-AS1,A1CF,A2M,A2M-AS1,A2ML1,A4GALT,A4GNT,AA06,AAAS,AACS
Analyzer node_1 started
	Data extracted: [{'pancreasData.csv': b'5S_rRNA,7SK,A1BG,A1BG-AS1,A1CF,A2M,A2M-AS1,A2ML1,A4GALT,A4GNT,AA06,AAAS,AACS
Aggregator started
--- Ending Iteration 1 ---

*** ... (similar output for iterations 2 through 9) ... ***

--- Starting Iteration 10 ---
Analyzer node_0 started
	Data extracted: [{'pancreasData.csv': b'5S_rRNA,7SK,A1BG,A1BG-AS1,A1CF,A2M,A2M-AS1,A2ML1,A4GALT,A4GNT,AA06,AAAS,AACS
Analyzer node_1 started
	Data extracted: [{'pancreasData.csv': b'5S_rRNA,7SK,A1BG,A1BG-AS1,A1CF,A2M,A2M-AS1,A2ML1,A4GALT,A4GNT,AA06,AAAS,AACS
Aggregator started
Maximum number of 10 iterations reached. Returning current results.
Maximum number of 10 iterations reached. Returning current results.
Final result written to ./pancreas.pkl
--- Ending Iteration 10 ---

```

## 3. Loading the Trained Model

If you want to load and use the trained model later, you can do so with the following code:

```python
import pickle

# Load the trained model coefficients
with open('pancreas.pkl', 'rb') as f:
    global_coefficients = pickle.load(f)

print(f"Model coefficients: {global_coefficients}")
print(f"Shape: {global_coefficients.shape}")

# Use the model for predictions
# (You'd need to reconstruct a LogisticRegression object)
clf = LogisticRegression(fit_intercept=False)
clf.coef_ = global_coefficients
# clf.classes_ = np.array([0, 1])  # Set class labels

# predictions = clf.predict(new_patient_data)
```
