# Security & Operations

This page is a technical reference for IT security officers, data protection officers and operators who assess or run
a FLAME Node. It describes how the Node behaves today (Helm chart `flame-node` 1.0.x) and is intended to be referenced
from site-specific documents such as an operating concept (Betriebskonzept), data protection concept or information
security concept.

## Network

### Inbound

The Hub never opens a connection to a Node. All communication between Node and Hub is **initiated by the Node**
(outbound HTTPS and a WebSocket connection to the Hub messenger). Nodes do not talk to each other directly; messages
and intermediate results are relayed through the Hub.

The Node therefore does **not** need to be reachable from the internet. Inbound access is only needed so that local
staff (node administrators, data stewards) can open the Node UI in their browser. Whether this is reachable from the
clinic network only, via VPN, or from outside is a site decision. By default the chart exposes nothing
(`expose.type: none`).

When `expose.type` is `ingress` or `gateway`, the chart creates routes on a single hostname:

| Path                          | Target              | Purpose                                                     |
|-------------------------------|---------------------|-------------------------------------------------------------|
| `/`                           | Node UI (3000)      | Web interface                                               |
| `/api`                        | Hub Adapter (5000)  | Backend called by the Node UI in the browser                |
| `/keycloak/`                  | Keycloak (80)       | Node-internal service authentication                        |
| `/logs` (optional, off)       | VictoriaLogs (9428) | Log UI – **no authentication**, do not expose publicly      |

Researchers never interact with the Node. They work exclusively with the Hub.

::: tip Browser access to the Hub
The Node UI logs users in via the Hub. The browsers of node staff must therefore be able to reach the Hub auth
endpoint as well.
:::

### Outbound

All outbound connections use HTTPS (TCP 443) unless you configure different endpoints.

| Destination                                  | Used by                                       | Purpose                                              |
|----------------------------------------------|-----------------------------------------------|------------------------------------------------------|
| `hub.endpoints.core`                         | Pod Orchestrator, Hub Adapter, Storage, Broker | Hub API (projects, analyses, status, logs)          |
| `hub.endpoints.auth`                         | all node services, user browsers               | Token issuing (client credentials, user login)      |
| `hub.endpoints.messenger`                    | Message Broker                                 | Socket.io / WebSocket for node-to-node messages     |
| `hub.endpoints.storage`                      | Storage Service                                | Upload of intermediate and final results            |
| Harbor registry of the Hub                   | container runtime (kubelet)                    | Pulling analysis images                              |
| `ghcr.io`, `docker.io`, `quay.io`            | container runtime (kubelet)                    | Pulling the Node's own component images              |

The Hub endpoints are configured under `hub.endpoints` in the values file. The Harbor host is the registry selected for
your node in the Hub.

::: warning Proxies
The `proxy.*` values only apply to the Node services. Image pulls (analysis images from Harbor and component images)
are performed by the container runtime of your Kubernetes nodes. If outbound traffic has to pass a proxy, configure it
for the container runtime (e.g. containerd) as well.
:::

### Isolation of analyses

Every analysis runs in its own pod. The Pod Orchestrator creates a dedicated nginx proxy and a `NetworkPolicy` per
analysis that only allows traffic between the analysis pod and its proxy (plus DNS lookups to the cluster DNS). The proxy in turn only forwards an
allow-list of requests: data access through Kong for the project's data stores, the storage service (results), the
message broker (for this analysis only) and log streaming. Analysis containers therefore have **no internet access**
and no access to other Node services.

This requires a CNI plugin that enforces network policies (e.g. Calico), see
[Requirements](./node-installation#kubernetes). The chart does not ship a namespace-wide default-deny policy; sites
may add one.

## Encryption

| Path                                            | Protection                                                                                   |
|-------------------------------------------------|----------------------------------------------------------------------------------------------|
| Node → Hub (API, auth, storage, messenger)      | TLS, server certificate verified (system trust store + optional [custom CAs](./node-installation#additional-certificate-authority-ca-certificates)) |
| Browser → Node UI                               | TLS terminated at your ingress / reverse proxy                                               |
| Messages between nodes (via Hub messenger)      | TLS **and** end-to-end: ECDH (P-256) key agreement + AES-256-GCM                             |
| Intermediate results between nodes (via Hub storage) | TLS **and** end-to-end: ECDH (P-256) + HKDF-SHA256 + AES-GCM                           |
| Final results (Node/Aggregator → Hub)           | TLS only. Final results are aggregated, not end-to-end encrypted, and stored in the Hub result storage |
| Kong → data stores (FHIR, S3)                   | Configurable per data store (HTTP or HTTPS, optional client certificate / CA)                |
| Communication inside the cluster                | Plain HTTP between Node services; no service mesh / mTLS                                     |

Encryption inside the cluster can be added by the site (e.g. through a service mesh) if required by local policy.

### Node key pair

Each node has an ECDH key pair (curve P-256) used for the end-to-end encryption above.

* The key pair is generated **in the administrator's browser** via the WebCrypto API when clicking "Generate" in the
  Hub UI ([Registering in the Hub](./node-registration#crypto)).
* Only the **public key** is sent to and stored by the Hub. The private key is shown once for copying and is not
  stored anywhere by the Hub.
* The private key is provided to the Node at deployment (`hub.crypto.privateKey` or `hub.crypto.existingSecret`) and
  stored as a Kubernetes Secret. It is mounted only into the storage service and the message broker.
* To rotate the key, generate a new pair in the Hub, save it, and update the Secret on the Node.

The key generation code is part of the open-source Hub UI and is delivered by the Hub operator over TLS. Trust in its
integrity is therefore trust in the Hub operator. FLAME does not currently publish SBOMs or signatures for its
container images.

## Integrity of analysis code

1. A researcher uploads the analysis code to the Hub and selects a master image.
2. Every participating node's administrator can **download and review the code** and must **approve** it before the
   image is built ([Analysis Review](../admin/analysis-review)).
3. After all nodes have decided, the Hub builds a container image from the master image and the approved code.
   The Hub does **not** sign this image. Instead it records the image's content hash (`sha256` image ID), which is
   shown in the Hub UI in the analysis' build step.
4. The image is pushed to a **private project per node** in the Hub's Harbor registry. Each node pulls only from its
   own project using node-specific robot credentials.
5. Administrators can compare the hash shown in the Hub with the image present on their node, e.g.
   `crictl inspecti <image>` (field `id`) or `microk8s ctr images ls`.

### Master images

Master images contain the base runtime and libraries for analyses. They are maintained in the public
[master-images](https://github.com/PrivateAIM/master-images) repository and built by the Hub.

* Changes require a reviewed pull request; only maintainers can merge into the release branch.
* Images are scanned for known vulnerabilities (CVE) in CI before release.
* Only Hub users with the `MASTER_IMAGE_MANAGE` permission can trigger synchronisation and building of master images
  in the Hub.

## Access control

| Decision                                                       | Where                | Who                                     |
|----------------------------------------------------------------|----------------------|-----------------------------------------|
| User accounts, identity providers, realms                      | Hub                  | Hub operator / realm administrators     |
| Creating projects and analyses                                 | Hub                  | Researchers                             |
| Participation of a node in a project                           | Hub (or Node UI)     | Node administrator of the site          |
| Approval of an analysis (after code review)                    | Hub (or Node UI)     | Node administrator of the site          |
| Starting / stopping analyses on the node                       | Node UI              | Node roles `admin`, `researcher`        |
| Configuring data stores (which data an analysis can access)    | Node UI              | Node roles `admin`, `steward`           |
| Data access of an analysis                                     | Node (Kong)          | Enforced per project: an analysis can only reach the data stores of its own project |

Node UI users log in with their Hub account. Node roles (`admin`, `steward`, `researcher`) are read from the
`global_access.roles` claim of the Hub token, i.e. they are **global roles on the Hub** and are assigned by the Hub
operator (see [Role-Based Access Control](./node-installation#role-based-access-control-rbac)). Technical staff with
access to the Kubernetes cluster (e.g. `kubectl`) have further access paths in the context of their work, e.g. to
secrets and databases of the Node; these are governed by the site's own operating rules.

### Identity of researchers

Researchers authenticate at the Hub, not at the site. Accounts are created or approved by the Hub operator, or
federated from an identity provider such as the researcher's home institution. The home institution is accountable for
its researchers under the respective data usage agreement. Independently of this, each site decides via project and
analysis approval whether its data is used.

## Results and disclosure control

Only results that an analysis explicitly submits leave a node. Raw data never leaves the node.

* **Code review:** Before an analysis can run, the node administrator reviews the code and verifies that only
  aggregated results are returned in accordance with the study protocol. This is the primary safeguard.
* **Network isolation:** Analyses cannot send data anywhere except through the storage service and message broker
  (see [Isolation of analyses](#isolation-of-analyses)).
* **Local differential privacy (optional):** The SDK can add Laplace noise to a numeric final result on the node
  (`submit_final_result(..., local_dp=...)`). Epsilon and sensitivity are chosen by the analysis and should be checked
  during the review.
* **Logs:** Analysis logs are visible to the node administrators and, by default, forwarded to the Hub
  (`enableHubLogging`). Review analysis code for logging of sensitive values.

::: warning No automatic anonymity checks
FLAME does not automatically enforce minimum cohort sizes, k-anonymity thresholds or other output checks. Aggregation
alone does not guarantee anonymity; the adequacy of the returned results must be assessed during the review of each
analysis.
:::

## Logging and audit

| Where | What                                                                                              | Retention                       |
|-------|---------------------------------------------------------------------------------------------------|---------------------------------|
| Node  | JSON logs of all node services and analyses, collected into VictoriaLogs                          | 1 year (`victorialogs` values)  |
| Node  | User actions in the Node UI (Hub Adapter events, including user name), stored in PostgreSQL and the logs | as above                  |
| Node  | Analysis logs and network statistics per analysis, stored with the analysis in PostgreSQL          | until the analysis is deleted   |
| Hub   | Events on Hub resources (create/update/delete of projects, analyses, approvals, …) with actor      | `EVENT_RETENTION_DAYS` of the Hub (default 7 days), set by the Hub operator |

Logs are stored in regular databases and are **not** tamper-evident (no hash chain or WORM storage). If a
tamper-evident audit trail is required, forward the logs to the site's SIEM or WORM storage.

## State, backup and recovery

### Stateful components

| Component            | Volume (default) | Contents                                                          |
|----------------------|------------------|-------------------------------------------------------------------|
| PostgreSQL           | 8 GiB            | Analyses and their status/logs, Hub Adapter events and settings   |
| Kong PostgreSQL      | 2 GiB            | Data store configuration (services, routes, consumers)            |
| Keycloak PostgreSQL  | 8 GiB            | Node-internal service clients                                     |
| SeaweedFS            | 10 GiB           | Local results and checkpoints of analyses                         |
| MongoDB              | 500 MiB          | Message broker state                                              |
| VictoriaLogs         | 20 GiB           | Logs                                                              |

Research data itself is **not** stored by the Node unless you enable the optional data store subchart; it remains in
your data sources (FHIR server, S3) and is backed up there.

### What to back up

* The PostgreSQL volumes (at least the main and Kong databases) and optionally SeaweedFS and VictoriaLogs.
* The Kubernetes Secrets of the release, in particular `<release>-ecdh-private-key-secret` (the Hub does not store the
  private key) and `<release>-hub-client-secret`, as well as the generated database credentials.
* Your values file.

### Availability

All components run with one replica. High availability (multiple replicas, leader election, hot failover) is **not
supported**. Recovery relies on Kubernetes: crashed pods are restarted automatically, and running analyses keep
running while the Pod Orchestrator restarts. The Pod Orchestrator resumes from its database and restarts stuck analyses
up to three times. If a restart does not help, restore the last backup or redeploy the release with the backed-up
values and secrets.

## Releases and updates

* All components follow [Conventional Commits](https://www.conventionalcommits.org/) and are released with
  release-please. Each release has a changelog; breaking changes are listed under **⚠ BREAKING CHANGES**.
  * Node Helm chart: [PrivateAIM/helm CHANGELOG](https://github.com/PrivateAIM/helm/blob/master/CHANGELOG.md),
    notable upgrade steps are described in the [version notes](/versions/v0.1.0) of this documentation.
  * Hub: [PrivateAIM/hub CHANGELOG](https://github.com/PrivateAIM/hub/blob/master/CHANGELOG.md)
* The Node chart is published in the Helm repository `https://PrivateAIM.github.io/helm`. Update a node with

  ```bash
  helm repo update
  helm upgrade --namespace <NAMESPACE> flame-node flame/flame-node -f my-values.yaml --version <VERSION>
  ```

  Read the changelog before upgrading across a breaking change.
* A **software update** in this sense is a patch or minor release (bug fixes, security fixes, dependency updates).
  A **release change** is a new major release that may require changes to the configuration.
* A policy for stable, long-term supported releases and maintenance windows will be published before the end of the
  project.
