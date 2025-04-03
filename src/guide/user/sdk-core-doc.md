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


# Python SDK core
## Startup
Every FLAME analysis starts by connecting itself to the other components of the flame platform and starting an Analysis REST-API. 
All of this is done simply by instancing a FlameSDK object (optionally you may set the `silent` parameter to suppress automatic system outputs therein).
    
```python
from flame import FlameCoreSDK
def main():
    flame = FlameCoreSDK(silent=False)
    # Your code here
if __name__ == "__main__":
    main()

```

The connection to the other components of the flame platform is established automatically when the FlameSDK object is created.

[//]: <> "TODO: Add example for successful startup (i.e. automatic prints)"



## Message Broker Client

### Purpose
The Message Broker is a service for sending and receiving messages between nodes. 
It used for simple communication between nodes for control and small data exchange purposes. 
Note that Volume Data, such as ML models, should be exchanged using the Result Service.
The maximum size of messages sent is around 2 MBs.

### List of available methods

#### Send message
```python
send_message(receivers: list[nodeID],
             message_category: str,
             message: dict,
             max_attempts: int = 1,
             timeout: Optional[int] = None,
             attempt_timeout: int = 10,
             silent: Optional[bool] = None) -> tuple[list[nodeID], list[nodeID]]
```
Sends a message to all specified nodes.
* returns a tuple with the lists of nodes that acknowledged the message (1st element) and the list that did not acknowledge (2nd element)
* awaits acknowledgment responses within timeout
* if timeout is set, the timeout for each attempt in max_attempts is set to timeout/max_attempts, else if timeout is set to None, the timeout for each attempt is set to attempt_timeout (with the exception of the last attempt which will indefinite)
* if silent is set to True, the response will not be logged

```python
# Example usage
# Send result to Hub Mino ID aggregator
flame.send_message(receivers=[aggregator_id],
                   message_category='intermediate_results',
                   message={'result': data_submission['id']})
```
#### Await and return responses

```python
await_messages(senders: list[nodeID],
               message_category: str,
               message_id: Optional[str] = None,
               timeout: int = None) -> dict[nodeID, Optional[list[Message]]]
```
Halts process until responses with specified message_category (and optionally with specified message_id) from all specified nodes arrive and return their message objects. 
* if the timeout is hit or all responses are received, list successful responses and return None for those that failed
* sets the returned responses' status to “read”

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
Delete messages with the specified message ids.
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
* if status is set to 'all', messages will be deleted regardless of un-/read status
* if specified with a min_age only messages older than the value in seconds will be deleted, else all of them will

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
                                    attempt_timeout: int = 10,
                                    silent: Optional[bool] = None) -> dict[nodeID, Optional[list[Message]]]
```
Send message to specified receivers and halt process until a message from all receivers has been returned.\
* Combines functions `send_message` and `await_messages`.
* returns a dictionary with receiver node ids as keys and lists of their possible response messages as values
* awaits acknowledgment and message responses within the timeout, if set to None is allowed to run indefinitely
* response message has to have the same message_category as the message sent in order to trigger this
* if silent is set to True, the response will not be logged

```python
# Example usage
# Send intermediate and await and return aggregated results
flame.send_message_and_wait_for_responses(receivers=[aggregator_id],
                                          message_category='intermedaite_results',
                                          message={'result': data_submission['id']},
                                          timeout=None)[aggregator_id][-1].body['result']
```



## Storage Client

### Purpose
The Storage Service is a service for saving and exchanging results between nodes of one analysis and locally between 
different analyzes of the same Project.

### List of available methods

#### Submit final result

```python
submit_final_result(result: Any,
                    output_type: Literal['str', 'bytes', 'pickle'] = 'str',
                    silent: Optional[bool] = None) -> dict[str, str]
```
Submits the final result to the hub, making it available for analysts to download.
* this method is only available for nodes for which the method `flame.get_role()` returns "aggregator”
* specifying the output_type changes the result's format to either a binary ('bytes'), text ('str'), or pickle file ('pickle)
* returns a brief dictionary response upon success
* if silent is set to True, the response will not be logged

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
                       tag: Optional[str] = None,
                       silent: Optional[bool] = None) -> Union[dict[str, dict[str, str]], dict[str, str]]
```
Saves intermediate results/data either on the hub (location="global").
* if remote_node_ids is None, i.e. if intermediate data shouldn't be encrypted
  * returns a dictionary response containing the success state, the url to the submission location, and the id of the saved data's storage.
    * utilizing the id, allows for retrieval of the saved data (see '*#Get intermediate data*')
      * only possible for the node that saved the data if saved locally
      * for all nodes participating in the same analysis if saved globally
    * alternatively for local data, a storage tag may be set for retrieval later analyzes
* else, i.e. if intermediate data should be encrypted
  * returns a dictionary of the previously mentioned dictionaries for each specified remote node id as key
* if silent is set to True, the response will not be logged

```python
# Example usage
# Save data globally and retrieve storage id
flame.save_intermediate_data(location="global", data=aggregated_res)['id']
```

#### Get intermediate data

```python
get_intermediate_data(location: Literal["local", "global"],
                      id: Optional[str],
                      tag: Optional[str],
                      tag_option: Optional[Literal["all", "last", "first"]] = "all") -> Any
```
Returns the local/global intermediate data with the specified id.
* only possible for the node that saved the data, if done locally
  * alternatively a storage tag may be specified to retrieve local data, if they were specified during saving
* for all nodes participating in the same analysis if saved globally
* tag_option return mode if multiple tagged data are found, "all" vs just the "first" or just the "last"  added to the intermediate data under this tag  

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
                       encrypted: bool = True,
                       silent: Optional[bool] = None) -> tuple[list[nodeID], list[nodeID]]
```
Sends intermediate data to specified receivers using the Result Service and Message Broker.\
*Combines functions `save_intermediate_data('global')` and `send_message`.
* returns a tuple with the lists of nodes that acknowledged the message (1st element) and the list that did not acknowledge (2nd element)
* awaits acknowledgment responses within timeout
* if silent is set to True, the response will not be logged
* if encrypted set to True, data will be send using ECDH


```python
# Example usage
# Send intermediate data to partner nodes
successful, failed = flame.send_intermediate_data(["node1", "node2", "node3"], data)
```

#### Await intermediate data

```python
await_intermediate_data(senders: list[nodeID],
                        message_category: str = "intermediate_data",
                        timeout: Optional[int] = None) -> dict[str, Any]
```
Waits for messages containing intermediate data ids from specified senders and retrieves the data.\
* Combines functions `await_messages` and `get_intermediate_data('global')`.
* returns dictionary using the senders' nodeIDs as keys and the respectively retrieved data as values

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

#### Get data client

```python
get_data_client(data_id: str) -> AsyncClient
```
Returns the data client for a specific FHIR or S3 store used for this project.
* raises ValueError if no data could be found for the specified data_id

```python
# Example usage
# Retrieve data client
flame.get_data_client(data_id=data_a_id)
```

#### Get data sources

```python
get_data_sources() -> list[str]
```
Returns a list of all data source paths available for this project.

```python
# Example usage
# Get list of datasource paths
flame.get_data_sources()
```


#### Get FHIR data

```python
get_fhir_data(fhir_queries: Optional[list[str]] = None) -> list[Union[dict[str, dict], dict]]
```
Returns the data from the FHIR store for each of the specified queries as a list.
* If any number of queries are given...
  * FHIR queries are parsed for each available FHIR datastore individually, the results are added as values inside a dictionary to the returned list
  * each element of the returned list is a dictionary containing the queries as keys and the respective FHIR results as values
* else all available FHIR data is appended to the list (discouraged as this will likely create unnecessary overflow)

```python
# Example usage
# Retrieve FHIR data patient counts
flame.get_fhir_data(['Patient?_summary=count'])
```

#### Get S3 data

```python
get_s3_data(s3_keys: Optional[list[str]] = None) -> list[Union[dict[str, str], str]]
```
Returns the data from the S3 store associated with the given key as a list.
* If any number of S3 keys are given...
  * S3 keys are used to select datasets in each available datastore individually, the results are added as values inside a dictionary to the returned list
  * each element of the returned list is a dictionary containing the S3 keys as keys and the respective datasets as values
* else all available datasets are appended to the list (discouraged as this will likely create unnecessary overflow)

```python
# Example usage
# Retrieve all available S3 datasets
flame.get_s3_data()
```



## General

### List of available methods

#### Flame logs 
```python
flame_log(msg: Union[str, bytes],
          silent: Optional[bool] = None,
          sep: str = ' ',
          end: str = '\n',
          file = None,
          flush: bool = False,
          suppress_head: bool = False) -> None
```
Prints logs to console.
* mirrors python builtin params `sep`, `end`, `file`, and `flush`
* if silent is set to True, the response will not be logged
* if suppress_head is set to True, the following print will not contain the normal flame log head

```python
# Example usage
# Simple print of message
flame.flame_log("Awaiting contact with analyzer nodes...success")

# Print message, but suppress flame log head
flame.flame_log("success", False, suppress_head=True)
```


#### Get aggregator id

```python
get_aggregator_id() -> Optional[str]
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
* returns participants as dictionaries containing their configuration
* does not contain config of own node

```python
# Example usage
# Get full config of partner nodes
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
get_node_status(timeout: Optional[int] = None) -> dict[str, Literal["online", "offline", "not_connected"]]
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
get_id() -> str
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
* "aggregator" means that the node can submit final results using "submit_final_result", else "default" (this may change with further permission settings).

```python
# Example usage
# Get role of node within analysis
flame.get_role()
```

#### Analysis finished

```python
analysis_finished() -> bool
```
Sends a signal to all nodes to set their node_finished to True, then sets the node to finished.

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
* if nodes is set to 'all', all partner nodes will be used
* function continues to retry at the specified interval (default=30sec) until all nodes respond or the timeout (default=None) is reached
* return dictionary containing the nodeID as keys and booleans for whether the nodes are ready as values

```python
# Example usage
# Check whether aggregator is ready
flame.ready_check([aggregator_id])
```
