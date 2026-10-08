<script setup>
import VPImage from '../components/VPImage.vue';
const image = {
    light: '/images/components/FLAME_analysis_bright.png',
    dark: '/images/components/FLAME_analysis_dark.png'
}
</script>

# Architecture

FLAME consists of two parts: one central **Hub** and one **Node** at every participating site. The Hub coordinates,
the Nodes compute. Patient data stays at the site, only analysis code travels to the data and only aggregated results
travel back.

<VPImage :image="image"></VPImage>

The graphic gives a rough overview of the execution flow of an analysis. The individual services are listed on the
[Components](./components) page.

## Hub and Node

| | Hub | Node |
|---|---|---|
| Runs | once, centrally | once per site (hospital, university, ...) |
| Purpose | coordination | execution on local data |
| Holds | users, projects, analysis code, analysis images, results | the site's data stores and running analyses |
| Sees patient data | no | yes, inside the site only |
| Used by | researchers and administrators | node administrators and data stewards |

### Hub

The Hub is the single place researchers work with. Its services:

* **User Interface** to create projects and analyses, review them and download results.
* **Core** as the main backend, managing all resources and triggering commands and events.
* **Authentication and authorization** (Authup), organized in one *realm* per organization.
* **Analysis building**, which combines the approved code with a master image into a container image.
* **Container image registry** (Harbor) with a separate, private project for every node.
* **Message Broker**, which relays the messages nodes send to each other.
* **Storage** for code, intermediate results and final results.

### Node

A Node is installed on a Kubernetes cluster inside the network of a site. Its services:

* **Node UI** to configure data stores and to start, stop and monitor analyses.
* **Hub API Adapter**, the backend of the Node UI and the connection to the Hub.
* **Pod Orchestration**, which starts every analysis in its own isolated pod.
* **Data access through an API gateway** (Kong), which exposes exactly the data stores of a project to its analyses.
* **Message Broker** and **Result Service**, the node side of the communication with other nodes and the Hub.

## Lifecycle of an analysis

1. **Project:** a researcher creates a project in the Hub and selects the nodes that should take part. Every selected
   node approves or rejects the project.
2. **Data stores:** at every approving site, an administrator or data steward connects the requested data (a FHIR
   server or an S3 bucket) to the project as a data store.
3. **Analysis:** the researcher creates an analysis within the project, uploads the code and selects a master image
   with the required dependencies.
4. **Review:** the administrator of every node can download and read the code, and approves or rejects the analysis.
5. **Build and distribution:** after the approvals, the Hub builds one container image from master image and code and
   pushes it into the registry project of each node.
6. **Execution:** every node pulls its image. The node administrator starts the analysis in the Node UI. The analysis
   runs in an isolated pod and can only reach the data stores of its own project.
7. **Aggregation:** the analyzing nodes send their results to the node with the aggregator role, which combines them.
   For iterative methods such as federated learning this repeats over several rounds.
8. **Results:** the aggregator submits the final result to the Hub storage, where the researcher downloads it.

The same steps from the perspective of each role are described in the [User](../guide/user/index) and
[Admin](../guide/admin/index) guides.

## Communication

* **Nodes connect to the Hub, never the other way round.** All connections are initiated by the Node as outbound
  HTTPS. A Node does not have to be reachable from the internet.
* **Nodes do not talk to each other directly.** Messages and intermediate results are relayed through the Hub.
* **What is relayed is encrypted end to end.** Messages and intermediate results are encrypted for the receiving
  nodes with the node key pairs, so the Hub cannot read them.
* **Analyses are isolated.** An analysis container has no internet access and no access to other services of the
  Node. It only reaches its project's data, the message broker and the result service through a dedicated proxy.

Details are documented in [Security & Operations](../guide/deployment/node-security).

## Where data lives

| Data | Location | Leaves the site |
|---|---|---|
| Patient data (FHIR resources, files) | data stores of the site | no |
| Analysis code | Hub storage, and inside the analysis image | yes, it is distributed to the nodes |
| Analysis image | Hub registry, pulled by the nodes | yes, it is distributed to the nodes |
| Messages and intermediate results | relayed and stored by the Hub, end-to-end encrypted | yes, readable only by the receiving nodes |
| Local intermediate results and checkpoints | storage of the node | no |
| Final results | Hub storage | yes, downloadable by the researcher |

Because final results leave the federation, an analysis must only return aggregated, non-identifying values. This is
what the code review by the node administrators is for.

## Deployment

Hub and Node are both deployed with Helm charts on Kubernetes. See the [Deployment guide](../guide/deployment/index).
