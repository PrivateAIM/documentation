# Step-by-Step Guide for a minimal Text scoring example using FLAME
This script was developed to serve as a minimal example to parse text files (here: doctor's letters) and return arbitrary text statistics.
This script reads text data from S3, computes various readability metrics on each text, aggregates these metrics across nodes, and outputs the average readability scores.



## Step 1: Imports and Setup

At the top of `test_gemtex.py`, import necessary modules 

```python
from flame.star import StarModel, StarAnalyzer, StarAggregator
from readability import Readability
```

* `StarModel`, `StarAnalyzer`, `StarAggregator`: FLAME SDK components.
* `Readability`: Library for computing readability scores. This library is only part of the master image for GemTeX not a default for other master images.

## Step 2: Implement the Analyzer

The `MyAnalyzer` class inherits from `StarAnalyzer` and has to overwrite the  abstractmethod `analysis_method`:

```python
class MyAnalyzer(StarAnalyzer):
    def __init__(self, flame):
        super().__init__(flame)
```

* **`analysis_method(self, data, aggregator_results)`**:

  * Receives `data`: a list where each element is a dictionary mapping S3 object keys to raw bytes. depending on the project your data will be given to this method.
  * Decodes each bytes value to UTF-8 text.
  * Creates a `Readability` object to compute seven metrics:

    * Flesch–Kincaid grade level
    * Flesch reading ease
    * Gunning fog index
    * Coleman–Liau index
    * Dale–Chall score
    * Automated Readability Index (ARI)
    * Linsear Write formula
  * Collects these metrics for each text into `scores`.
  * Calculates `avg_scores_node`: the average of each metric across all texts on that node.
  * Returns a list of 7 average scores.

````python
def analysis_method(self, data, aggregator_results):
    scores = []
    for text in data[0].values():
        text = text.decode("utf-8")
        r = Readability(text)
        
        a1 = r.flesch_kincaid().score
        a2 = r.flesch().score
        a3 = r.gunning_fog().score
        a4 = r.coleman_liau().score
        a5 = r.dale_chall().score
        a6 = r.ari().score
        a7 = r.linsear_write().score
        
        scores.append([a1, a2, a3, a4, a5, a6, a7])

    avg_scores_node = [sum(group) / len(group) for group in zip(*scores)]
    return avg_scores_node
````

## Step 3: Implement the Aggregator

The `MyAggregator` class inherits from `StarAggregator` and has to overwrite the  abstractmethod `aggregation_method`:

```python
class MyAggregator(StarAggregator):
    def __init__(self, flame):
        super().__init__(flame)
````

* **`aggregation_method(self, analysis_results)`**:

  * Receives `analysis_results`: a list of lists, where each inner list is the output of one node's `analysis_method`.
  * Computes `avg_scores_global`: the average of each metric across all nodes.
  * Returns a list of 7 globally averaged scores.
* **`has_converged(self, result, last_result)`**:

  * Always returns `True`, so the model runs only one iteration.

````python
def aggregation_method(self, analysis_results):
    avg_scores_global = [sum(group) / len(group) for group in zip(*analysis_results)]
    return avg_scores_global


def has_converged(self, result, last_result):
    return True
````
## Step 4: Configure and Run `StarModel`

The `main` function sets up and runs the model:

```python
def main():
    StarModel(
        analyzer=MyAnalyzer,
        aggregator=MyAggregator,
        data_type='s3',
        simple_analysis=True,
        output_type='str',
        analyzer_kwargs=None,
        aggregator_kwargs=None
    )

if __name__ == "__main__":
    main()

````
- **`data_type`:** `'s3'` tells FLAME to fetch data from S3.
- **`simple_analysis`:** `True` for a single iteration.
- **`output_type`:** `'str'` specifies the format of the returned result.


The script will:

1. Fetch all text files from configured S3 sources.
2. Compute readability metrics on each node.
3. Aggregate results and print a global list of seven average scores.

## Together the files look like this:

```python

from flame.star import StarModel, StarAnalyzer, StarAggregator
from readability import Readability


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
        scores = []

        for text in data[0].values():
            text = text.decode("utf-8")
            r = Readability(text)

            a1 = r.flesch_kincaid().score
            a2 = r.flesch().score
            a3 = r.gunning_fog().score
            a4 = r.coleman_liau().score
            a5 = r.dale_chall().score
            a6 = r.ari().score
            a7 = r.linsear_write().score

            scores.append([a1, a2, a3, a4, a5, a6, a7])

        avg_scores_node = [sum(group) / len(group) for group in zip(*scores)]

        return avg_scores_node


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
        # averaging individual scores across all nodes
        avg_scores_global = [sum(group) / len(group) for group in zip(*analysis_results)]

        return avg_scores_global

    def has_converged(self, result, last_result):
        """
        Determines if the aggregation process has converged.

        :param result: The current aggregated result.
        :param last_result: The aggregated result from the previous iteration.
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
        analyzer=MyAnalyzer,  # Custom analyzer class (must inherit from StarAnalyzer)
        aggregator=MyAggregator,  # Custom aggregator class (must inherit from StarAggregator)
        data_type='s3',  # Type of data source ('fhir' or 's3')
        # query='Patient?_summary=count',  # Query or list of queries to retrieve data
        simple_analysis=True,  # True for single-iteration; False for multi-iterative analysis
        output_type='str',  # Output format for the final result ('str', 'bytes', or 'pickle')
        analyzer_kwargs=None,  # Additional keyword arguments for the custom analyzer constructor (i.e. MyAnalyzer)
        aggregator_kwargs=None  # Additional keyword arguments for the custom aggregator constructor (i.e. MyAggregator)
    )


if __name__ == "__main__":
    main()

````
