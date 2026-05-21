<!---
How to write block comments [you can do anything you want in here]
--->

[comment]: # (How to write line comments [must not contain brackets])

[comment]: # "How to write line comments [must not contain quotations]"

[//]: # (How to write line comments [must not contain brackets])

[//]: # "How to write line comments [must not contain quotations]"

[comment]: <> (How to write line comments [must not contain brackets])

[comment]: <> "How to write line comments [must not contain quotations]"

[//]: <> (How to write line comments [must not contain brackets])

[//]: <> "How to write line comments [must not contain quotations]"

# Python Core SDK

## Startup

Every FLAME analysis starts by connecting itself to the other components of the flame platform and starting an Analysis
REST-API.
All of this is done simply by instancing a FlameSDK object.

```python
from flame import FlameCoreSDK
def main():
    flame = FlameCoreSDK()
    # Your code here
if __name__ == "__main__":
    main()

```

The connection to the other components of the flame platform is established automatically when the FlameSDK object is
created.

### Constructor parameters

```python
FlameCoreSDK(aggregator_requires_data: bool = False,
             stream_log_level: int = 20,
             silent: bool = False,
             status_sync: Optional[tuple[Literal['executed', 'stopped', 'failed']]] = ('executed', 'stopped', 'failed'))
```

* `aggregator_requires_data`: by default the Data API is only connected for `"default"` nodes. Set this to `True` if the
  aggregator node also needs access to data sources.
* `stream_log_level`: minimum log level streamed to the hub (defaults to `20`, i.e. `'info'`; see log levels in
  `flame_log`).
* `silent`: if set to `True`, suppresses automatic console outputs (logs are still submitted to the hub).
* `status_sync`: tuple of terminal analysis states, that if provided via the Analysis REST-API by partner nodes, this node will be set to.

The connection to each flame-node component is wrapped individually, so a partial startup is tolerated. The SDK logs any failed
connection and continues. Once all services and the Analysis REST-API thread are up, the analysis status is set to
`executing`, otherwise `failed`.

Example logs during successful analysis startup process:
```
Starting FlameCoreSDK
Extracting node config
Connecting to nginx...success
Connecting to MessageBroker...success
Connecting to PO service...success
Connecting to ResultService...success
Connecting to DataApi...success
Starting FlameApi thread...success
FlameCoreSDK ready
```
## Message Broker Client

### Purpose

The Message Broker is a service for sending and receiving messages between nodes.
It is used for simple communication between nodes for control and small data exchange purposes.
Note that volume data, such as ML models, should be exchanged using the Result Service.
The maximum size of messages sent is around 2 MB.

### List of available methods

#### Send message

```python
send_message(receivers: list[nodeID],
             message_category: str,
             message: dict,
             max_attempts: int = 1,
             timeout: Optional[int] = None,
             attempt_timeout: int = 10) -> tuple[list[nodeID], list[nodeID]]
```

Sends a message to all specified nodes.

* returns a tuple with the lists of nodes that acknowledged the message (1st element) and the list that did not
  acknowledge (2nd element)
* awaits acknowledgment responses within timeout
* if `timeout` is set, the total timeout for all attempts in `max_attempts`, each individually bound to `attempt_timeout`, is set to `timeout` in seconds. 
* else, if `timeout` is set to `None`, the timeout for each attempt is simply set to `attempt_timeout` (with the exception of the last attempt which will be
  indefinite)

```python
# Example usage
# Send result to Hub Mino ID aggregator
flame.send_message(receivers=[aggregator_id],
                   message_category='intermediate_results',
                   message={'result': data_submission['id']})
```

#### Await messages

```python
await_messages(senders: list[nodeID],
               message_category: str,
               message_id: Optional[str] = None,
               timeout: int = None) -> dict[nodeID, Optional[list[Message]]]
```

Halts process until messages with specified `message_category` (and optionally with specified `message_id`) from all
specified nodes arrive and returns the message objects.

* if the `timeout` in seconds is hit or all responses are received, list successful responses and return `None` for those that failed
* sets the returned responses' status to `“read”`

```python
# Example usage
# Check for latest aggregated result
flame.await_messages(senders=[aggregator_id],
                     message_category='aggregated_results',
                     timeout=300)[aggregator_id][-1].body['result']
```

#### Get messages

```python
get_messages(status: Literal['unread', 'read'] = 'unread') -> list[Message]
```

Returns a list of all messages with the specified un-/read status.

```python
# Example usage
# Get read messages
flame.get_messages(status='read')
```

#### Delete messages by id(s)

```python
delete_messages(message_ids: list[str]) -> int
```

Delete messages with the specified `message_ids`.

* returns the number of deleted messages

```python
# Example usage
# Delete message_a and message_b
flame.delete_messages(message_ids=[message_a_id, message_b_id])
```

#### Clear messages

```python
clear_messages(status: Literal["read", "unread", "all"] = "read",
               min_age: Optional[int] = None) -> int
```

Large-scale deletes messages based on the given un-/read status.

* returns the number of deleted messages
* if status is set to `'all'`, messages will be deleted regardless of un-/read status
* if specified with a `min_age` only messages older than the value in seconds will be deleted, else all of them will

```python
# Example usage
# Clear all read messages
flame.clear_messages(status='read', min_age=None)
```

#### Send message and wait for responses

```python
send_message_and_wait_for_responses(receivers: list[nodeID],
                                    message_category: str,
                                    message: dict,
                                    max_attempts: int = 1,
                                    timeout: Optional[int] = None,
                                    attempt_timeout: int = 10) -> dict[nodeID, Optional[list[Message]]]
```

Send message to specified `receivers` and halt process until a message from all `receivers` has been returned.

* Combines functions `send_message` and `await_messages`.
* returns a dictionary with receiver node ids as keys and lists of their response messages as values
* awaits acknowledgment and message responses within the `timeout` in seconds, if set to `None` is allowed to run indefinitely
* response message has to have the same `message_category` as the message sent in order to trigger this

```python
# Example usage
# Send intermediate and await and return aggregated results
flame.send_message_and_wait_for_responses(receivers=[aggregator_id],
                                          message_category='intermediate_results',
                                          message={'result': data_submission['id']},
                                          timeout=None)[aggregator_id][-1].body['result']
```

## Storage Client

### Purpose

The Storage Service is a service for saving and exchanging results between nodes of one analysis and locally between
different analyzes of the same project.

### List of available methods

#### Submit final result

```python
submit_final_result(result: Any,
                    output_type: Union[Literal['str', 'bytes', 'pickle'], list] = 'str',
                    multiple_results: bool = False,
                    filename: Optional[Union[str, list[str]]] = None,
                    local_dp: Optional[LocalDifferentialPrivacyParams] = None) -> Union[dict[str, str], list[dict[str, str]]]
```

Submits the final result to the hub, making it available for analysts to download.

* this method is only available for nodes for which the method `flame.get_role()` returns `"aggregator”`
* specifying the `output_type` changes the result's format to either a binary (`'bytes'`), text (`'str'`), or pickle file (`'pickle'`)
* `multiple_results` can be used to define whether multiple results should be split into separate result files (if set to `True`) or returned as one (if set to `False`)
  * if `True`, `result` must be a `list` or `tuple`; each element is submitted as a separate result file
  * `output_type` may then be given as a list (one entry per result element)
* `filename` optionally sets the result file name(s) on the hub
  * pass a list of names one for each `result` element if `multiple_results=True`, or a single string for a single file, which will alternatively be auto-indexed as `name_1`, `name_2`, … if `multiple_results=True`
  * defaults to auto-generated name(s) when `None`
* returns a brief dictionary response upon success (a list of such dictionaries if `result` was submitted as `multiple_results=True`)

```python
# Example usage
# Submit aggregated results as text file
flame.submit_final_result(result=aggregated_res, output_type='str')
```

#### Save intermediate data

```python
save_intermediate_data(data: Any,
                       location: Literal["local", "global"],
                       remote_node_ids: Optional[list[nodeID]] = None,
                       tag: Optional[str] = None) -> Union[dict[nodeID, dict[str, str]], dict[str, str]]
```

Saves intermediate `data` either on the hub (`location="global"`), or locally (`location="local"`).

* when saving globally (`location="global"`), a list of `remote_node_ids` **must** be provided — global intermediate data is always encrypted with ECDH for the specified recipient nodes (a `ValueError` is raised if `remote_node_ids` is `None`)
  * returns a dictionary using each specified element of `remote_node_ids` as key, mapping to a dictionary response containing the success state (`"status"`), the url to the submission location (`"url"`), and the storage id of the saved data (`"id"`)
* when saving locally (`location="local"`) with `remote_node_ids` left as `None`
  * returns a single dictionary response containing the success state (`"status"`), the url to the submission location (`"url"`), and the storage id of the saved data (`"id"`)
  * a storage `tag` can optionally be set for retrieval by future analyzes (persistent; access granted only to other analyzes of the same project)
* the storage id allows for retrieval of the saved data (see `get_intermediate_data`)
  * only possible for the node that saved the data, if saved locally
  * for all addressed nodes participating in the same analysis, if saved globally

```python
# Example usage
# Save data globally for partner nodes and retrieve storage ids
flame.save_intermediate_data(location="global", data=aggregated_res, remote_node_ids=["10b9d309-b7c5...", "1fa053a9-3898..."])
```

#### Get intermediate data

```python
get_intermediate_data(location: Literal["local", "global"],
                      query: Optional[str] = None,
                      tag: Optional[str] = None,
                      tag_option: Optional[Literal["all", "last", "first"]] = "all") -> Any
```

Returns the `local`/`global` intermediate data with the specified storage `query` (the storage id returned by
`save_intermediate_data`) or `tag`.

* only possible for the node that saved the data, if saved locally
* possible for all addressed nodes participating in the same analysis, if saved globally
* `tag_option` return mode can be specified in case multiple tagged data are found: `"all"`, just the `"first"`, or just the `"last"`  added to the
  intermediate data under this tag (only checked if `tag` was given a value)

```python
# Example usage
# Retrieve globally saved data
flame.get_intermediate_data(location='global', query=data_storage_id)
```

#### Send intermediate data

```python
send_intermediate_data(receivers: list[nodeID],
                       data: Any,
                       message_category: str = "intermediate_data",
                       max_attempts: int = 1,
                       timeout: Optional[int] = None,
                       attempt_timeout: int = 10) -> tuple[list[nodeID], list[nodeID]]
```

Sends intermediate data to specified receivers using the Result Service and Message Broker.
* Combines functions `save_intermediate_data(location='global')` and `send_message`.

* returns a tuple with the lists of nodes that acknowledged the message (1st element) and the list that did not
  acknowledge (2nd element)
* copies behaviour of MessageBroker's `send_message` for `message_category`, `max_attempts`, `timeout`, and `attempt_timeout`
* data is always sent encrypted using ECDH (the `receivers` are used as `remote_node_ids` in `save_intermediate_data`)

```python
# Example usage
# Send intermediate data to partner nodes
successful, failed = flame.send_intermediate_data(["1fa053a9-3898...", "10b9d309-b7c5..."], data)
```

#### Await intermediate data

```python
await_intermediate_data(senders: list[nodeID],
                        message_category: str = "intermediate_data",
                        timeout: Optional[int] = None) -> dict[nodeID, Any]
```

Waits for messages containing intermediate data ids from specified senders and retrieves the data.

* Combines functions `await_messages` and `get_intermediate_data('global')`.
* returns a dictionary using the senders' node ids as keys and the respectively retrieved data as values

```python
# Example usage
# Await intermediate data by partner nodes
data = flame.await_intermediate_data(["1fa053a9-3898...", "10b9d309-b7c5..."], timeout=60)
```

#### Get local tags

```python
get_local_tags(filter: Optional[str] = None) -> list[str]:
```

Returns a list of tags used inside the node's local storage

* tags can be filtered to contain a substring with the parameter `filter`

```python
# Example usage
# List local tags containing 'result' keyword
tags = flame.get_local_tags(filter='result')
```

## Data Source Client

### Purpose

The Data Source Client is a service for accessing data from different sources like FHIR or S3 linked to the project.

### List of available methods

#### Get data sources

```python
get_data_sources() -> Optional[list[dict[str, Any]]]
```

Returns a list of all data source objects available for this project.

```python
# Example usage
# Get list of datasource paths
flame.get_data_sources()
```

#### Get data client

```python
get_data_client(data_id: str) -> Optional[AsyncClient]
```

Returns the data client for a specific FHIR or S3 store used for this project.

* logs ValueError if no data could be found for the specified data_id

```python
# Example usage
# Retrieve data client
flame.get_data_client(data_id=data_a_id)
```

#### Get FHIR data

```python
get_fhir_data(fhir_queries: Optional[list[str]] = []) -> Optional[list[dict[str, Union[str, dict]]]]
```

Returns the data from the FHIR store for each of the specified `fhir_queries` as a list of dicts.

* If any number of `fhir_queries` are given...
    * FHIR queries are parsed for each available FHIR datastore individually, creating a list with x-amount of dictionaries for each datastore, with each containing y-amount of key-value pairs for each query
    * each element of the returned list is a dictionary containing the `fhir_queries` as keys and the respective FHIR results
      as values
* else if an empty list is given `fhir_queries=[]`, or `fhir_queries=None`, `None` will be returned

```python
# Example usage
# Retrieve FHIR data patient counts
flame.get_fhir_data(['Patient?_summary=count'])
```

#### Get S3 data

```python
get_s3_data(s3_keys: Optional[list[str]] = []) -> Optional[list[dict[str, bytes]]]
```

Returns the data from the S3 store for each of the given `s3_keys` as a list of dicts.

* If any number of `s3_keys` are given...
    * the elements of `s3_keys` are used to filter available datasets based on the dataset names in each available datastore individually, creating a list with x-amount of dictionaries for each datastore, with each containing y-amount of key-value pairs for each S3 key
    * each element of the returned list is a dictionary containing the dataset names as keys and the respective datasets (in their entirety) as
      values
* else if an empty list is given, i.e. no keys are specified, all datasets will be returned for each datasource, under their names
* else if `s3_keys` is set to `None`, `None` will be returned

```python
# Example usage
# Retrieve all available S3 datasets
flame.get_s3_data()
```

## General

### List of available methods

#### FHIR to CSV

```python
fhir_to_csv(fhir_data: dict[str, Any],
            col_key_seq: str,
            value_key_seq: str,
            input_resource: str,
            row_key_seq: Optional[str] = None,
            row_id_filters: Optional[list[str]] = None,
            col_id_filters: Optional[list[str]] = None,
            row_col_name: str = '',
            separator: str = ',',
            output_type: Literal["file", "dict"] = "file") -> Optional[Union[StringIO, dict[Any, dict[Any, Any]]]]
```

Converts a FHIR Bundle (or other FHIR-formatted dict) into a CSV table, pivoting entries on the specified row and column keys.

* `fhir_data` is the FHIR data to convert (e.g. a bundle as returned by `get_fhir_data`)
* `col_key_seq` and `value_key_seq` are dot-separated key sequences locating the column identifier and the cell value within each FHIR entry
* `input_resource` is the FHIR resource type to parse — currently `'Observation'` or `'QuestionnaireResponse'`
* `row_key_seq` is the dot-separated key sequence locating the row identifier (required for `input_resource='Observation'`)
* `row_id_filters`/`col_id_filters` are optional lists of substrings; only rows/columns whose identifier contains one of them are kept
* `row_col_name` sets the header label of the row-identifier column
* `separator` is the CSV field separator (default `,`)
* `output_type` selects the return format: `"file"` returns a CSV-formatted `StringIO`, `"dict"` returns a nested dictionary
* returns `None` if the Data API is not available on this node

```python
# Example usage
# Convert fetched FHIR observations to a CSV file-like object
fhir_data = flame.get_fhir_data(['Observation'])[0]['Observation']
csv = flame.fhir_to_csv(fhir_data,
                        col_key_seq='resource.code.coding.code',
                        value_key_seq='resource.valueQuantity.value',
                        input_resource='Observation',
                        row_key_seq='resource.subject.reference')
```

#### Get aggregator id

```python
get_aggregator_id() -> Optional[nodeID]
```

Returns node_id of node dedicated as aggregator.

* returns aggregator id if used by an analysis node, else `None` (if used by the aggregator node)

```python
# Example usage
# Get aggregator id
flame.get_aggregator_id()
```

#### Get participants

```python
get_participants() -> list[dict[str, str]]
```

Returns a list of all participant configs in the analysis.

* returns participants as dictionaries containing their configuration (keys: `'nodeId'` and `'nodeType'`)
* does not contain config of own node

```python
# Example usage
# Get config of partner nodes
flame.get_participants()
```

#### Get participant ids

```python
get_participant_ids() -> list[nodeID]
```

Returns a list of all participant ids in the analysis.

* does not contain id of own node

```python
# Example usage
# Get ids of partner nodes
flame.get_participant_ids()
```

#### Get analysis id

```python
get_analysis_id() -> str
```

Returns the analysis id.

```python
# Example usage
# Get analysis id
flame.get_analysis_id()
```

#### Get project id

```python
get_project_id() -> str
```

Returns the project id.

```python
# Example usage
# Get project id
flame.get_project_id()
```

#### Get id

```python
get_id() -> nodeID
```

Returns the node id.

```python
# Example usage
# Get own node id
flame.get_id()
```

#### Get role

```python
get_role() -> str
```

Returns the role of the node.

* "aggregator" means that the node can submit final results using "submit_final_result", else "default" (this may change
  with further permission settings).

```python
# Example usage
# Get role of node within analysis
flame.get_role()
```

#### Analysis finished

```python
analysis_finished() -> bool
```

Sends a signal to all partner nodes to set their `node_finished` state to `True`, then sets its own `node_finished` state to `True`

```python
# Example usage
# End analysis, and inform partner nodes
flame.analysis_finished()
```


#### Ready Check

```python
ready_check(nodes: list[nodeID] = 'all',
            attempt_interval: int = 30,
            timeout: Optional[int] = None) -> dict[str, bool]
```

Waits until specified partner nodes in a federated system are ready.

* if nodes is set to `'all'`, all partner nodes will be used
* function continues to retry at the specified `attempt_interval` (default=30sec) until all nodes respond or the 
timeout (default: `timeout=None`) is reached
* return dictionary containing the nodeID as keys and booleans for whether the nodes are ready as values

```python
# Example usage
# Check whether aggregator is ready
flame.ready_check([aggregator_id])
```

#### Flame logs

```python
flame_log(msg: Union[str, bytes, Iterable],
          sep: str = '',
          end: str = '',
          log_type: str = 'info',
          append: bool = False,
          halt_submission: bool = False) -> None
```

Prints `msg`-logs to console and submits them to the hub (as soon as a connection is established, until then they will be queued).

* `msg` accepts a string, bytes, or any iterable joinable into a string
* `sep` is used to join the elements of `msg` if it is an iterable, `end` is appended to the resulting log
* `log_type` specifies the type of log this should be saved as
  * accepted literals:

    | literal | level |
    |---------|-------|
    | `debug` | `10`  |
    | `info` | `20`  |
    | `notice` | `25`  |
    | `warn` | `30`  |
    | `alert` | `33`  |
    | `emerg` | `36`  |
    | `error` | `40`  |
    | `crit` | `50`  |
  * the level of a log given `stream_log_level` (set in the constructor) determines whether it is streamed to the hub

  * passing `'error'` raises the error and sets the analysis status to `failed`
* if `halt_submission` is set to `True`, the log is printed but its submission to the hub is held back in a placeholder instead of being sent
* if `append` is set to `True`, any log held back by a previous `halt_submission=True` call is prepended to this log before it is submitted
  * together these allow emitting a `"…success"`/`"…failed"` continuation on the same conceptual log line


```python
# Example usage
# Simple log of message
flame.flame_log("Awaiting contact with analyzer nodes...success")

# Log message, but halt first log until check passed, then submit halted log together with check result
flame.flame_log("Awaiting contact with analyzer nodes...", halt_submission=True)
if contacted_successfully:
    flame.flame_log("success", append=True)
else:
    flame.flame_log("failed", append=True)
```

#### Get analysis progress

```python
get_progress() -> int
```

Returns current relative progress value (integer between 0 and 100).

```python
# Example usage
# Log current progress value
flame.flame_log(f"Current progress: {flame.get_progress()}%")
```

#### Set analysis progress

```python
set_progress(progress: Union[int, float]) -> None
```

Set current relative progress value (integer/float between 0 and 100).

* float values will be streamed to integers
* only accepts monotone increasing values
  * logs warnings if attempts are made to set progress to equal or smaller values

```python
# Example usage
# Perpetually increase progress
for i in range(0, 100):
    flame.set_progress(i)
```
