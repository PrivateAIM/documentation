# Example Analysis using StarModelTester: Federated Logistic Regression


```python
import pandas as pd
import numpy as np

# Logistic regression model used for federated training
from sklearn.linear_model import LogisticRegression

# Used to load CSV data from in-memory byte streams
from io import BytesIO

# FLAME base classes for federated analysis and aggregation
from flame.star import StarAnalyzer, StarAggregator, StarModelTester

import warnings
warnings.filterwarnings('ignore')


class PancreasAnalyzer(StarAnalyzer):
    """
    Local analyzer executed independently on each federated node.
    Responsible for loading node-local data and computing model updates.
    """

    def __init__(self, flame, latest_result=None):
        # Initialize base StarAnalyzer
        super().__init__(flame)

        # Logistic regression configured for iterative federated updates
        self.clf = LogisticRegression(
            max_iter=1,           # One optimization step per federated round
            fit_intercept=False,  # Intercept omitted for simplicity
            warm_start=True       # Enables parameter reuse across iterations
        )

    def analysis_method(self, data, aggregator_results):
        """
        Performs the local training step.

        Parameters
        ----------
        data : list
            List containing dictionaries with file contents (byte-encoded).
        aggregator_results : np.ndarray
            Current global model parameters from the aggregator.

        Returns
        -------
        np.ndarray
            Updated local model coefficients.
        """

        # Load local CSV data from byte stream
        pancreas_df = pd.read_csv(BytesIO(data[0]['pancreasData.csv']))

        # Split features and labels (last column assumed to be target)
        data, labels = pancreas_df.iloc[:, :-1], pancreas_df.iloc[:, -1]

        # Initialize model coefficients with global parameters
        self.clf.coef_ = aggregator_results

        # Perform one local fitting step
        self.clf.fit(data, labels)

        # During the first iteration, no global parameters exist yet
        # In this case, use the locally initialized coefficients
        if self.num_iterations == 0:
            aggregator_results = self.clf.coef_.copy()

        # Return updated coefficients to the aggregator
        return self.clf.coef_


class FederatedLogisticRegression(StarAggregator):
    """
    Aggregator responsible for combining model updates
    and checking convergence across federated rounds.
    """

    def __init__(self, flame):
        # Initialize base StarAggregator
        super().__init__(flame)

        # Maximum number of federated iterations
        self.max_iter = 10

    def aggregation_method(self, analysis_results):
        """
        Aggregates model updates from all nodes using FedAvg.

        Parameters
        ----------
        analysis_results : list of np.ndarray
            List of coefficient arrays from each node.

        Returns
        -------
        np.ndarray
            Aggregated global model parameters.
        """

        # Stack coefficient arrays from all nodes
        coefs = np.stack(analysis_results, axis=0)

        # Compute mean across nodes (Federated Averaging)
        global_params_ = coefs.mean(axis=0)

        return global_params_

    def has_converged(self, result, last_result):
        """
        Determines whether federated training has converged.

        Convergence criteria:
        - Parameter change below tolerance
        - OR maximum number of iterations reached
        """

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


def main():
    """
    Simulates federated execution with two data-holding nodes.
    """

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

    # Run federated training using StarModelTester using simulates nodes locally
    StarModelTester(
        data_splits,                    # List of node-local datasets
        PancreasAnalyzer,               # Analyzer class
        FederatedLogisticRegression,    # Aggregator class
        's3',                           # Data source type
        simple_analysis=False,          # Multi-round analysis
        output_type='pickle',           # Output format
        result_filepath="./pancreas.pkl"# Save final model to this file
    )


if __name__ == "__main__":
    main()
```
