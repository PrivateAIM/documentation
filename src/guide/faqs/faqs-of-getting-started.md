# FAQs

### What is PrivateAIM and FLAME?
PrivateAIM is the main project from MII consortium and Flame is the name of the platform.

### What are the key components of the FLAME platform?
The major components are the Hub and the Node, both offer a set of services which interconnect with each other.

### What is the difference between Hub and Node?
The **HUB** and **NODE** are two separate components of FLAME with different roles:

#### HUB (central platform) services:
* Acts as the central control point for the entire FLAME system.
* Manages authentication, authorization, and user access across all participating organizations.
* Organizes institutions into _Realms_.
* Analysis Management: Receives analysis code, builds Docker images, distributes to nodes, and receives results.
* Message Broker: Routes communications between nodes and users.
* Storage Service: Central repository to load analysis scripts.

#### NODE (local installation):
A node is installed locally at each participating hospital/clinic/university. Focuses on data management and analysis execution on the 
stored data defined from a FHIR server or from tabular files.

#### Node services:
* Data Store Setup: Manages FHIR and S3 data storage locally.
* Analysis Execution: Runs approved analyses on local data
* Node Aggregation: One node per analysis acts as "aggregator" to combine results from all node participants
* Monitoring: Local admin can view analysis execution status and logs.

### What is a Realm in FLAME?
A Realm is an administrative namespace that represents one organization within the Hub.

**Keypoints**:
* Is assigned one Realm per organization
* Created by the main Hub administrator and assigned to administrators from each organisation.
* Each administrator manage their own Realm's:
  * Users and user accounts
  * Roles and permissions
  * Identity providers (for authentication)
  * Registered nodes (local installations)

### What is the purpose of a Node as Aggregator?
An Aggregator is a specialized node that combines results from multiple analyzer nodes into a final aggregated result in a federated analysis.

**Key Purposes:**
1. Combine Results from all Analyzers:
Receives analysis results from every participating analyzer node and implements the `aggregation_method()` that defines HOW to combine those results.
2. Define Aggregation Logic. The aggregator implements the business logic for combining results, such as:
   * Summing,
   * Averaging,
   * Weighted Combination: Combine results with different weights based on data size
3. Control iterative analysis. The aggregator decides when to stop or continue multi-iteration analyses
4. Send final results to the HUB. After aggregation is complete, the aggregator sends the final aggregated result to the Hub :tada:.

## Further questions 
 
### What is Federated Learning?
Federated learning (FL) is generally defined as a machine-learning pattern in which multiple participants collaboratively
train a shared model while keeping their training data at the originating devices or organizations [McMahan et al](https://api.semanticscholar.org/CorpusID:14955348).



