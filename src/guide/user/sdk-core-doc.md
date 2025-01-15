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
All of this is done simply by instancing a FlameSDK object.
    
```python
from flame import FlameCoreSDK
def main():
    flame = FlameCoreSDK()
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
send_message(self, receivers: list[nodeID], message_category: str, message: dict, max_attempts: int = 1, timeout: Optional[int] = None, attempt_timeout: int = 10) -> tuple[list[nodeID], list[nodeID]]
```
Sends a message to all specified nodes.
* returns a tuple with the lists of nodes that acknowledged the message (1st element) and the list that did not acknowledge (2nd element)
* awaits acknowledgment responses within timeout
* if timeout is set, the timeout for each attempt in max_attempts is set to timeout/max_attempts, else if timeout is set to None, the timeout for each attempt is set to attempt_timeout (with the exception of the last attempt which will indefinite)

```python
# Example usage
# Send result to Hub Mino ID aggregator
self.flame.send_message(receivers=[aggregator_id],
                        message_category='intermediate_results',
                        message={'result': data_submission['id']})
```
#### Await and return responses

```python
await_messages(self, senders: List[nodeID],  message_category: str, message_id: Optional[str] = None, timeout: int = None) -> dict[nodeID, Optional[List[Message]]]
```
Halts process until responses with specified message_category (and optionally with specified message_id) from all specified nodes arrive and return their message objects. 
* if the timeout is hit or all responses are received, list successful responses and return None for those that failed
* sets the returned responses' status to “read”

```python
# Example usage
# Check for latest aggregated result
self.flame.await_messages(senders=[aggregator_id],
                          message_category='aggregated_results',
                          timeout=300)[aggregator_id][-1].body['result']
```

#### Get messages

```python
get_messages(self, status: Literal['unread', 'read'] = 'unread') -> List[Message]
```
Returns a list of all messages with the specified un-/read status.

```python
# Example usage
# Get read messages
self.flame.get_messages(status='read')
```

#### Delete messages by id(s)

```python
delete_messages(self, message_ids: List[str]) -> int
```
Delete messages with the specified message ids.
* returns the number of deleted messages

```python
# Example usage
# Delete message_a and message_b
self.flame.delete_messages(message_ids=[message_a_id, message_b_id])
```

#### Clear messages

```python
clear_messages(self, status: Literal["read", "unread", "all"] = "read", min_age: Optional[int] = None) -> int
```
Large-scale deletes messages based on the given un-/read status.
* returns the number of deleted messages
* if status is set to 'all', messages will be deleted regardless of un-/read status
* if specified with a min_age only messages older than the value in seconds will be deleted, else all of them will

```python
# Example usage
# Clear all read messages
self.flame.clear_messages(status='read', min_age=None)
```

#### Send message and wait for responses

```python
send_message_and_wait_for_responses(self, receivers: list[nodeID], message_category: str, message: dict, max_attempts: int = 1, timeout: Optional[int] = None, attempt_timeout: int = 10) -> dict[nodeID, Optional[list[Message]]]
```
Send message to specified receivers and halt process until a message from all receivers has been returned.\
*Combines functions `send_message` and `await_messages`.
* returns a dictionary with receiver node ids as keys and lists of their possible response messages as values
* awaits acknowledgment and message responses within the timeout, if set to None is allowed to run indefinitely
* response message has to have the same message_category as the message sent in order to trigger this

```python
# Example usage
# Send intermediate and await and return aggregated results
self.flame.send_message_and_wait_for_responses(receivers=[aggregator_id],
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
submit_final_result(self, result: Any, output_type: Literal['str', 'bytes', 'pickle'] = 'str') -> dict[str, str]
```
Submits the final result to the hub, making it available for analysts to download.
* this method is only available for nodes for which the method `get_role(self)` returns "aggregator”
* specifying the output_type changes the result's format to either a binary ('bytes'), text ('str'), or pickle file ('pickle)
* returns a brief dictionary response upon success

```python
# Example usage
# Submit aggregated results as text file
self.flame.submit_final_result(result=aggregated_res, output_type='str')
```

#### Save intermediate data

```python
save_intermediate_data(self, data: Any, location: Literal["local", "global"], tag: Optional[str]) -> dict[str, str]
```
Saves intermediate results/data either on the hub (location="global").
* returns a dictionary response containing the success state, the url to the submission location, and the id of the saved data's storage.
  * utilizing the id, allows for retrieval of the saved data (see '*#Get intermediate data*')
    * only possible for the node that saved the data if saved locally
    * for all nodes participating in the same analysis if saved globally
  * alternatively for local data, a storage tag may be set for retrieval later analyzes

```python
# Example usage
# Save data globally and retrieve storage id
self.flame.save_intermediate_data(location="global", data=aggregated_res)['id']
```

#### Get intermediate data

```python
get_intermediate_data(self, location: Literal["local", "global"], id: Optional[str], tag: Optional[str]) -> Any
```
Returns the local/global intermediate data with the specified id.
* only possible for the node that saved the data, if done locally
  * alternatively a storage tag may be specified to retrieve local data, if they were specified during saving
* for all nodes participating in the same analysis if saved globally

```python
# Example usage
# Retrieve globally saved data
self.flame.get_intermediate_data(location='global', id=data_storage_id)
```

#### Send intermediate data

```python
send_intermediate_data(self, receivers: list[nodeID], data: Any, message_category: str = "intermediate_data", max_attempts: int = 1, timeout: Optional[int] = None, attempt_timeout: int = 10) -> tuple[list[nodeID], list[nodeID]]
```
Sends intermediate data to specified receivers using the Result Service and Message Broker.\
*Combines functions `save_intermediate_data('global')` and `send_message`.
* returns a tuple with the lists of nodes that acknowledged the message (1st element) and the list that did not acknowledge (2nd element)
* awaits acknowledgment responses within timeout

```python
# Example usage
# Send intermediate data to partner nodes
successful, failed = self.flame.send_intermediate_data(["node1", "node2", "node3"], data)
```

#### Await intermediate data

```python
await_intermediate_data(self, senders: list[nodeID], message_category: str = "intermediate_data", timeout: Optional[int] = None) -> dict[str, Any]
```
Waits for messages containing intermediate data ids from specified senders and retrieves the data.\
* Combines functions `await_messages` and `get_intermediate_data('global')`.
* returns dictionary using the senders' nodeIDs as keys and the respectively retrieved data as values

```python
# Example usage
# Await intermediate data by partner nodes
data = self.flame.await_intermediate_data(["node1", "node2"], timeout=60)
```
#### Get local tags
    
```python
get_local_tags(self, filter: Optional[str] = None) -> list[str]:
```
Returns a list of tags used inside the node's local storage
* tags can be filtered to contain a substring with the parameter `filter`

```python
# Example usage
# List local tags containing 'result' keyword
tags = self.flame.get_local_tags(self, filter='result')
```

## Data Source Client

### Purpose
The Data Source Client is a service for accessing data from different sources like FHIR or S3 linked to the project. 

### List of available methods

#### Get data client

```python
get_data_client(self, data_id: str) -> AsyncClient
```
Returns the data client for a specific FHIR or S3 store used for this project.
* raises ValueError if no data could be found for the specified data_id

```python
# Example usage
# Retrieve data client
self.flame.get_data_client(self, data_id=data_a_id)
```

#### Get data sources

```python
get_data_sources(self) -> List[str]
```
Returns a list of all data source paths available for this project.

```python
# Example usage
# Get list of datasource paths
self.flame.get_data_sources()
```


#### Get FHIR data

```python
get_fhir_data(self, fhir_queries: Optional[List[str]] = None) -> list[Union[dict[str, dict], dict]]
```
Returns the data from the FHIR store for each of the specified queries as a list.
* If any number of queries are given...
  * FHIR queries are parsed for each available FHIR datastore individually, the results are added as values inside a dictionary to the returned list
  * each element of the returned list is a dictionary containing the queries as keys and the respective FHIR results as values
* else all available FHIR data is appended to the list (discouraged as this will likely create unnecessary overflow)

```python
# Example usage
# Retrieve FHIR data patient counts
self.flame.get_fhir_data('Patient?_summary=count')
```

#### Get S3 data

```python
get_s3_data(self, s3_keys: Optional[List[str]] = None) -> List[Union[dict[str, str], str]]
```
Returns the data from the S3 store associated with the given key as a list.
* If any number of S3 keys are given...
  * S3 keys are used to select datasets in each available datastore individually, the results are added as values inside a dictionary to the returned list
  * each element of the returned list is a dictionary containing the S3 keys as keys and the respective datasets as values
* else all available datasets are appended to the list (discouraged as this will likely create unnecessary overflow)

```python
# Example usage
# Retrieve all available S3 datasets
self.flame.get_s3_data()
```



## General

### List of available methods

#### Get aggregator id

```python
get_aggregator_id(self) -> Optional[str]
```
Returns node_id of node dedicated as aggregator.
* returns aggregator id if used by an analysis node, else None (if used by the aggregator node)

```python
# Example usage
# Get aggregator id
self.flame.get_aggregator_id()
```

#### Get participants

```python
get_participants(self) -> List[dict[str, str]]
```
Returns a list of all participants in the analysis.
* returns participants as dictionaries containing their configuration
* does not contain config of own node

```python
# Example usage
# Get full config of partner nodes
self.flame.get_participants()
```

#### Get participant ids

```python
get_participant_ids(self) -> List[nodeID]
```
Returns a list of all participants' ids in the analysis.
* does not contain id of own node

```python
# Example usage
# Get ids of partner nodes
self.flame.get_participant_ids()
```

<!---
#### Get node status #TODO: tba

```python
get_node_status(self, timeout: Optional[int] = None) -> dict[str, Literal["online", "offline", "not_connected"]]
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
get_analysis_id(self) -> str
```
Returns the analysis id.

```python
# Example usage
# Get analysis id
self.flame.get_analysis_id()
```

#### Get project id

```python
get_project_id(self) -> str
```
Returns the project id.

```python
# Example usage
# Get project id
self.flame.get_project_id()
```

#### Get id

```python
get_id(self) -> str
```
Returns the node id.

```python
# Example usage
# Get own node id
self.flame.get_id()
```

#### Get role

```python
get_role(self) -> str
```
Returns the role of the node.
* "aggregator" means that the node can submit final results using "submit_final_result", else "default" (this may change with further permission settings).

```python
# Example usage
# Get role of node within analysis
self.flame.get_role()
```

#### Analysis finished

```python
analysis_finished(self) -> bool
```
Sends a signal to all nodes to set their node_finished to True, then sets the node to finished.

```python
# Example usage
# End analysis, and inform partner nodes
self.flame.analysis_finished()
```

#### Ready Check

```python
ready_check(self, nodes: list[nodeID] = 'all', attempt_interval: int = 30, timeout: Optional[int] = None) -> dict[str, bool]
```
Waits until specified partner nodes in a federated system are ready.
* if nodes is set to 'all', all partner nodes will be used
* function continues to retry at the specified interval (default=30sec) until all nodes respond or the timeout (default=None) is reached
* return dictionary containing the nodeID as keys and booleans for whether the nodes are ready as values

```python
# Example usage
# Check whether aggregator is ready
self.flame.ready_check([aggregator_id])
```
