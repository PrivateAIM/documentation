# Single round aggregation using

This example shows how a simple aggregation of local regression results can be performed using FLAME using functionalities of `fedstats`.\
We conduct a Cox-regression at every node and aggregate the results. Aggregation is done by weighting all single coefficients by
their inverse variance (diagonal of Fisher information matrix). More details of the method can be found, for instance, in &nbsp;[1](#ref-willer2010).\

## Procedure

As this is an illustrative example, we make some simplifications concerning the data and the model.\
The full procedure is like this:

1. A Cox regression model is calculated at each node using `CoxPHFitter` from the `lifelines` package.
    1.1 Load dummy data using `load_rossi()` from the `lifelines` package and sample 50% of the data to reduce power.
    1.2 Fit the model.
    1.3 Extract relevant info from the model (point estimate and standard deviations)
    1.4 Return it as a list of tuples from `analysis_method()`, that is expected format for the aggregation.

2. Aggregation using `MetaAnalysisAggregation` from `fedstats` and compare it with full data.
    2.1 Fit model on full data (load data on aggregation node and fit again a Cox model) for reference and extract relevant info.
    2.2 Aggregate results from nodes by initializing a `MetaAnalysisAggregation` instance and use `aggregate_results()` and get relevant info.
    2.3 Return all results as one `pandas.DataFrame` that can be downloaded from the HubUI.

> [!NOTE]  
> Info about `StarAnalyzer`, `StarAggregator`, their mandatory components and the `main()` function can be found in other tutorials.

```python
from flame.star import StarModel, StarAnalyzer, StarAggregator
from lifelines import CoxPHFitter
from lifelines.datasets import load_rossi
from fedstats import MetaAnalysisAggregation
import pandas as pd


class LocalCoxModel(StarAnalyzer):
    def __init__(self, flame):
        """
        Initializes the custom Analyzer node.

        :param flame: Instance of FlameCoreSDK to interact with the FLAME components.
        """
        super().__init__(flame)  # Connects this analyzer to the FLAME components

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

        data = load_rossi()
        # use a fraction 50% randomly selected data
        data = data.sample(frac=0.5).reset_index(drop=True)

        cph = CoxPHFitter()
        cph.fit(data, duration_col="week", event_col="arrest")
        est, sds = cph.params_.to_list(), (cph.standard_errors_**2).to_list()
        return list(zip(est, sds))


class ResultsAggregator(StarAggregator):
    def __init__(self, flame):
        """
        Initializes the custom Aggregator node.

        :param flame: Instance of FlameCoreSDK to interact with the FLAME components.
        """
        super().__init__(flame)  # Connects this aggregator to the FLAME components

    def aggregation_method(self, analysis_results):
        """
        Aggregates the results received from all analyzer nodes.

        :param analysis_results: A list of analysis results from each analyzer node.
        :return: The aggregated result (e.g., total patient count across all analyzers).
        """
        # fit the model on the full data set for comparison
        data = load_rossi()
        cph = CoxPHFitter()
        cph.fit(data, duration_col="week", event_col="arrest")
        res_full_data = pd.DataFrame(
            {
                "type": "full_data",
                "name": cph.params_.index,
                "coef": cph.params_.to_numpy(),
                "ci_lower": cph.confidence_intervals_.iloc[:, 0].to_numpy(),
                "ci_upper": cph.confidence_intervals_.iloc[:, 1].to_numpy(),
            }
        )

        # aggregate results
        aggregator = MetaAnalysisAggregation(analysis_results)
        aggregator.aggregate_results()
        results_aggregated = aggregator.get_results()

        res_aggregated = pd.DataFrame(
            {
                "type": "aggregated",
                "name": cph.params_.index,
                "coef": results_aggregated["aggregated_results"],
                "ci_lower": results_aggregated["confidence_interval"][:, 0],
                "ci_upper": results_aggregated["confidence_interval"][:, 1],
            }
        )

        return pd.concat((res_full_data, res_aggregated))

    def has_converged(self, result, last_result, num_iterations):
        """
        Determines if the aggregation process has converged.

        :param result: The current aggregated result.
        :param last_result: The aggregated result from the previous iteration.
        :param num_iterations: The number of iterations completed so far.
        :return: True if the aggregation has converged; False to continue iterations.
        """
        return True  # Return True to indicate convergence in this simple analysis


def main():
    """
    Sets up and initiates the distributed analysis using the FLAME components.

    - Defines the custom analyzer and aggregator classes.
    - Specifies the type of data and queries to execute.
    - Configures analysis parameters like iteration behavior and output format.
    """
    StarModel(
        analyzer=LocalCoxModel,  # Custom analyzer class (must inherit from StarAnalyzer)
        aggregator=ResultsAggregator,  # Custom aggregator class (must inherit from StarAggregator)
        data_type="s3",  # Type of data source ('fhir' or 's3')
        # query="Patient?_summary=count",  # Query or list of queries to retrieve data
        simple_analysis=True,  # True for single-iteration; False for multi-iterative analysis
        output_type="str",  # Output format for the final result ('str', 'bytes', or 'pickle')
        analyzer_kwargs=None,  # Additional keyword arguments for the custom analyzer constructor (i.e. MyAnalyzer)
        aggregator_kwargs=None,  # Additional keyword arguments for the custom aggregator constructor (i.e. MyAggregator)
    )


if __name__ == "__main__":
    main()
```

## References

<span id="ref-willer2010">[1]</span> Willer, Cristen J., Yun Li, and Gonçalo R. Abecasis. *METAL: fast and efficient meta-analysis of genome-wide association scans.* **Bioinformatics** 26 (17) (2010): 2190-2191.
