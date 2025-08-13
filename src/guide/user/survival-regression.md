# Single-round aggregation using `fedstats`

 The presented aggregation method can be used for statistical models where normality for local estimates holds. These are in particular vanilla regression models that come various types.  
This example demonstrates how to aggregate local **Cox regression** results in **FLAME** with the help of `fedstats`.We fit a Cox regression on each node and combine the coefficients by weighting them with the inverses of their variances (the diagonal elements of the Fisher information matrix). For methodological details, see [1](#ref-willer2010).

## Procedure

> [!NOTE]  
> Info about `StarAnalyzer`, `StarAggregator`, their mandatory components and the `main()` function can be found in other tutorials.

1. **Local analysis**  
   1. Load the dummy data with `load_rossi()` and randomly select 50 % of the observations to reduce the sample size.  
   2. Fit `CoxPHFitter`.  
   3. Extract the point estimates and their standard deviations.  
   4. Return the results as a list of tuples from `analysis_method()` (the format expected by the aggregator).

2. **Aggregation and comparison**  
   1. On the aggregation node, fit the same Cox model on the *full* data for reference and extract the relevant information.  
   2. Instantiate `MetaAnalysisAggregation`, call `aggregate_results()`, and retrieve the aggregated coefficients and confidence intervals.  
   3. Combine the reference and aggregated results into a single `pandas.DataFrame` that can be downloaded from the Hub UI.

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
        super().__init__(flame)  # Connects this analyzer to the FLAME components

    def analysis_method(self, data, aggregator_results):
        data = load_rossi()
        # use a fraction 50% randomly selected data
        data = data.sample(frac=0.5).reset_index(drop=True)

        cph = CoxPHFitter()
        cph.fit(data, duration_col="week", event_col="arrest")
        est, sds = cph.params_.to_list(), (cph.standard_errors_**2).to_list()
        return list(zip(est, sds))


class ResultsAggregator(StarAggregator):
    def __init__(self, flame):
        super().__init__(flame)  # Connects this aggregator to the FLAME components

    def aggregation_method(self, analysis_results):
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
        return True  # Return True as we only have one round


def main():
    StarModel(
        analyzer=LocalCoxModel,
        aggregator=ResultsAggregator,
        data_type="s3",
        simple_analysis=True,
        output_type="str",
        analyzer_kwargs=None,
        aggregator_kwargs=None,
    )


if __name__ == "__main__":
    main()
```

## References

<span id="ref-willer2010">[1]</span> Willer, Cristen J., Yun Li, and Gonçalo R. Abecasis. *METAL: fast and efficient meta-analysis of genome-wide association scans.* **Bioinformatics** 26 (17) (2010): 2190-2191.
