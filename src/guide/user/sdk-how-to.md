# Developing an Analysis with the SDK

This page answers the questions that come up when you write an analysis: how to get your data, how to compute on it
at the node, how nodes talk to each other, and how to get results. It is task-oriented and links into the
[Python Core SDK reference](/guide/user/sdk-core-doc) for the full method signatures.

## Two ways to write an analysis

| | Pattern (`StarModel`, `ProxyModel`) | Core SDK (`FlameCoreSDK`) |
|---|---|---|
| You write | `analysis_method()`, `aggregation_method()`, `has_converged()` | the complete control flow of every node |
| Data retrieval | done for you, handed over as `data` | you call `get_fhir_data()` / `get_s3_data()` |
| Communication | done for you | you call `send_message()`, `await_messages()`, ... |
| Result submission | done for you | you call `submit_final_result()` |
| Use it when | analyzers compute, one aggregator combines (optionally over several rounds) | your protocol does not fit that shape |

Start with a pattern. Inside a pattern class the SDK is still available as `self.flame`, so you can mix both, for
example to log, report progress or fetch additional data.

* [Coding an Analysis](/guide/user/analysis-coding) introduces `StarModel`.
* [Proxy Pattern](/guide/user/proxy-analysis-coding) introduces `ProxyModel`.

## 1. How do I get my data?

An analysis can only reach the data stores that the node administrator attached to **its own project**
(see [Data Store Management](/guide/admin/data-store-management)). There are two kinds of data store:

| Data store | Holds | `data_type` | You select data with |
|---|---|---|---|
| FHIR server | structured clinical resources | `'fhir'` | FHIR search queries |
| S3 bucket | files of any format (CSV, VCF, images, text, ...) | `'s3'` | object keys, i.e. file names |

There is no direct file system access to the node. Files are made available by uploading them to a bucket, see
[Bucket Setup for Data Store](/guide/admin/bucket-setup-for-data-store).

### With a pattern

Set `data_type` and `query` on the model. The pattern fetches the data on every analyzer node and passes it to
`analysis_method()` as `data`:

```python
StarModel(
    analyzer=MyAnalyzer,
    aggregator=MyAggregator,
    # 's3' or 'fhir'
    data_type='s3',
    # object keys for s3, FHIR queries for fhir
    query=['cohort.csv'],
    ...
)
```

`data` is a list with one dictionary per data store of the project on that node (often exactly one). Each dictionary
maps the query to its result:

```python
# data_type='fhir', query='Patient?_summary=count'
data = [{'Patient?_summary=count': {...FHIR response...}}]

# data_type='s3', query=['cohort.csv']
data = [{'cohort.csv': b'...file content as bytes...'}]
```

With `query=None`, an S3 data store returns **all** of its files under their names, while a FHIR data store returns
nothing, because FHIR always needs a query.

### With the Core SDK

```python
from flame import FlameCoreSDK

flame = FlameCoreSDK()

if flame.node_has_data():
    # list of {query: result}
    fhir = flame.get_fhir_data(['Patient?_summary=count'])

    # list of {key: bytes}
    files = flame.get_s3_data(['cohort.csv'])

    # every file of every S3 data store
    all_files = flame.get_s3_data()
```

Both methods return the same structure as `data` above. See
[Data Source Client](/guide/user/sdk-core-doc#data-source-client) for `get_data_sources()` and `get_data_client()`.

::: warning Aggregators have no data by default
The data methods return `None` on a node without a data connection. This is the case for the aggregator unless the
SDK is constructed with `aggregator_requires_data=True`, and for proxy nodes. Check with `node_has_data()`.
:::

### Reading FHIR data

The value for each query is the parsed FHIR response as a dictionary:

```python
def analysis_method(self, data, aggregator_results):
    patient_count = data[0]['Patient?_summary=count']['total']
    return patient_count
```

To turn `Observation` or `QuestionnaireResponse` resources into a table, use
[`fhir_to_csv()`](/guide/user/sdk-core-doc#fhir-to-csv). The [FHIR Queries](/guide/user/fhir-query) page explains how
to write queries.

### Reading files (CSV, VCF, text, ...)

S3 data arrives as **bytes in memory**, whatever the file format. How you read it depends on the library:

```python
from io import BytesIO
import tempfile

import pandas as pd


def analysis_method(self, data, aggregator_results):
    files = data[0]

    # CSV or other tabular formats: wrap the bytes in a file-like object
    df = pd.read_csv(BytesIO(files['cohort.csv']))

    # Plain text
    notes = files['notes.txt'].decode('utf-8')

    # Libraries or command line tools that need a file path
    # (e.g. pysam for VCF): write the bytes to a temporary file first
    with tempfile.NamedTemporaryFile(mode='wb') as tmp:
        tmp.write(files['sample.vcf.gz'])
        tmp.flush()
        # open tmp.name with your library
        ...
```

If file names differ between nodes, do not hard-code them. Request all files and select by suffix:

```python
csv_files = {
    name: content
    for name, content in data[0].items()
    if name.endswith('.csv')
}
```

Complete examples: [CSV](/guide/user/coding_examples/federated-logistic-regression),
[VCF](/guide/user/coding_examples/vcf-qc), [FASTQ with a command line tool](/guide/user/coding_examples/cli-fastqc).

## 2. How do I compute on the node?

Everything in `analysis_method()` runs **inside the node**, next to the data. Only its return value leaves the node.

```python
class MyAnalyzer(StarAnalyzer):
    def analysis_method(self, data, aggregator_results):
        df = pd.read_csv(BytesIO(data[0]['cohort.csv']))
        return {'n': len(df), 'sum_age': float(df['age'].sum())}


class MyAggregator(StarAggregator):
    def aggregation_method(self, analysis_results):
        n = sum(r['n'] for r in analysis_results)
        return sum(r['sum_age'] for r in analysis_results) / n

    def has_converged(self, result, last_result):
        return True
```

Things to keep in mind:

* **Return aggregates, not rows.** The return value is sent to the aggregator, so it must not contain patient-level
  or otherwise identifying data. This includes file names and error messages.
* **Libraries come from the master image.** You cannot install packages at runtime. If the library you need is
  missing, see [Requesting a Master Image](/guide/user/master-images).
* **Command line tools** contained in the master image can be called with `subprocess`, see the
  [FastQC example](/guide/user/coding_examples/cli-fastqc).
* **Parameters** for your classes are passed through `analyzer_kwargs` and `aggregator_kwargs` on the model.
* **Logging and progress** are available as `self.flame.flame_log()` and `self.flame.set_progress()`.
* **Exceptions** set the analysis to `failed`. The Hub only shows a generic message, the stack trace stays in the
  node's local logs (see [Error Handling](/guide/user/analysis-coding#error-handling)).

### Computing over several rounds

With `simple_analysis=False` the aggregated result is sent back to the analyzers and `analysis_method()` is called
again, until `has_converged()` returns `True`. The previous aggregate arrives as `aggregator_results`, which is `None`
in the first round:

```python
def analysis_method(self, data, aggregator_results):
    if aggregator_results is not None:
        # continue from the global model
        self.model.coef_ = aggregator_results
    self.model.fit(self.X, self.y)
    return self.model.coef_
```

State you set on `self` survives between rounds. For long runs, see
[Checkpointing](/guide/user/analysis-coding#checkpointing).

### Test before you submit

Run the same classes on your own machine with `StarModelTester` before uploading the code to the Hub. It prints full
stack traces, which the Hub does not. See [Local Testing](/guide/user/local-testing).

## 3. How do nodes communicate?

Nodes never connect to each other directly. All traffic passes through the Hub, using two channels:

| Channel | For | Limit | Methods |
|---|---|---|---|
| Message Broker | control messages and small values | about 2 MB per message | `send_message()`, `await_messages()` |
| Storage Service | larger data such as model weights | none stated | `send_intermediate_data()`, `await_intermediate_data()` |

Data sent with `send_intermediate_data()` is always encrypted for the receiving nodes.

### With a pattern

You do not call any of these methods. The pattern moves the return values for you:

* `StarModel`: `analysis_method()` on each analyzer → `aggregation_method()` on the aggregator → back to the analyzers
  as `aggregator_results` in the next round.
* `ProxyModel`: `analysis_method()` → `proxy_aggregation_method()` on the assigned proxy → `aggregation_method()` on
  the aggregator. The aggregator never sees the result of a single analyzer.

### With the Core SDK

First find out who takes part:

```python
# this node
flame.get_id()

# 'default', 'aggregator' or 'proxy'
flame.get_role()

# all other nodes of the analysis
flame.get_participant_ids()

# the aggregator (None on the aggregator itself)
flame.get_aggregator_id()

# {node_id: role} of all partners
flame.full_role_call()
```

Then exchange messages. A message has a `message_category`, which the receiver uses to pick the messages it waits
for, and a dictionary as content, available on the received message as `.body`:

```python
from flame import FlameCoreSDK


def main():
    flame = FlameCoreSDK()

    if flame.get_role() == 'aggregator':
        analyzers = flame.get_participant_ids()
        responses = flame.await_messages(senders=analyzers,
                                         message_category='patient_count',
                                         timeout=300)
        # a node that did not answer in time has None
        # instead of a list of messages
        total = sum(msgs[-1].body['count']
                    for msgs in responses.values() if msgs)
        flame.submit_final_result(result=total, output_type='str')
        flame.analysis_finished()
    else:
        aggregator_id = flame.get_aggregator_id()
        query = 'Patient?_summary=count'
        count = flame.get_fhir_data([query])[0][query]['total']
        flame.ready_check([aggregator_id])
        flame.send_message(receivers=[aggregator_id],
                           message_category='patient_count',
                           message={'count': count})


if __name__ == "__main__":
    main()
```

For anything larger than a few values, send the data itself through the Storage Service. The two calls combine
storing, messaging and retrieving:

```python
# sender
flame.send_intermediate_data(receivers=[aggregator_id],
                             data=model_weights)

# receiver, returns {node_id: data}
weights = flame.await_intermediate_data(senders=analyzers,
                                        timeout=600)
```

Useful helpers:

* `send_message_and_wait_for_responses()` sends a message and blocks until every receiver has answered in the same
  category.
* `ready_check()` waits until partner nodes are up, which avoids sending messages to a node that has not started yet.
* `get_node_index()` gives every node the same deterministic ordering, useful to assign tasks without negotiating.
* `set_role()` with `partner_role_call()` lets you define your own roles beyond analyzer and aggregator.
* `analysis_finished()` tells all partner nodes that the analysis is done.

All of them are described under [Message Broker Client](/guide/user/sdk-core-doc#message-broker-client),
[Storage Client](/guide/user/sdk-core-doc#storage-client) and [General](/guide/user/sdk-core-doc#general).

## 4. How do I get results?

There are two kinds of results: the **final result**, which leaves the federation and is downloaded by the analyst,
and **intermediate results**, which stay inside the analysis or the project.

| Result | Stored | Readable by | Written by |
|---|---|---|---|
| Final | on the Hub | the analyst | the aggregator only |
| Intermediate, global | on the Hub, encrypted | the nodes it is addressed to, within the same analysis | any node |
| Intermediate, local | on the node | the node itself, also in later analyses of the same project | any node |

Final results are written with `submit_final_result()`, intermediate results with `save_intermediate_data()` and
`location='global'` or `location='local'`.

### How aggregation works

Aggregation is **your code**. FLAME does not average or merge anything on its own, it only delivers the results of
the analyzers to the aggregator.

1. Every analyzer runs `analysis_method()` and returns its result.
2. The aggregator receives all of them as the list `analysis_results` and runs `aggregation_method()`.
3. With `simple_analysis=True` the return value is submitted as the final result and the analysis ends.
4. With `simple_analysis=False` the aggregator calls `has_converged(result, last_result)` from the second round on.
   If it returns `False`, the aggregate is sent back to the analyzers and the next round starts. If it returns
   `True`, the aggregate is submitted as the final result.

`analysis_results` is a plain list. It does not tell you which node sent which entry, so return everything the
aggregation needs as part of the result, for example the sample size for a weighted mean:

```python
class MyAnalyzer(StarAnalyzer):
    def analysis_method(self, data, aggregator_results):
        df = pd.read_csv(BytesIO(data[0]['cohort.csv']))
        return {'n': len(df), 'mean_age': float(df['age'].mean())}


class MyAggregator(StarAggregator):
    def aggregation_method(self, analysis_results):
        n = sum(r['n'] for r in analysis_results)
        weighted = sum(r['n'] * r['mean_age'] for r in analysis_results)
        return weighted / n

    def has_converged(self, result, last_result):
        # stop when the result no longer changes, or after 10 rounds
        if self.num_iterations >= 10:
            return True
        return abs(result - last_result) < 1e-6
```

With `ProxyModel` there is one more stage: each proxy pre-aggregates its analyzers in `proxy_aggregation_method()`,
and the aggregator only receives the proxy results. See [Proxy Pattern](/guide/user/proxy-analysis-coding).

### Final results

A pattern submits the return value of `aggregation_method()` for you. The format is set on the model:

```python
StarModel(
    ...
    # 'str' (text file), 'bytes' (binary file) or 'pickle'
    output_type='str',
    # optional name of the result file on the Hub
    filename='mean_age.txt',
)
```

| `output_type` | Use for | Reading the downloaded file |
|---|---|---|
| `'str'` | numbers, text, JSON strings | any text editor |
| `'bytes'` | content you serialized yourself, e.g. an image or a model file | depends on your format |
| `'pickle'` | arbitrary Python objects | `pickle.load()` in an environment with the same libraries |

To get several files, return a list or tuple and set `multiple_results=True`. `output_type` and `filename` may then
be lists with one entry per element:

```python
class MyAggregator(StarAggregator):
    def aggregation_method(self, analysis_results):
        ...
        return [json.dumps(summary), model_bytes]


StarModel(
    ...
    multiple_results=True,
    output_type=['str', 'bytes'],
    filename=['summary.json', 'model.bin'],
)
```

With the Core SDK you call the same functionality directly. It only works on the aggregator:

```python
if flame.get_role() == 'aggregator':
    flame.submit_final_result(result=total, output_type='str')
```

**Downloading:** once all nodes have finished, open the analysis in the Hub and click **Download** in the
**Results** tab, see [Starting an Analysis](/guide/user/analysis#download-results).

::: warning Final results leave the federation
Everything you submit is stored on the Hub and can be downloaded. Submit aggregates only. For single numeric results,
noise can be added with `StarLocalDPModel` or the `local_dp` parameter, see
[Local Differential Privacy](/guide/user/analysis-coding#utilizing-local-differential-privacy-in-starmodel).
:::

### Intermediate and temporary results

**During one run** you often do not need storage at all:

* Attributes you set on `self` in your analyzer or aggregator are kept between rounds.
* Files you write to the working directory of the container exist until the analysis ends. They are not part of the
  result and are not visible to other nodes.

**Sharing with other nodes (global):** the data is stored on the Hub, encrypted for exactly the nodes you name, and
can be read by them within the same analysis. This is the channel for anything too large for a message.

```python
# returns {node_id: {'status': ..., 'url': ..., 'id': ...}}
response = flame.save_intermediate_data(data=model_weights,
                                        location='global',
                                        remote_node_ids=[partner_id])

# on the receiving node, with the storage id it was sent
weights = flame.get_intermediate_data(location='global',
                                      query=storage_id)
```

The receiver needs the storage `id`. `send_intermediate_data()` and `await_intermediate_data()` store the data and
pass the id along in one step, see [How do nodes communicate?](#_3-how-do-nodes-communicate).

**Keeping on the node (local):** the data never leaves the node. It outlives the analysis and can be read again by
the same node in a later analysis of the **same project**, which makes it suitable for caching expensive
preprocessing or continuing a training run. Give it a `tag` to find it again:

```python
# first analysis
flame.save_intermediate_data(data=features,
                             location='local',
                             tag='features-v1')

# later analysis of the same project, on the same node
if 'features-v1' in flame.get_local_tags():
    features = flame.get_intermediate_data(location='local',
                                           tag='features-v1',
                                           tag_option='last')
```

Tags consist of lowercase letters, digits and hyphens. Tags containing `checkpoint-` are reserved.

**Checkpoints** build on local storage and additionally save the files your analysis has written. Use them to resume
a long run, see [Checkpointing](/guide/user/analysis-coding#checkpointing).

All methods are described under [Storage Client](/guide/user/sdk-core-doc#storage-client).
