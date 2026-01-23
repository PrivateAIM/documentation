# Local Testing


```python
from typing import Any, Optional

# Base classes for analyzer and aggregator logic 
from flame.star import StarAnalyzer, StarAggregator, StarModelTester


class MyAnalyzer(StarAnalyzer):
    """
    Simple Analyzer example executed once per simulated node
    and once per iteration.
    """

    def __init__(self, flame):
        # Initialize the base StarAnalyzer
        super().__init__(flame)

    def analysis_method(self, data, aggregator_results):
        """
        Performs a simple computation on local data.

        :param data: Node-local data fragment (here: a simple list of numbers)
        :param aggregator_results: Aggregated result from the previous iteration
                                   (None during the first iteration)
        :return: Local analysis result
        """

        # Log the current aggregator results for debugging
        self.flame.flame_log(
            f"\tAggregator results in MyAnalyzer: {aggregator_results}",
            log_type='debug'
        )

        # Compute the local result:
        # - First iteration: average of local data
        # - Subsequent iterations: average + previous aggregator result + 0.5
        analysis_result = (
            sum(data) / len(data)
            if aggregator_results is None
            else (sum(data) / len(data) + aggregator_results) + 1 / 2
        )

        # Log the analyzer result for this node
        self.flame.flame_log(
            f"MyAnalysis result ({self.id}): {analysis_result}",
            log_type='notice'
        )

        # Return result to the aggregator
        return analysis_result


class MyAggregator(StarAggregator):
    """
    Simple Aggregator example combining results from all analyzers.
    """

    def __init__(self, flame):
        # Initialize the base StarAggregator
        super().__init__(flame)

    def aggregation_method(self, analysis_results: list[Any]) -> Any:
        """
        Aggregates results received from analyzer nodes.

        :param analysis_results: List of results from all analyzers
        :return: Aggregated result
        """

        # Log all received analyzer results
        self.flame.flame_log(
            f"\tAnalysis results in MyAggregator: {analysis_results}",
            log_type='notice'
        )

        # Compute the average across all nodes
        result = sum(analysis_results) / len(analysis_results)

        # Log the aggregated result
        self.flame.flame_log(
            f"MyAggregator result ({self.id}): {result}",
            log_type='notice'
        )

        return result

    def has_converged(self, result: Any, last_result: Optional[Any]) -> bool:
        """
        Determines whether the iterative analysis should stop.

        :param result: Current aggregated result
        :param last_result: Aggregated result from the previous iteration
        :return: True if convergence is reached
        """

        # Log convergence-related information
        self.flame.flame_log(
            f"\tLast result: {last_result}, Current result: {result}",
            log_type="notice"
        )
        self.flame.flame_log(
            f"\tChecking convergence at iteration {self.num_iterations}",
            log_type="notice"
        )

        # Stop after 5 iterations (hard limit for testing)
        return self.num_iterations >= 5


if __name__ == "__main__":
    # Simulated node-local data fragments
    data_1 = [1, 2, 3, 4]
    data_2 = [5, 6, 7, 8]

    # Each entry represents one federated node
    data_splits = [data_1, data_2]

    # Run a local federated simulation
    StarModelTester(
        data_splits=data_splits,   # List of node-local datasets
        analyzer=MyAnalyzer,       # Custom Analyzer class
        aggregator=MyAggregator,   # Custom Aggregator class
        data_type='s3',             # Data type simulation ('s3' or 'fhir')
        simple_analysis=False       # Enables multi-iteration execution
    )
```
