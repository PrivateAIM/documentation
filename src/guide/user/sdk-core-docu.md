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

#### Send Message
```python
send_message(self, receivers: List[nodeID], message_category: str, message: dict, timeout: int = None) -> Tupel[List[nodeID], List[nodeID]]
```
 Sends a message to all specified nodes.
- awaits acknowledgment responses (message with field akn_msg=True) within timeout, else returns "Failed to deliver the messages."
- returns a tuple with the lists of nodes that acknowledged the message and  the list that did not acknowledge
    
