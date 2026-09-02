# Proxy Analysis Coding

::: warning Info
The proxy pattern was introduced with version 0.7.0 of the FLAME patterns package and is still under active
development.
:::

The ``ProxyModel`` extends the [star pattern](/guide/user/analysis-coding) by an intermediate aggregation layer.
Instead of every analyzer node reporting straight to the aggregator, analyzers are distributed across one or more
**proxy nodes**, which pre-aggregate the results of the nodes assigned to them and only forward that combined result to
the aggregator.

```
   analyzer ─┐
   analyzer ─┼─► proxy ─┐
   analyzer ─┘          ├─► aggregator ──► Hub
   analyzer ─┐          │
   analyzer ─┼─► proxy ─┘
   analyzer ─┘
```

This is useful whenever the aggregator should not be able to observe a single node's contribution: it only ever sees
results that have already been combined over a group of analyzers.

## Node roles

The pattern distinguishes three roles, which are derived automatically from the node's configuration — no manual
assignment is needed in your analysis code:

| Role | Determined by | Runs |
|------|---------------|------|
| ``default`` (analyzer) | node has an attached data source | ``analysis_method()`` |
| ``proxy`` | node participates **without** an attached data source | ``proxy_aggregation_method()`` |
| ``aggregator`` | node type is ``aggregator`` (may submit final results) | ``aggregation_method()``, ``has_converged()`` |

``ProxyModel`` constructs its ``FlameCoreSDK`` with ``default_requires_data=False``, which is what allows a node
without a reachable data source to join the analysis as a proxy instead of failing at startup (see
[``get_role``](/guide/user/sdk-core-doc#get-role) and [``node_has_data``](/guide/user/sdk-core-doc#node-has-data)).

::: warning Info
Proxy nodes must therefore be **project nodes without a data store**. Starting an analysis with fewer or more
data-less nodes than the ``num_proxy_nodes`` value given to ``ProxyModel`` aborts the analysis, as does an analysis
with fewer analyzers than proxies.
:::

## Example Analysis using ``ProxyModel``: Counting Patients Using a FHIR Query

The same patient count as in the [star pattern example](/guide/user/analysis-coding), but summed up in two stages.
This can be used as ``entrypoint.py``.

```python
from typing import Any, Optional

from flame.proxy import ProxyModel, ProxyAnalyzer, Proxy, ProxyAggregator
from flame.proxy.mapping_methods import round_robin_analyzer_to_proxy_mapping


class MyAnalyzer(ProxyAnalyzer):
    def __init__(self, flame):
        """
        Initializes the custom Analyzer node (runs on every node with a data source).

        :param flame: Instance of FlameCoreSDK to interact with the FLAME components.
        """
        super().__init__(flame)  # Connects this analyzer to the FLAME components

    def analysis_method(self, data, aggregator_results) -> Any:
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
        self.flame.flame_log(f"Patient count: {patient_count}")
        return patient_count


class MyProxy(Proxy):
    def __init__(self, flame):
        """
        Initializes the custom Proxy node (runs on every node without a data source).

        :param flame: Instance of FlameCoreSDK to interact with the FLAME components.
        """
        super().__init__(flame)  # Connects this proxy to the FLAME components

    def proxy_aggregation_method(self, analysis_results: list[Any]) -> Any:
        """
        Aggregates the results received from all analyzer nodes assigned to this proxy.

        :param analysis_results: A list of analysis results from each assigned analyzer node.
        :return: The pre-aggregated result (e.g., patient count across this proxy's analyzers).
        """
        sub_total_patient_count = sum(analysis_results)
        self.flame.flame_log(f"Intermediate aggregated count: {sub_total_patient_count}")
        return sub_total_patient_count


class MyAggregator(ProxyAggregator):
    def __init__(self, flame):
        """
        Initializes the custom Aggregator node.

        :param flame: Instance of FlameCoreSDK to interact with the FLAME components.
        """
        super().__init__(flame)  # Connects this aggregator to the FLAME components

    def aggregation_method(self, proxy_results):
        """
        Aggregates the results received from all proxy nodes
        (never has direct access to individual analyzer results).

        :param proxy_results: A list of pre-aggregated results from each proxy node.
        :return: The aggregated result (e.g., total patient count across all analyzers).
        """
        total_patient_count = sum(proxy_results)
        self.flame.flame_log(f"Fully aggregated count: {total_patient_count}")
        return total_patient_count

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
    """
    ProxyModel(
        analyzer=MyAnalyzer,             # Custom analyzer class (must inherit from ProxyAnalyzer)
        proxy=MyProxy,                   # Custom proxy class (must inherit from Proxy)
        aggregator=MyAggregator,         # Custom aggregator class (must inherit from ProxyAggregator)
        data_type='fhir',                # Type of data source ('fhir' or 's3')
        query='Patient?_summary=count',  # Query or list of queries to retrieve data
        num_proxy_nodes=1,               # Number of proxy nodes partaking in this analysis
        simple_analysis=True,            # True for single-iteration; False for multi-iterative analysis
        output_type='str',               # Output format for the final result ('str', 'bytes', or 'pickle')
        multiple_results=False,          # True to submit an iterable final result as separate result files
        filename=None,                   # Optional name(s) of the result file(s) on the hub
        stream_log_level=20,             # Minimum log level streamed to the hub (20 = 'info')
        mapping_method=round_robin_analyzer_to_proxy_mapping,  # Analyzer-to-proxy assignment
        analyzer_kwargs=None,            # Additional keyword arguments for the custom analyzer constructor
        proxy_kwargs=None,               # Additional keyword arguments for the custom proxy constructor
        aggregator_kwargs=None           # Additional keyword arguments for the custom aggregator constructor
    )


if __name__ == "__main__":
    main()
```

## Explanation

- ``MyAnalyzer``: has to inherit from ``ProxyAnalyzer`` and implement ``analysis_method()``. Identical in behaviour to
  the star pattern's ``StarAnalyzer``, except that its result is sent to its assigned proxy instead of the aggregator.
  The assigned proxy's id is available as ``self.proxy_id``.
  - ``data``: input data in s3 or fhir format, structured exactly as in the
    [star pattern](/guide/user/analysis-coding#explanation).
  - ``aggregator_results``: the previous iteration's aggregated result (only used when ``simple_analysis=False``).
- ``MyProxy``: has to inherit from ``Proxy`` and implement ``proxy_aggregation_method()``.
  - ``analysis_results``: a list of the results of the analyzers assigned to *this* proxy — the node ids of those
    analyzers are available as ``self.analyzer_ids``.
  - the return value is forwarded to the aggregator; in a multi-iterative analysis the aggregator's answer is available
    as ``self.latest_aggregator_result``.
  - a proxy node never has data access, so the data client methods of the SDK return ``None`` there.
- ``MyAggregator``: has to inherit from ``ProxyAggregator`` and implement ``aggregation_method()`` and
  ``has_converged()``.
  - ``proxy_results``: a list of the pre-aggregated results, one per proxy node. Individual analyzer results are never
    visible here — that is the point of the pattern.
  - ``self.proxy_ids`` and ``self.analyzer_ids`` hold the ids of the nodes taking either role.
  - ``has_converged()`` works exactly as in the star pattern and is only evaluated when ``simple_analysis=False``,
    starting from the second iteration.
- ``main()``-function: Instantiates ``ProxyModel``, which determines the node's role and executes the matching part of
  the analysis.

## Analyzer-to-proxy assignment

The aggregator collects the roles of all partner nodes at startup and assigns each analyzer to a proxy. By default this
uses ``round_robin_analyzer_to_proxy_mapping``, distributing analyzers evenly across the available proxies after
sorting both id lists, so the assignment is deterministic.

A custom assignment can be given via ``mapping_method``. It is a callable receiving the sorted proxy and analyzer ids,
and returning a dictionary mapping each analyzer id to the proxy id it should report to:

```python
def group_by_first_half(proxies: list[str], analyzers: list[str]) -> dict[str, str]:
    half = (len(analyzers) + 1) // 2
    return {analyzer_id: proxies[0 if i < half else 1] for i, analyzer_id in enumerate(analyzers)}


ProxyModel(..., num_proxy_nodes=2, mapping_method=group_by_first_half)
```

Every analyzer has to be mapped to exactly one proxy, and every proxy should receive at least one analyzer — a proxy
without analyzers waits indefinitely for results that never arrive.

## Multi-iterative analyses

With ``simple_analysis=False``, one round consists of: analyzers analyze → proxies pre-aggregate → aggregator
aggregates and evaluates ``has_converged()``. If it has not converged, the aggregated result is broadcast back to the
proxies and analyzers, and the next round starts with that value as ``aggregator_results``. Progress can be reported
from any of the three node roles via ``self.flame.set_progress()``.

```python
class MyAggregator(ProxyAggregator):
    def has_converged(self, result, last_result):
        return self.num_iterations >= 2
```

## Differences to the star pattern

| | ``StarModel`` | ``ProxyModel`` |
|---|---|---|
| node roles | analyzer, aggregator | analyzer, proxy, aggregator |
| aggregator sees | every analyzer result | only pre-aggregated proxy results |
| extra class to implement | — | ``Proxy`` with ``proxy_aggregation_method()`` |
| extra parameters | — | ``num_proxy_nodes``, ``mapping_method``, ``proxy_kwargs`` |
| checkpointing | ``load_checkpoint``/``checkpoint_filter`` | not supported yet |
| local differential privacy | ``StarLocalDPModel`` | not supported yet |

## Local testing

``ProxyModelTester`` runs the whole topology in threads on your machine, in the same way ``StarModelTester`` does for
the star pattern. See [Local Analysis Testing](/guide/user/local-testing#testing-the-proxy-pattern).
