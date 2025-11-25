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
All of this is done simply by instancing a FlameSDK object (optionally you may set the `silent` parameter to suppress
automatic system outputs therein).

```python
from flame import FlameCoreSDK
def main():
    flame = FlameCoreSDK(silent=False)
    # Your code here
if __name__ == "__main__":
    main()

```

The connection to the other components of the flame platform is established automatically when the FlameSDK object is
created.

[//]: <> "TODO: Add example for successful startup (i.e. automatic prints)"

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
                    output_type: Literal['str', 'bytes', 'pickle'] = 'str',
                    local_dp: Optional[LocalDifferentialPrivacyParams] = None) -> dict[str, str]
```

Submits the final result to the hub, making it available for analysts to download.

* this method is only available for nodes for which the method `flame.get_role()` returns `"aggregator”`
* specifying the `output_type` changes the result's format to either a binary (`'bytes'`), text (`'str'`), or pickle file (`'pickle'`)
* returns a brief dictionary response upon success

```python
# Example usage
# Submit aggregated results as text file
flame.submit_final_result(result=aggregated_res, output_type='str')
```

#### Save intermediate data

```python
save_intermediate_data(data: Any,
                       location: Literal["local", "global"],
                       remote_node_ids: Optional[list[str]] = None,
                       tag: Optional[str] = None) -> Union[dict[nodeID, dict[str, str]], dict[str, str]]
```

Saves intermediate `data` either on the hub (`location="global"`), or locally (`location="local"`).
* a list of `remote_node_ids` need to be provided, if the user wishes to use ECDH for the saved data
  * if `remote_node_ids` is `None`, i.e. if intermediate data shouldn't be encrypted
      * returns a dictionary response containing the success state with the key `"status"`, the url to the submission location with the key `"url"`, and the id of the
        saved data's storage with the key `"id"`
          * utilizing the id, allows for retrieval of the saved data (see `get_intermediate_data`)
              * only possible for the node that saved the data, if saved locally
              * for all nodes participating in the same analysis, if saved globally
          * (optionally for local data) a storage `tag` can be set for retrieval by future analyzes (persistent; access granted to other analyzes part of the same project)
  * else, i.e. if intermediate data should be encrypted with ECDH
      * returns a dictionary of the previously mentioned dictionaries for each specified element of `remote_node_ids` as key

```python
# Example usage
# Save data globally and retrieve storage id
flame.save_intermediate_data(location="global", data=aggregated_res)['id']
```

#### Get intermediate data

```python
get_intermediate_data(location: Literal["local", "global"],
                      id: Optional[str] = None,
                      tag: Optional[str] = None,
                      tag_option: Optional[Literal["all", "last", "first"]] = "all",
                      sender_node_id: Optional[str] = None) -> Any
```

Returns the `local`/`global` intermediate data with the specified storage `id` or `tag`.

* only possible for the node that saved the data, if saved locally
* possible for all nodes participating in the same analysis, if saved globally
* `tag_option` return mode can be specified in case multiple tagged data are found: `"all"`, just the `"first"`, or just the `"last"`  added to the
  intermediate data under this tag (only checked if `tag` was given a value)
* `sender_node_id` is the counterpart to `remote_node_ids` in `save_intermediate_data`, and has to be given the node id of the sender, if the data used ECDH (node ids can be exchanged via MessageBroker's `send_message`)

```python
# Example usage
# Retrieve globally saved data
flame.get_intermediate_data(location='global', id=data_storage_id)
```

#### Send intermediate data

```python
send_intermediate_data(receivers: list[nodeID],
                       data: Any,
                       message_category: str = "intermediate_data",
                       max_attempts: int = 1,
                       timeout: Optional[int] = None,
                       attempt_timeout: int = 10,
                       encrypted: bool = True) -> tuple[list[nodeID], list[nodeID]]
```

Sends intermediate data to specified receivers using the Result Service and Message Broker.
* Combines functions `save_intermediate_data(location='global')` and `send_message`.

* returns a tuple with the lists of nodes that acknowledged the message (1st element) and the list that did not
  acknowledge (2nd element)
* copies behaviour of MessageBroker's `send_message` for `message_category`, `max_attempts`, `timeout`, and `attempt_timeout`
* if encrypted set to `True`, data will be sent using ECDH (i.e. will automatically retrieve and distribute `remote_node_ids` in `save_intermediate_data`)

```python
# Example usage
# Send intermediate data to partner nodes
successful, failed = flame.send_intermediate_data(["node1", "node2", "node3"], data)
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
data = flame.await_intermediate_data(["node1", "node2"], timeout=60)
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
get_data_sources() -> list[dict[str, ]]
```

Returns a list of all data source objects available for this project.

```python
# Example usage
# Get list of datasource paths
flame.get_data_sources()
```

#### Get data client

```python
get_data_client(data_id: str) -> AsyncClient
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
* else if an empty list is given, or `fhir_queries=None`, `None` will be returned

```python
# Example usage
# Retrieve FHIR data patient counts
flame.get_fhir_data(['Patient?_summary=count'])
```

#### Get S3 data

```python
get_s3_data(s3_keys: Optional[list[str]] = []) -> Optional[list[dict[str, str]]]
```

Returns the data from the S3 store for each of the given `s3_keys` as a list of dicts.

* If any number of `s3_keys` are given...
    * the elements of `s3_keys` are used to filter available datasets based on the dataset names in each available datastore individually, creating a list with x-amount of dictionaries for each datastore, with each containing y-amount of key-value pairs for each S3 key
    * each element of the returned list is a dictionary containing the dataset names as keys and the respective datasets (in their entirety) as
      values
* If an empty list is given, i.e. no keys are specified, all datasets will be returned for each datasource, under their names
* else all available datasets are appended to the list (discouraged as this will likely create unnecessary overflow)

```python
# Example usage
# Retrieve all available S3 datasets
flame.get_s3_data()
```

## General

### List of available methods

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
flame_log(msg: Union[str, bytes],
          sep: str = ' ',
          end: str = '\n',
          file = None,
          log_type: str = 'normal',
          suppress_head: bool = False,
          halt_submission: bool = False) -> None
```

Prints `msg`-logs to console and submits them to the hub (as soon as a connection is established, until then they will be queued).

* mirrors python builtin `print`-params `sep`, `end`, and `file`
* `log_type` specifies the type of log this should be saved as
  * accepted literals: 
    * `'info'`
    * `'normal'`
    * `'notice'`
    * `'debug'`
    * `'warning'`
    * `'alert'`
    * `'emergency'`
    * `'error'`
    * `'critical-error'`
    * or any other type established with `declare_log_types`
* if `suppress_head` is set to `True`, the following print will not contain the preset Flame log head
* if `halt_submission` is set to `True`, the log submission to the hub will be placed in a placeholder instead and added to the beginning of the next log submission
  * useful if followed by another function call with `suppress_head=True`

```python
# Example usage
# Simple log of message
flame.flame_log("Awaiting contact with analyzer nodes...success")

# Log message, but halt first log until check passed, then submit halted log with check result
flame.flame_log("Awaiting contact with analyzer nodes...", halt_submission=True)
if contacted_successfully:
    flame.flame_log("success", suppress_head=True)
else:
    flame.flame_log("failed", suppress_head=True)
```

```python
declare_log_types(new_log_types: dict[str, str]) -> None
```

Declare new log_types to be added to log_type literals (see list in `flame_log`).

* `new_log_types` accepts dict containing new custom log_types as keys and literals known by Flame as values
  * values may only include: `'info'`, `'notice'`, `'debug'`, `'warn'`, `'alert'`, `'emerg'`, `'error'`, or `'crit` (not further customizable)
  * logs error if unknown literal is used

```python
# Example usage
# Declare new log type
flame.declare_log_types({"custom": 'info'})
```

```python
get_progress() -> int
```

Returns current relative progress value (integer between 0 and 100).

```python
# Example usage
# Log current progress value
flame.flame_log(flame.get_progress())
```

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

#### Get aggregator id

```python
get_aggregator_id() -> Optional[nodeID]
```

Returns node_id of node dedicated as aggregator.

* returns aggregator id if used by an analysis node, else None (if used by the aggregator node)

```python
# Example usage
# Get aggregator id
flame.get_aggregator_id()
```

#### Get participants

```python
get_participants() -> list[dict[str, str]]
```

Returns a list of all participants in the analysis.

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

Returns a list of all participants' ids in the analysis.

* does not contain id of own node

```python
# Example usage
# Get ids of partner nodes
flame.get_participant_ids()
```

<!---
#### Get node status #TODO: tba

```python
get_node_status(timeout: Optional[int] = None) -> dict[nodeID, Literal["online", "offline", "not_connected"]]
```
Returns the status of all nodes.
* <>

```python
# Example usage
# <>
<>
```
--->

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
