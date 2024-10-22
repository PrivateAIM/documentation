# Installation

::: info
This section will provide installation instructions for installing a node.<br><br>**These instructions assume that the
[node has been registered in the UI](./node-registration#creating-a-node-in-the-hub) and that you have obtained the 
[credentials for your node's robot](./node-registration#credentials-for-deployment).**
:::

## Requirements

### Hardware
* 8 cores
* 16GB (minimum) - 32GB (recommended) RAM
* 100GB storage

### Networking
* Ports 22 and 443 are open
* Access to the internet for communicating with the Hub

### Software
#### Kubernetes
Kubernetes (also known as k8s) is a container management software package which allows for rapid deployment and
scaling of multiple applications and service. There are multiple distributions of k8s available for a variety of
system configurations. The only requirement for the FLAME Node software is that a network plugin (e.g. Calico)
is installed in your k8s installation to allow for network policy management. The following distributions have been
tested for use with the Node software:

* [Kubernetes](https://kubernetes.io/docs/setup/)
* [minikube](https://minikube.sigs.k8s.io/docs/start/?arch=%2Fwindows%2Fx86-64%2Fstable%2F.exe+download)
* [microk8s](https://microk8s.io/docs/getting-started)


#### Helm
The FLAME Node software package is a compilation of multiple services working together and require several
configuration parameters to be properly set during installation. [Helm](https://helm.sh/) is k8s application
management tool that simplifies deploying complex software. It enables one to easily install, update, or rollback
multi-service software and we highly recommend using this tool for installing the FLAME Node.
[See the Helm website](https://helm.sh/docs/intro/install/) for instructions on how to install Helm on your system.


## Preparation

In order to deploy a node, you will need the following pieces of information for your node's robot from the Hub:

1. ID
2. Secret (not hashed!)

With this information, you can either edit the `values.yaml` file included with the FLAME Node helm chart or create
you own values template file to be applied to the installation and upgrades of the node such that it looks like this:

```yaml
global:
  hub:
    endpoints:
      ...
    auth:
      robotUser: <Robot ID>
      robotSecret: <Robot Secret>
```

### Keycloak
By default, the FLAME Node package deploys keycloak as part of the installation. The clients and their secrets are
all generated and configured within this included IDP. If you wish to your own IDP, then clients for the Node Hub
Adapter and the Node UI will have to be created and their secrets set in the values template. See the
[Using Your Own IDP](#using-your-own-idp) section for more information.

### Ingress
To allow domain names to be used for individual services in k8s, the ingress must be enabled and the hostnames set,
otherwise the ports for individual services must be port forwarded to access the GUIs e.g.

```bash
kubectl port-forward svc/flame-node-node-ui 3000:3000
```

The values template file can be used to enable ingress and specify hostname for the services:

::: warning Check your DNS
Be sure any domain names you set for these applications are configured in your DNS to point towards your k8s cluster!
:::

```yaml
global:
  hub:
    auth:
      robotUser: <Robot ID>
      robotSecret: <Robot Secret>
  node:
    ingress:
      enabled: true
      hostname: your.node.ui.domain.com

flame-node-ui:
  idp:
    host: keycloak.idp.com

keycloak:
  ingress:
    enabled: true
    hostname: keycloak.idp.com
```

::: info Note
The hostname for the keycloak instance must be currently explicitly set for both the keycloak and node UI services,
this will be changed in the future so it must only be set once.
:::

### Using Your Own IDP
...

## Installation

Once the `values.yaml` has been fully configured, it can then be used to install the FLAME Node.

::: info Note
Currently, one can only install the software by cloning the repository from GitHub. Additional installation methods
will be added in the future including a dedicated chart repository.
:::

### Installing from the Cloned GitHub Repository
Users can clone the FLAME Node Helm charts by cloning the
`node-deployment` [repository](https://github.com/PrivateAIM/node-deployment) from GitHub. The `flame/` directory
contains the parent helm chart used for the deployment.

First you must compile the sub-charts:
```bash
cd flame/
helm dependency build
```

This will package the Helm charts for the individual components and bundle them in a folder in the `flame/` directory.

### Deployment

::: info Note
The Helm release name `flame-node` is used in the following examples, but any release name can be used in place of it.
:::

If you edited the default `values.yaml`, then you can run the following command from within the `flame/` directory to
install the node:

```bash
helm install flame-node .
```

If you created your own custom values template file (e.g. `my-values.yaml`) then it can be applied during
installation (and upgrades):

```bash
helm install -f my-values.yaml flame-node . 
```

::: warning Startup Time
Several services are deployed as part of this Helm chart and some need to execute initialization containers in order
to properly import the configuration. This can cause the `helm install` to hang for a few minutes while everything
is deployed and verified, so please have patience during this step and do not prematurely cancel the command.
:::

