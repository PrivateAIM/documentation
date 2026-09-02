# Local Testing Guide

This guide explains how to use the `StarModelTester` for local testing of federated learning algorithms using the STAR pattern before deploying to the Flame platform. For analyses built on the proxy pattern, the equivalent harness is `ProxyModelTester` — see [Testing the Proxy Pattern](#testing-the-proxy-pattern).

## Overview

The STAR (Secure Training And Aggregation for Research) pattern is a federated learning architecture where:
- **Analyzer nodes** process local data independently
- **Aggregator node** combines results from all analyzers
- The process can iterate until convergence criteria are met

The `StarModelTester` allows you to simulate this distributed architecture locally with test data, making it easy to develop and debug your federated learning algorithms.

## Quick Start

### Basic Example

```python
from flame.star import StarModelTester, StarAnalyzer, StarAggregator

# Define your custom analyzer
class MyAnalyzer(StarAnalyzer):
    def __init__(self, flame):
        super().__init__(flame)

    def analysis_method(self, data, aggregator_results):
        # Implement your analysis logic
        analysis_result = sum(data) / len(data)
        return analysis_result

# Define your custom aggregator
class MyAggregator(StarAggregator):
    def __init__(self, flame):
        super().__init__(flame)

    def aggregation_method(self, analysis_results):
        # Implement your aggregation logic
        result = sum(analysis_results) / len(analysis_results)
        return result

    def has_converged(self, result, last_result):
        # Define convergence criteria
        return self.num_iterations >= 5

# Test with local data
data_1 = [1, 2, 3, 4]
data_2 = [5, 6, 7, 8]
data_splits = [data_1, data_2]

StarModelTester(
    data_splits=data_splits,
    analyzer=MyAnalyzer,
    aggregator=MyAggregator,
    data_type='s3',
    simple_analysis=False
)
```

## Components

### 1. StarAnalyzer

The analyzer processes data at each node. You must implement the `analysis_method`.

```python
class StarAnalyzer:
    def analysis_method(self, data, aggregator_results):
        """
        Analyze local data, optionally incorporating previous aggregation results.
        
        Args:
            data: Local data for this node
            aggregator_results: Results from the previous aggregation iteration
                               (None for the first iteration)
        
        Returns:
            Analysis result (any type)
        """
        pass
```

**Key Points:**
- `data`: Your local data fragment
- `aggregator_results`: Previous round's aggregated result (None on first iteration)
- Return value will be sent to the aggregator
- Use `self.flame.flame_log()` for logging

### 2. StarAggregator

The aggregator combines results from all analyzer nodes. You must implement two methods:

```python
class StarAggregator:
    def aggregation_method(self, analysis_results):
        """
        Aggregate results from all analyzer nodes.
        
        Args:
            analysis_results: List of results from all analyzers
        
        Returns:
            Aggregated result (any type)
        """
        pass
    
    def has_converged(self, result, last_result):
        """
        Determine if the iterative process should stop.
        
        Args:
            result: Current aggregation result
            last_result: Previous aggregation result (None for first iteration)
        
        Returns:
            bool: True if converged, False otherwise
        """
        pass
```

**Key Points:**
- `analysis_results`: List containing results from all analyzer nodes
- `has_converged()`: Controls iterative training (only used when `simple_analysis=False`)
- Access `self.num_iterations` to track iteration count
- Use `self.flame.flame_log()` for logging

### 3. StarModelTester

The testing harness that simulates the distributed environment locally.

```python
StarModelTester(
    data_splits,              # List of data fragments (one per analyzer node)
    analyzer,                 # Your StarAnalyzer subclass (not an instance)
    aggregator,               # Your StarAggregator subclass (not an instance)
    data_type,                # 'fhir' or 's3'
    node_roles=None,          # Optional: Explicit role per node ('default'/'aggregator')
    query=None,               # Optional: Query string or list for FHIR
    simple_analysis=True,     # False for iterative training
    output_type='str',        # 'str', 'bytes', or 'pickle' (or a list, one per result)
    multiple_results=False,   # True if the final result is a list/tuple of separate results
    filename=None,            # Optional: Save results to file (str or list of paths)
    stream_log_level=20,      # Optional: Logging verbosity (Python logging level)
    analyzer_kwargs=None,     # Optional: Additional kwargs for analyzer
    aggregator_kwargs=None,   # Optional: Additional kwargs for aggregator
    load_checkpoint=None,     # Optional: Index of a checkpoint to resume the nodes from
    local_storage_dir=None,   # Optional: Directory simulating the nodes' local storage
    epsilon=None,             # Optional: For differential privacy
    sensitivity=None          # Optional: For differential privacy
)
```

## Parameters Explained

### Required Parameters

- **`data_splits`** (list): List of data fragments, one for each analyzer node
  ```python
  data_splits = [node1_data, node2_data, node3_data]
  ```

- **`analyzer`** (Type[StarAnalyzer]): Your custom analyzer class (not an instance)
  ```python
  analyzer=MyAnalyzer  # NOT MyAnalyzer()
  ```

- **`aggregator`** (Type[StarAggregator]): Your custom aggregator class (not an instance)
  ```python
  aggregator=MyAggregator  # NOT MyAggregator()
  ```

- **`data_type`** (Literal['fhir', 's3']): Type of data source
  - `'s3'`: Direct data objects
  - `'fhir'`: FHIR healthcare data format

### Optional Parameters

- **`query`** (str | list[str]): Query for FHIR data sources, does not change anything on your local data (for local testing only a placeholder)
  ```python
  query="Patient?_count=100"
  ```

- **`simple_analysis`** (bool, default=True): 
  - `True`: Single iteration (analyze → aggregate → done)
  - `False`: Iterative training until convergence

- **`output_type`** (Literal['str', 'bytes', 'pickle'] | list, default='str'):
  - `'str'`: Convert result to string
  - `'bytes'`: Raw bytes output
  - `'pickle'`: Serialize with pickle
  - A list of these values can be passed when `multiple_results=True`, specifying one output type per result

- **`node_roles`** (list[str]): Explicit role for each node (`'default'` for analyzers, `'aggregator'`). If omitted, all splits become analyzers and one extra aggregator node is added automatically.

- **`multiple_results`** (bool, default=False): Set to `True` when the aggregator returns a list or tuple of separate results that should each be written/printed individually.

- **`stream_log_level`** (int, default=20): Logging verbosity, using standard Python `logging` levels (e.g. `10`=DEBUG, `20`=INFO). Is currently not modeled in the MockFlameCoreSDK and doesn't change the output. 

- **`analyzer_kwargs`** (dict): Additional keyword arguments passed to analyzer constructor
  ```python
  analyzer_kwargs={'learning_rate': 0.01, 'epochs': 10}
  ```

- **`aggregator_kwargs`** (dict): Additional keyword arguments passed to aggregator constructor
  ```python
  aggregator_kwargs={'threshold': 0.001}
  ```

- **`load_checkpoint`** (int): Index of a checkpoint from a previous test run to resume the analyzer and aggregator nodes from. Requires `local_storage_dir` to point at the directory that run wrote its checkpoints to.

- **`local_storage_dir`** (str): Directory used to simulate each node's local storage. The tester creates one subdirectory per node id, and tagged saves (including checkpoints) land in a further subdirectory named after the tag. If omitted, the current working directory is used.
  ```python
  local_storage_dir='local_storage'
  ```

- **`epsilon`** (float): Privacy budget for differential privacy
- **`sensitivity`** (float): Sensitivity parameter for differential privacy
- **`filename`** (str | list[str]): Path (or list of paths) to save final results. If omitted, results are printed instead of written to disk.
  ```python
  filename='results/model_output.pkl'
  ```

## Usage Patterns

### Pattern 1: Simple Analysis (Single Iteration)

Use when you only need one round of analysis and aggregation:

```python
StarModelTester(
    data_splits=[data1, data2, data3],
    analyzer=MyAnalyzer,
    aggregator=MyAggregator,
    data_type='s3',
    simple_analysis=True  # Default
)
```

**Flow:**
1. Each analyzer processes its local data
2. Aggregator combines all results
3. Process completes

### Pattern 2: Iterative Training (Federated Learning)

Use for iterative algorithms like federated SGD:

```python
class MyAggregator(StarAggregator):
    def has_converged(self, result, last_result):
        if last_result is None:
            return False
        
        # Converge when change is small
        delta = abs(result - last_result)
        return delta < 0.001 or self.num_iterations >= 100

StarModelTester(
    data_splits=[data1, data2, data3],
    analyzer=MyAnalyzer,
    aggregator=MyAggregator,
    data_type='s3',
    simple_analysis=False  # Enable iterative mode
)
```

**Flow:**
1. Each analyzer processes local data
2. Aggregator combines results
3. Check convergence
4. If not converged, send results back to analyzers
5. Repeat from step 1

### Pattern 3: With Differential Privacy

Add privacy guarantees to your federated learning:

```python
StarModelTester(
    data_splits=[data1, data2, data3],
    analyzer=MyAnalyzer,
    aggregator=MyAggregator,
    data_type='s3',
    simple_analysis=False,
    epsilon=1.0,        # Privacy budget
    sensitivity=1.0     # Sensitivity of your computation
)
```

### Pattern 4: Saving Results

Save final results to a file:

```python
StarModelTester(
    data_splits=[data1, data2],
    analyzer=MyAnalyzer,
    aggregator=MyAggregator,
    data_type='s3',
    output_type='pickle',
    filename='results/trained_model.pkl'
)
```

### Pattern 5: Checkpointing and Resuming

Nodes can persist their state after every iteration and a later run can pick it back up. Enable it by overriding
`should_checkpoint()` on your analyzer and/or aggregator, and give the tester a directory to use as the nodes' local
storage:

```python
class MyAnalyzer(StarAnalyzer):
    def should_checkpoint(self) -> bool:
        return True

# First run: writes checkpoints into ./local_storage/<node_id>/checkpoint-<n>-end/
StarModelTester(
    data_splits=[data1, data2],
    analyzer=MyAnalyzer,
    aggregator=MyAggregator,
    data_type='s3',
    simple_analysis=False,
    local_storage_dir='local_storage'
)

# Later run: resumes every node from its first checkpoint
StarModelTester(
    data_splits=[data1, data2],
    analyzer=MyAnalyzer,
    aggregator=MyAggregator,
    data_type='s3',
    simple_analysis=False,
    local_storage_dir='local_storage',
    load_checkpoint=1
)
```

All non-callable attributes of the node object are saved, except the protected `id`, `role`, `finished`,
`partner_node_ids`, and `flame`. See [Checkpointing](/guide/user/analysis-coding#checkpointing) for how this behaves on
the platform.

::: warning Info
The local storage of the `MockFlameCoreSDK` writes plain pickle files to disk and, unlike the real node storage, does
not snapshot the files your analysis wrote. Use it to verify that your state is restored correctly, not as a
performance or security equivalent of the platform.
:::

## Testing the Proxy Pattern

Analyses built on the [proxy pattern](/guide/user/proxy-analysis-coding) are tested with `ProxyModelTester`, which
takes the same arguments as `StarModelTester` plus the proxy class and the proxy count:

```python
from flame.proxy import ProxyModelTester, ProxyAnalyzer, Proxy, ProxyAggregator


class MyAnalyzer(ProxyAnalyzer):
    def analysis_method(self, data, aggregator_results):
        return float(data[0]['Patient?_summary=count']['total'])


class MyProxy(Proxy):
    def proxy_aggregation_method(self, analysis_results):
        return sum(analysis_results)


class MyAggregator(ProxyAggregator):
    def aggregation_method(self, proxy_results):
        return sum(proxy_results)

    def has_converged(self, result, last_result):
        return self.num_iterations >= 2


data = [[{'Patient?_summary=count': {'total': 10}}],
        [{'Patient?_summary=count': {'total': 18}}],
        [{'Patient?_summary=count': {'total': 24}}],
        [{'Patient?_summary=count': {'total': 7}}]]

ProxyModelTester(
    data_splits=data,
    analyzer=MyAnalyzer,
    proxy=MyProxy,
    aggregator=MyAggregator,
    data_type='fhir',
    num_proxy_nodes=2,
    simple_analysis=False
)
```

The tester spawns one node per data split as an analyzer, plus `num_proxy_nodes` proxy nodes and one aggregator node,
each in its own thread. The proxy nodes are created without data, which is what makes them take on the `'proxy'` role,
so **you do not add data splits for them** — `data_splits` only ever describes the analyzers.

Differences to `StarModelTester`:

- **`proxy`** (Type[Proxy]): required, your custom proxy class (not an instance)
- **`num_proxy_nodes`** (int, default=1): number of proxy nodes to simulate; must be at most the number of data splits
- **`proxy_kwargs`** (dict): additional keyword arguments passed to the proxy constructor
- **`mapping_method`** (callable): analyzer-to-proxy assignment, defaulting to round-robin
- `load_checkpoint`, `local_storage_dir`, `epsilon`, and `sensitivity` are **not** available — checkpointing and local
  differential privacy are not yet implemented for the proxy pattern

## Complete Working Example

Here's a complete example implementing federated averaging for numeric data:

```python
from typing import Any, Optional
from flame.star import StarModelTester, StarAnalyzer, StarAggregator


class MyAnalyzer(StarAnalyzer):
    """Analyzer that computes local statistics and incorporates global feedback."""
    
    def __init__(self, flame):
        super().__init__(flame)

       def analysis_method(self, data, aggregator_results):
            """
            Performs analysis on the retrieved data from data sources.
    
            :param data: A list of dictionaries containing the data from each data source.
                         - Each dictionary corresponds to a data source.
                         - Keys are the queries executed, and values are the results (dict for FHIR, str for S3).
            :param aggregator_results: Results from the aggregator in previous iterations.
                                       - None in the first iteration.
                                       - Contains the result from the aggregator's aggregation_method in subsequent iterations.
            :return: Any result of your analysis on one node (ex. patient count).
            """
        
            patient_count = float(data[0]['Patient?_summary=count']['total'])
            return patient_count


class MyAggregator(StarAggregator):
    """Aggregator that computes global average and checks convergence."""
    
    def __init__(self, flame):
        super().__init__(flame)

        def aggregation_method(self, analysis_results):
            """
            Aggregates the results received from all analyzer nodes.
        
            :param analysis_results: A list of analysis results from each analyzer node.
            :return: The aggregated result (e.g., total patient count across all analyzers).
            """
            total_patient_count = sum(analysis_results)
            return total_patient_count


    def has_converged(self, result: Any, last_result: Optional[Any]) -> bool:
        """Check if training should stop."""
        self.flame.flame_log(
            f"\tLast result: {last_result}, Current result: {result}", 
            log_type="notice"
        )
        self.flame.flame_log(
            f"\tChecking convergence at iteration {self.num_iterations}", 
            log_type="notice"
        )
        
        # Stop after 5 iterations for this example
        return self.num_iterations >= 5


if __name__ == "__main__":
    # Prepare test data (simulating data from different nodes)
    data = [[{'Patient?_summary=count': {'total': 10}}],
            [{'Patient?_summary=count': {'total': 18}}]]

    # Run the test
    StarModelTester(
        data_splits=data,
        analyzer=MyAnalyzer,
        aggregator=MyAggregator,
        data_type='s3',
        simple_analysis=False
    )
```

## Logging and Debugging

Use the flame logging system for debugging:

```python
# In your analyzer or aggregator
self.flame.flame_log("Debug message", log_type='debug')   # Detailed info
self.flame.flame_log("Notice message", log_type='notice')  # Important info
```

### Useful Properties

Access these properties in your analyzer or aggregator:

- `self.id`: Node identifier
- `self.num_iterations`: Current iteration count
- `self.latest_result`: Result from previous iteration
- `self.role`: 'default' (analyzer) or 'aggregator'

## Best Practices

1. **Start Simple**: Test with `simple_analysis=True` first to verify your logic
2. **Add Logging**: Use `flame_log()` to track data flow and debug issues
3. **Test Data Splits**: Ensure each data split is representative
4. **Convergence Criteria**: Set reasonable convergence conditions to avoid infinite loops
5. **Type Hints**: Use type hints for better code documentation
6. **Handle None**: Always check if `aggregator_results` or `last_result` is None

## Common Pitfalls

❌ **Don't instantiate classes:**
```python
StarModelTester(..., analyzer=MyAnalyzer(), ...)  # Wrong!
```

✅ **Pass the class itself:**
```python
StarModelTester(..., analyzer=MyAnalyzer, ...)  # Correct!
```

❌ **Don't forget to call super().__init__():**
```python
class MyAnalyzer(StarAnalyzer):
    def __init__(self, flame):
        # Missing super().__init__(flame)
        pass
```

✅ **Always call parent constructor:**
```python
class MyAnalyzer(StarAnalyzer):
    def __init__(self, flame):
        super().__init__(flame)  # Correct!
```

## Next Steps

After testing locally with `StarModelTester`:

1. Deploy your analyzer and aggregator to the Flame platform
2. Use `StarModel` instead of `StarModelTester` for production (respectively `ProxyModel` instead of `ProxyModelTester`)
3. Configure real data sources (FHIR servers, S3 buckets)
4. Set up proper node authentication and security

## Additional Resources

- Main STAR model implementation: `flame/star/star_model.py`
- Proxy model implementation: `flame/proxy/proxy_model.py`
- Differential privacy variant: `flame/star/star_localdp/`
- More examples: `examples/` directory

## Troubleshooting

**Issue**: Infinite loop in iterative mode
- **Solution**: Check your `has_converged()` implementation. Add a maximum iteration limit:
  ```python
  return self.num_iterations >= MAX_ITERATIONS
  ```

**Issue**: Type errors with aggregator_results
- **Solution**: Always handle the None case:
  ```python
  if aggregator_results is None:
      # First iteration logic
  else:
      # Subsequent iteration logic
  ```

**Issue**: Data not being passed correctly
- **Solution**: Verify `data_type` matches your data format ('fhir' or 's3')

---

For more information, see the main repository README or contact the Flame development team.

