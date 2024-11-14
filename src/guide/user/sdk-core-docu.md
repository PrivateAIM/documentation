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
send_message(self, receivers: List[nodeID], message_category: str, message: dict, timeout: int = None) -> Tupel[List[nodeID], List[nodeID]]
```
 Sends a message to all specified nodes.
- awaits acknowledgment responses (message with field akn_msg=True) within timeout, else returns "Failed to deliver the messages."
- returns a tuple with the lists of nodes that acknowledged the message and  the list that did not acknowledge
```python
# Example usage
# Send result to Hub Mino ID aggregator
self.flame.send_message(receivers=[aggregator_id],
                        message_category='intermediate_results',
                        message={'result': str(submission_response['id'])})
```
#### Await and return responses

```python
await_and_return_responses(self, node_ids: List[nodeID],  message_category: str, message_id: Optional[str] = None, timeout: int = None) -> dict[str, List[Message] | None]
```
Halts process until responses to specified message_category (and optionally with specified message_id) from all specified nodes arrive and return their message objects. 
- if the timeout is hit or all responses are received, list successful responses and return None for those that failed
- sets the returned responses' status to “read”

```python
# Check for aggregated results
aggregator_results = self.flame.await_and_return_responses(node_ids=[aggregator_id],
                                                           message_category='aggregated_results',
                                                           timeout=300)[aggregator_id][-1].body['result']
```

#### Get  read messages

```python
get_read_messages(self) -> List[Message]
```
Returns a list of all read messages.
