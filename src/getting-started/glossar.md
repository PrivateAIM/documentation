# Glossary

| Term | Explanation |
|:---|:---|
| Aggregation protocol | Algorithm code how final/online results are computed |
| Aggregator | Node of an analysis that combines the results of the analyzers, decides in iterative analyses whether another round is needed, and submits the final result to the Hub |
| Analysis | Docker containers containing algorithm, analysis logic and software dependencies |
| Analyzer | Node of an analysis that executes the analysis code on its local data and sends its result to the aggregator |
| Authup | Identity and access management service of the Hub, managing realms, users, roles, clients and permissions |
| Bucket | Storage location for files in an S3 object store. A bucket is connected to a project as a data store |
| Checkpoint | Saved state of an analysis in the local storage of a node, from which a later analysis of the same project can resume |
| Client | Technical account for automated access to the Hub API, which cannot log in to the user interface (formerly *robot*) |
| Core SDK | Python library (`FlameCoreSDK`) through which analysis code accesses data, exchanges messages with other nodes and submits results |
| Data discovery | Pre-analysis to verify biases, schemas or any other unexpected behavior by sites |
| Data steward | Role at a node that may create and modify data stores, but not start or stop analyses |
| Data store | Configuration at a node that maps a project to a data source of the site, either a FHIR server or an S3 bucket |
| DIC | Data Integration Center. Unit at a university hospital of the MII that provides clinical data for research |
| Differential privacy | Technique that adds calibrated noise to a result, so that it reveals less about individual persons |
| Federated Learning | Parallel execution of analysis code at multiple sites, at the same time with a global result aggregation |
| FHIR | Fast Healthcare Interoperability Resources |
| FHIR Core | Common data schema developed by MII to be fulfilled by each DIC |
| Final results | Results achieved by aggregator, can be encrypted project specific |
| FLAME | Federated Learning and Analysis In Medicine |
| Harbor | Container image registry of the Hub. Analysis images are distributed to the nodes through a separate project per node |
| Homomorphic encryption | Encryption scheme that allows computing on encrypted values without decrypting them |
| Hub | All service components centrally hosted and operated |
| Identity provider | External login service (OIDC) that can be connected to a realm, so users log in with their existing account |
| Intermediate results | Results stored during an analysis, either locally on a node or on the Hub, encrypted for the receiving nodes |
| Kong | API gateway of a node through which an analysis accesses the data stores of its project |
| Master image | Base container image providing the runtime and software dependencies on which an analysis is built |
| Message broker | Service that relays messages between the nodes of an analysis through the Hub |
| MII | Medical Informatics Initiative. German funding program in which PrivateAIM is a project |
| Nodes | Hospitals hosting a node to provide analysis controlled and secure access to patient data |
| Paillier - key | This is the key to a homomorphic encryption system to additionally secure the calculated data inside the analysis |
| Permission | Predefined action in the Hub that is granted to users through roles |
| PrivateAIM | Project within the MII that develops the FLAME platform |
| Project | Current name of a proposal in the Hub user interface, see *Proposal* |
| Proposal | A Proposal is an organizational unit in FLAME, which represents the collaboration between different participants in regard to a specific research or analysis project. It contains an initial risk assessment as well as a high level description of the requested data. |
| Proxy | Node of an analysis without data that pre-aggregates the results of its assigned analyzers, so the aggregator never sees the result of a single node (`ProxyModel`) |
| Realm | Administrative namespace in the Hub representing one organization, with its own users, roles, identity providers and nodes |
| Registry | Service to distribute analysis |
| Result inspection | Before results are returned these should be approved by sites to not contain unauthorized information |
| Role | Named set of permissions that is assigned to users |
| RSA - key | This is the key to a homomorphic encryption system to secure the analysis from external influences |
| S3 | Object storage interface. FLAME reads files such as CSV or VCF from S3 buckets |
| Star pattern | Analysis topology in which every analyzer reports to one aggregator (`StarModel`) |
| UI | User Interface |
