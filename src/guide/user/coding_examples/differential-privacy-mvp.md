# Analysis Coding with Local Differential Privacy
::: warning Info
This section demonstrates the use of Local Differential Privacy in distributed analysis. The example is designed to show how to enhance privacy protection while performing federated analysis across multiple nodes.
:::

### Example Analysis using `StarLocalDPModel`: Counting Patients with Differential Privacy
This analysis example demonstrates how to count the total number of patients across multiple nodes with FHIR data, with differential privacy protections applied to the aggregated results. The patient counts from each node are summed and then noise is added to preserve privacy.

```python
from flame.star import StarLocalDPModel, StarAnalyzer, StarAggregator

# MyAnalyzer and MyAggregator classes remain unchanged from the introduction example

def main():
    """
    Sets up and initiates the distributed analysis using the FLAME components.

    - Defines the custom analyzer and aggregator classes.
    - Specifies the type of data and queries to execute.
    - Configures analysis parameters like iteration behavior and output format.
    - Applies differential privacy to protect the aggregated results.
    """
    StarLocalDPModel(
        analyzer=MyAnalyzer,             # Custom analyzer class (must inherit from StarAnalyzer)
        aggregator=MyAggregator,         # Custom aggregator class (must inherit from StarAggregator)
        data_type='fhir',                # Type of data source ('fhir' or 's3')
        query='Patient?_summary=count',  # Query or list of queries to retrieve data
        simple_analysis=True,            # True for single-iteration; False for multi-iterative analysis
        output_type='str',               # Output format for the final result ('str', 'bytes', or 'pickle')
        epsilon=1.0,                     # Privacy budget for differential privacy
        sensitivity=1.0,                 # Sensitivity parameter for differential privacy
        analyzer_kwargs=None,            # Additional keyword arguments for the custom analyzer constructor (i.e. MyAnalyzer)
        aggregator_kwargs=None           # Additional keyword arguments for the custom aggregator constructor (i.e. MyAggregator)
    )


if __name__ == "__main__":
    main()

```

### Explanation
- **`main()`-function**: Instantiates the `StarLocalDPModel` class automatically executing the analysis on the node (either as an aggregator or analyzer node).
StarLocalDPModel extends the standard StarModel by incorporating Local Differential Privacy mechanisms to enhance privacy during federated analysis.
  
This script serves as an example for performing privacy-preserving federated analysis using FHIR data with Local Differential Privacy.

### Understanding Local Differential Privacy in `StarLocalDPModel`
::: warning Info
In its current state, Local Differential Privacy is only supported for analyses that return results with a single numeric value.
:::
`StarLocalDPModel` is an enhanced version of `StarModel` that implements Local Differential Privacy (LocalDP) to strengthen privacy guarantees during distributed analysis. The key difference is the addition of calibrated noise to the final aggregated results before they are sent to the Hub.

#### Key Parameters for Differential Privacy
When using `StarLocalDPModel`, two additional parameters must be specified during instantiation:
```python
StarLocalDPModel(
    analyzer=MyAnalyzer,
    aggregator=MyAggregator,
    data_type='fhir',
    query='Patient?_summary=count',
    simple_analysis=True,
    output_type='str',
    epsilon=1.0,                     # Privacy budget for differential privacy
    sensitivity=1.0,                 # Sensitivity parameter for differential privacy
    analyzer_kwargs=None,
    aggregator_kwargs=None
)
```

#### Privacy Parameters Explained
- **`epsilon`** (Privacy Budget): Controls the privacy-utility tradeoff. Lower values provide stronger privacy protection but add more noise to the results. Higher values provide more accurate results but weaker privacy guarantees.
  - Typical values range from 0.1 (strong privacy) to 10.0 (weak privacy)
  - In this example: `epsilon=1.0` provides a moderate level of privacy
- **`sensitivity`**: Represents the maximum amount that any single individual's data can change the analysis result. This is problem-specific and should be determined based on your analysis.
  - For counting queries, sensitivity is typically 1.0 (one person can change the count by at most 1)
  - In this example: `sensitivity=1.0` is appropriate for patient counting

#### Output with Differential Privacy vs Without
- **Without Differential Privacy**: The final aggregated result is the exact sum of patient counts from all nodes.
  - Example Output: `Total Patient Count: 118`
- **With Differential Privacy**: The final aggregated result includes added noise, making it an approximate count that protects individual privacy.`
  - Example Output: `Total Patient Count (with DP): 119.1`

#### How Noise is Applied

Executing an analysis with `StarLocalDPModel` will add Laplace noise to the final results sent by the aggregator node to the Hub. The scale of the noise is calculated as:

```
noise_scale = sensitivity / epsilon
```

The Laplace distribution is then used to sample noise that is added to the aggregated result, ensuring differential privacy while maintaining statistical utility.

For more information, see the [OpenDP documentation on Laplace mechanism](https://docs.opendp.org/en/stable/api/python/opendp.measurements.html#opendp.measurements.make_laplace).

#### Benefits of Local Differential Privacy
- **Privacy Protection**: Even if an adversary has access to the final aggregated results, they cannot determine whether any specific individual's data was included in the analysis.
- **Quantifiable Privacy**: The epsilon parameter provides a mathematically rigorous measure of privacy loss.
- **Regulatory Compliance**: Helps meet privacy requirements in healthcare and other sensitive domains.
- **Trust**: Participants can be assured that their individual data cannot be reverse-engineered from the published results.

#### Considerations When Using Differential Privacy
- **Accuracy vs. Privacy Tradeoff**: Lower epsilon values provide stronger privacy but reduce result accuracy.
- **Result Interpretation**: The added noise means results are approximate. Consider running sensitivity analyses with different epsilon values.
- **Single Numeric Results**: Currently, the implementation only supports single numeric outputs. Complex multi-dimensional results are not yet supported.
- **Sensitivity Calculation**: Properly calculating sensitivity is crucial for meaningful privacy guarantees. Underestimating sensitivity can compromise privacy; overestimating it adds unnecessary noise.

