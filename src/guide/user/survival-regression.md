# Single round aggregation using

This example shows how a simple aggregation of local regression results can be performed using FLAME using functionalities of `fedstats`.\
We conduct a Cox-regression at every node and aggregate the results. Aggregation is done by weighting all single coefficients by
their inverse variance (diagonal of Fisher information matrix). More details of the method can be found, for instance, in &nbsp;[1](#ref-willer2010).

## Procedure

> [!NOTE]  
> As this is an illustrative example, we make some simplifications concerning the data and the model.  
> We do not use and stored data, but use some dummy data from the `lifelines` package.
> We also run a Cox-regression and consider it as a sufficient model.

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
