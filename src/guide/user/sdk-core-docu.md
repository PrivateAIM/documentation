# Python SDK core
## Startup
Every FLAME analysis starts by connecting itself to the other components of the flame platform and starting an Analysis REST-API. All of this is done simply by instancing a FlameSDK object.
    
```python
from flame import FlameSDK
def main():
    flame = FlameCoreSDK()
    # Your code here
if __name__ == "__main__":
    main()

```
The connection to the other components of the flame platform is established automatically when the FlameSDK object is created.



## Message Broker Client

### Purpose
The Message Broker is a service for sending and receiving messages between nodes. It is a simple communication between nodes for control and small data exchange purposes. Note that Volume Data, such as ML models, should be exchanged using the Result Service.

### List of available methods

#### Send message
```python
send_message(self, receivers: List[nodeID], message_category: str, message: dict, timeout: Optional[int] = None) -> Tupel[List[nodeID], List[nodeID]]
```
Sends a message to all specified nodes.
* returns a tuple with the lists of nodes that acknowledged the message (1st element) and the list that did not acknowledge (2nd element)
* awaits acknowledgment responses within timeout

```python
# Example usage
# Send result to Hub Mino ID aggregator
self.flame.send_message(receivers=[aggregator_id],
                        message_category='intermediate_results',
                        message={'result': data_submission['id']})
```
#### Await and return responses

```python
await_and_return_responses(self, node_ids: List[nodeID],  message_category: str, message_id: Optional[str] = None, timeout: int = None) -> dict[str, List[Message] | None]
```
Halts process until responses to specified message_category (and optionally with specified message_id) from all specified nodes arrive and return their message objects. 
* if the timeout is hit or all responses are received, list successful responses and return None for those that failed
* sets the returned responses' status to “read”

```python
# Example usage
# Check for latest aggregated result
aggregator_results = self.flame.await_and_return_responses(node_ids=[aggregator_id],
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
read_messages = self.flame.get_messages(status='read')
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
num_deleted_msgs = self.flame.delete_messages(message_ids=[message_a_id, message_b_id])
```

### List of quality of life methods

#### Clear messages

```python
clear_messages(self, status: Literal["read", "unread", "all"] = "read", time_limit: Optional[int] = None) -> int
```
Large-scale deletes messages based on the given un-/read status.
* returns the number of deleted messages
* if status is set to 'all', messages will be deleted regardless of un-/read status
* if specified with timeout is set to None process is allowed to run indefinitely, else stops process if timeout in seconds is surpassed

```python
# Example usage
# Clear messages
num_cleared_msgs = self.flame.clear_messages(status='read', time_limit=None)
```

#### Send message and wait for responses

```python
send_message_and_wait_for_responses(self, receivers: List[nodeID], message_category: str, message: dict, timeout: Optional[int] = None) -> dict[str, Optional[List[Message]]]
```
Send message to specified receivers and halt process until a message from all receivers has been returned.\
*Combines functions `send_message` and `await_and_return_responses`.
* returns a dictionary with receiver node ids as keys and lists of their possible response messages as values
* awaits acknowledgment and message responses within the timeout, if set to None is allowed to run indefinitely
* response message has to have the same message_category as the message sent in order to trigger this

```python
# Example usage
# Send intermediate and await and return aggregated results
aggregator_results = self.flame.send_message_and_wait_for_responses(receivers=[aggregator_id],
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
response = self.flame.submit_final_result(result=aggregated_res, output_type='str')
```

#### Save intermediate data

```python
save_intermediate_data(self, location: Literal["local", "global"], data: Any) -> dict[str, str]
```
Saves intermediate results/data either on the hub (location="global"), or locally.
* returns a dictionary response containing the success state, the url to the submission location, and the id of the saved data's storage.
  * utilizing the id, allows for retrieval of the saved data (see '*#Get intermediate data*')
    * only possible for the node that saved the data if saved locally
    * for all nodes participating in the same analysis if saved globally

```python
# Example usage
# Save data globally and retrieve storage id
data_storage_id = self.flame.save_intermediate_data(location="global", data=aggregated_res)['id']
```

#### Get intermediate data

```python
get_intermediate_data(self, location: Literal["local", "global"], id: str) -> Any
```
Returns the local/global intermediate data with the specified id.
* only possible for the node that saved the data, if done locally
* for all nodes participating in the same analysis if saved globally

```python
# Example usage
# Retrieve globally saved data
aggregated_res = self.flame.get_intermediate_data(location='global', id=data_storage_id)
```
#TODO Checkpoint


## Data Source Client

### Purpose
The Data Source Client is a service for accessing data from different sources like FHIR or S3 linked to the project. 

### List of available methods

#### Get data client

```python
get_data_client(self, data_id: str) -> AsyncClient
```
Returns the data client for a specific fhir or S3 store used for this project.
* raises ValueError if no data could be found for the specified data_id

```python
# Example usage
# Retrieve data client
data_client = self.flame.get_data_client(self, data_id=data_a_id)
```

#### Get data sources

```python
get_data_sources(self) -> List[str]
```
Returns a list of all data source paths available for this project.

```python
# Example usage
# Get list of datasource paths
sources = self.flame.get_data_sources()
```

### List of quality of life methods

#### Get fhir data

```python
get_fhir_data(self, fhir_queries: Optional[List[str]] = None) -> list[Union[dict[str, dict], dict]]
```
Returns the data from the FHIR store for each of the specified queries as a list.
* If any number of queries are given...
  * fhir queries are parsed for each available fhir datastore individually, the results are added as values inside a dictionary to the returned list
  * each element of the returned list is a dictionary containing the queries as keys and the respective fhir results as values
* else all available fhir data is directly appended to the returned list (discouraged as this will likely create lots of unnecessary overflow)

```python
# Example usage
# Retrieve fhir data patient counts
response = self.flame.get_fhir_data('Patient?_summary=count')
```

#### Get s3 data

```python
get_s3_data(self, s3_keys: Optional[List[str]] = None) -> List[Union[dict[str, str], str]]
```
Returns the data from the S3 store associated with the given key as a list.
* If any number of s3 keys are given...
  * s3 keys are used to select datasets in each available datastore individually, the results are added as values inside a dictionary to the returned list
  * each element of the returned list is a dictionary containing the s3 keys as keys and the respective datasets as values
* else all available datasets is directly appended to the returned list (discouraged as this will likely create lots of unnecessary overflow)

```python
# Example usage
# Retrieve all available s3 datasets
response = self.flame.get_s3_data()
```





## General 

### List of available methods

#### Get aggregator id

```python
get_aggregator_id(self) -> Optional[str]
```
<>
* <>

```python
# Example usage
# <>
<>
```

#### Get participants

```python
get_participants(self) -> List[dict[str, str]]
```
Returns a list of all nodes participating in the analysis.
* <>

```python
# Example usage
# <>
<>
```

#### Get participant ids

```python
get_participant_ids(self) -> List[str]
```
<>
* <>

```python
# Example usage
# <>
<>
```

#### <> #TODO: tba

```python
get_node_status(self, timeout: Optional[int] = None) -> dict[str, Literal["online", "offline", "not_connected"]]
```
<>
* <>

```python
# Example usage
# <>
<>
```

#### Get analysis id

```python
get_analysis_id(self) -> str
```
<>
* <>

```python
# Example usage
# <>
<>
```

#### Get project id

```python
get_project_id(self) -> str
```
<>
* <>

```python
# Example usage
# <>
<>
```

#### Get id

```python
get_id(self) -> str
```
<>
* <>

```python
# Example usage
# <>
<>
```

#### Get role

```python
get_role(self) -> str
```
<>
* <>

```python
# Example usage
# <>
<>
```

#### <> #TODO:tba

```python
send_intermediate_result(self, receivers: List[str], result: BytesIO) -> str
```
<>
* <>

```python
# Example usage
# <>
<>
```

#### Analysis finished

```python
analysis_finished(self) -> bool
```
<>
* <>

```python
# Example usage
# <>
<>
```
