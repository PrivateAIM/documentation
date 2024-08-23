# Analysis Coding
::: warning Info
This section is currently under development. The example provided is simple and intended to test our infrastructure.
:::
This example can be used as `entrypoint.py`, which is referenced in this documentation.

### Example Analysis: Counting Patients Using a FHIR Query

This analysis example demonstrates how to count the number of patients matching a specific FHIR query across multiple nodes,
with the results being aggregated.

```python
import ast
import time

from flame.schemas.star import StarModel, StarAnalyzer, StarAggregator


class MyAnalyzer(StarAnalyzer):
    def __init__(self, flame):
        super().__init__(flame)
        pass

    def analysis_method(self, data, aggregator_results):
        # data = {query1: fhir_data1, query2: fhir_data2, etc.}, if query had multiple entries
        # data = fhir_data, else
        results = {}
        for k, v in data.items():
            results[k] = v['total']
        return results
        # return  # TODO: Implement your analysis method here


class MyAggregator(StarAggregator):
    def __init__(self, flame):
        super().__init__(flame)
        pass

    def aggregation_method(self, analysis_results):
        out_print = ''

        analysis_results = [ast.literal_eval(res) for res in analysis_results]
        for key in analysis_results[0].keys():
            results_of_all_nodes_k = sum([float(res[key]) for res in analysis_results])
            out_print += f'{key}:\n' \
                         f'\tTotal number of patients in {len(analysis_results)} hospitals: {results_of_all_nodes_k}\n'
        return out_print
        # return  # TODO: Implement your aggregation method here

    def has_converged(self, result, last_result):
        return True
        # return  # TODO: Want to risk it and go for a machine learning pipeline? This here, would be your exit criteria.


def main():
    starmodel = StarModel()

    if starmodel.is_analyzer():
        print("Analyzer started")
        my_analyzer = MyAnalyzer  # or MyAnalyzer(starmodel.flame, **kwargs), if implemented with custom params
        queries = ['Patient?birthdate=ge1990-01-01&_has:Condition:subject:code=73595000',
                   'Patient?birthdate=ge2010-01-01&_has:Condition:subject:code=73595000']  # TODO: What do we want?
        starmodel.start_analyzer(my_analyzer, query=queries)  # TODO: Fill in query or queries here
    elif starmodel.is_aggregator():
        print("Aggregator started")
        my_aggregator = MyAggregator
        starmodel.start_aggregator(my_aggregator)
    else:
        raise BrokenPipeError("Has to be either analyzer or aggregator")

    print("Analysis finished!")
    time.sleep(5)


if __name__ == "__main__":
    main()



```

### Explanation
	•	MyAnalyzer: Processes data from the nodes, counting the relevant patient records.
	•	MyAggregator: Combines results from all nodes and sums the patient counts.
	•	Main Function: Determines whether the script runs as an analyzer or aggregator and executes accordingly.

This script serves as a basic template for performing federated analysis using FHIR data.



