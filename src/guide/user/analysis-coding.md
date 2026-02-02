# Analysis Coding
::: warning Info
This section is currently under development. The example provided is simple and intended to test our infrastructure.
:::
This example can be used as `entrypoint.py`, which is referenced in this documentation.

### Example Analysis using ``StarModel``: Counting Patients Using a FHIR Query

This analysis example demonstrates how to count the total number of patients across multiple nodes with FHIR data, 
with the results being summed up for aggregation.

```python
from flame.star import StarModel, StarAnalyzer, StarAggregator


class MyAnalyzer(StarAnalyzer):
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
        # TODO: Implement your analysis method
        #  in this example we retrieving first fhir dataset, extract patient counts,
        #  take total number of patients
        patient_count = float(data[0]['Patient?_summary=count']['total'])
        return patient_count


class MyAggregator(StarAggregator):
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
        # TODO: Implement your aggregation method
        #  in this example we retrieving sum up total patient counts across all nodes
        total_patient_count = sum(analysis_results)
        return total_patient_count

    def has_converged(self, result, last_result):
        """
        Determines if the aggregation process has converged.

        :param result: The current aggregated result.
        :param last_result: The aggregated result from the previous iteration.
        :return: True if the aggregation has converged; False to continue iterations.
        """
        # TODO (optional): if the parameter 'simple_analysis' in 'StarModel' is set to False,
        #  this function defines the exit criteria in a multi-iterative analysis (otherwise ignored)
        return True  # Return True to indicate convergence in this simple analysis


def main():
    """
    Sets up and initiates the distributed analysis using the FLAME components.

    - Defines the custom analyzer and aggregator classes.
    - Specifies the type of data and queries to execute.
    - Configures analysis parameters like iteration behavior and output format.
    """
    StarModel(
        analyzer=MyAnalyzer,             # Custom analyzer class (must inherit from StarAnalyzer)
        aggregator=MyAggregator,         # Custom aggregator class (must inherit from StarAggregator)
        data_type='fhir',                # Type of data source ('fhir' or 's3')
        query='Patient?_summary=count',  # Query or list of queries to retrieve data
        simple_analysis=True,            # True for single-iteration; False for multi-iterative analysis
        output_type='str',               # Output format for the final result ('str', 'bytes', or 'pickle')
        analyzer_kwargs=None,            # Additional keyword arguments for the custom analyzer constructor (i.e. MyAnalyzer)
        aggregator_kwargs=None           # Additional keyword arguments for the custom aggregator constructor (i.e. MyAggregator)
    )


if __name__ == "__main__":
    main()


```

### Explanation
- ``MyAnalyzer``: Custom class created by the user for analysis (has to inherit from ``StarAnalyzer`` and has to implement ``analysis_method()``).
  - ``analysis_method()``: Custom function processing/analyzing the nodes' data according to the user's specifications. [*In Example*: Returns the patient counts.]
    - Input-Parameters given by ``StarModel``:
      - ``data``: Contains input data either in s3 or fhir format (depending on datastore and ``data_type`` specification in the ``StarModel`` instantiation). 
      It is a list of python dictionaries, with each dictionary corresponding to one datasource within the node's datastore (often only one). 
      Each dictionary utilizes the specified query or queries specified in the ``StarModel`` instantiation (``query``). 
      For s3 data, those queries equate to the dataset filenames, for fhir they equate to the fhir-queries. If ``query=None`` is specified, 
      for s3, all available datasets will be returned using their filenames as keys, while for fhir nothing will be returned (i.e. fhir datasets require query input to return anything). 
      ```python
      data = [{<query_1_1>: <dataset_1_1>, ..., <query_n_1>: <dataset_n_1>}, ..., {<query_1_n>: <dataset_1_n>, ..., <query_n_n>: <dataset_n_n>}]
      ```
      [*In Example (for a single datasource, and a single query)*: 
      ```python
      data = [{'Patient?_summary=count': 10}]
      ```
      ]
      - ``aggregator_results``: Contains the output of the previous iteration's ``aggregation_method()`` (only used in multi-iterative analyses). 
      Can/should be used to compare results or calculate deltas from previous iterations. [*In Example*: ``aggregator_results=None``]
- ``MyAggregator``:  Custom class created by the user for aggregation (has to inherit from ``StarAggregator`` and has to implement ``aggregation_method()`` and ``has_converged()``).
  - ``aggregation_method()``: Combines results submitted by the nodes. [*In Example*: Sums the nodes' respective patient counts.]
    - Input-Parameters given by ``StarModel``:
      - ``analysis_results``: Contains results of all ``analysis_method()`` executions by the analyzer nodes. It is set as a simple list of those results, i.e. it retains no information which node sent which result. [*In Example*: Simple list of node patient counts.]
  - ``has_converged()``: Method returning a boolean value, specifiable by the user. If this returns ``True``, a multi-iterative analysis would submit its final results to the Hub, 
  and terminate its and all analysis node's executions, else it would return the aggregated results back to the analyzer nodes for the next iteration. 
  This method will only be executed if ``StarModel`` was initialized with ``simple_analysis=False``, and then starting from the second iteration.
  [*In Example*: Is set to True, but also ignored since ``simple_analysis=True`` in the ``StarModel`` instantiation in ``main()``, i.e. implying a single-iteration analysis.]
    - Input-Parameters given by ``StarModel``:
      - ``result``: Output of the current iteration's ``aggregation_method()``.
      - ``last_result``: Output of the previous iteration's ``aggregation_method()``.
- ``main()``-function: Instantiates the ``StarModel`` class automatically executing the analysis on the node (either as an aggregator or analyzer node).

This script serves as a basic "Hello World" example for performing federated analysis using FHIR data.

### Utilizing Local Differential Privacy in ``StarModel``
::: warning Info
In its current state, Local Differential Privacy is only supported for analyses that return results with a single numeric value.
:::
There currently exists an alternate version of ``StarModel`` implementing a simplified local differential privacy (LocalDP) to enhance privacy during analysis: ``StarLocalDPModel``.
In order to utilize said version, simply replace the ``StarModel`` import and instantiation in the above example with ``StarLocalDPModel``. 
During instantiation, one has to specify the parameters ``sensitivity`` and ``epsilon``, in addition to ``StarModel``'s normal parameters.
```python
from flame.star import StarLocalDPModel

StarLocalDPModel(
        ...
        epsilon=1.0,                     # Privacy budget for differential privacy
        sensitivity=1.0,                 # Sensitivity parameter for differential privacy
        ...
    )
```
Executing an analysis with ``StarLocalDPModel`` will add Laplace noise to the final results sent by the aggregator node to the Hub.
For this the given ``sensitivity`` is divided by ``epsilon`` to calculate the scale of the Laplace noise distribution. 
For more information [see 'opendp' docs](https://docs.opendp.org/en/stable/api/python/opendp.measurements.html#opendp.measurements.make_laplace)).
