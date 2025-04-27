# Installation
This section will provide installation instructions for installing a node.<br><br>**These instructions assume that the
[node has been registered in the UI](./node-registration#creating-a-node-in-the-hub) and that you have obtained the 
[credentials for your node's robot](./node-registration#credentials-for-deployment).**

## Requirements

### Hardware
* 8 cores
* 16GB (minimum) - 32GB (recommended) RAM
* 100GB storage

### Networking
* Ports 22 and 443 are open
* Access to the internet for communicating with the Hub

### Software
::: tip
A quick start guide to installing microk8s and Helm can be found [here](./microk8s-quickstart). 
:::
#### Kubernetes
Kubernetes (also known as k8s) is a container management software package which allows for rapid deployment and
scaling of multiple applications and service. There are multiple distributions of k8s available for a variety of
system configurations. The only requirement for the FLAME Node software is that a network plugin (e.g. Calico)
is installed in your k8s installation to allow for network policy management. The following distributions have been
tested for use with the Node software:

* [microk8s](https://microk8s.io/docs/getting-started)
* [minikube](https://minikube.sigs.k8s.io/docs/start/?arch=%2Fwindows%2Fx86-64%2Fstable%2F.exe+download)
* [Kubernetes](https://kubernetes.io/docs/setup/)


#### Helm
The FLAME Node software package is a compilation of multiple services working together which require several
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
      hostname: https://your.node.ui.domain.com

keycloak:
  auth:
    adminUser: admin
    adminPassword: admin
```

::: info Note
The default installation method assumes that if you have SSL enabled (i.e. using HTTPS), then this is handled by 
a reverse proxy. If this is not the case, you need to disable the proxy headers for keycloak like shown in this 
<a href="/files/values_no_reverse_proxy_example.yaml" download>example</a>.
:::

### Using Your Own IDP
For better security, this software uses Keycloak for authenticating the various services and users that make up FLAME. 
Keycloak is installed along with the other services and is required for the creation and management of the individual 
analyses. Using the keycloak console, the admin you can add additional users who can access the FLAME UI, but you may 
also use your own IDP for authentication if you wish.

To enable this, first you must create individual clients for both the Node UI and the Hub Adapter in your IDP in either 
their own realm, or in a realm with the users you wish to grant access to. 
Be sure to enable client authentication and take note of the client ID and secret for both of these newly created 
clients as this information as well as the (accessible) URL for your IDP must be provided in the `values.yaml`.
An example of how to configure this in for your cluster can be seen in this
<a href="/files/values_separate_idp.yaml" download>separate IDP example</a>.

## Installation

Once you have created and configured your values file (e.g. `my-values.yaml`) with the required credentials, 
it can then be used to install the FLAME Node.

::: info Note
The Helm release name `flame-node` is used in the following examples, but any release name can be used in place of it.
:::

### Using the FLAME repo
The FLAME helm repository can be added to your list of available repos and then used to deploy the node software. 
First, add the FLAME repo:
```bash
helm repo add flame https://PrivateAIM.github.io/helm
```

Deploy the FLAME Node using your values file 
```bash
helm install flame-node -f my-values.yaml flame/flame-node
```

### Using the GitHub Repository
Users can clone the FLAME Node Helm charts by cloning the
`helm` [repository](https://github.com/PrivateAIM/helm) from GitHub. The `charts/flame-node/` directory
contains the parent helm chart used for the deployment.

First you must compile the sub-charts which will package the Helm charts for the individual components and bundle 
them in a folder in the `flame-node/` directory:
```bash
cd charts/flame-node/
helm dependency build
```

Then you can deploy the FLAME Node using this local helm chart:
```bash
helm install flame-node -f my-values.yaml . 
```

::: warning Startup Time
Several services are deployed as part of this Helm chart and some need to execute initialization containers in order
to properly import the configuration. This can cause the `helm install` to hang for a few minutes while everything
is deployed and verified, so please have patience during this step and do not prematurely cancel the command.
:::

## Deploying without a Domain
There are circumstances in which the FLAME Node needs to be deployed without a fully qualified domain name (FQDN). 
In this case, the UI and other services will not be reachable via a domain or hostname. Those with access to the server 
running the services can port forward the individual containers for each of the services and access them in their 
browser using the forwarded ports.

### Disable Ingress
When deploying the FLAME node without a domain, the values file must be configured to disable ingress for the services:
```yaml
global:
  hub:
    auth:
      robotUser: <Robot ID>
      robotSecret: <Robot Secret>
  node:
    ingress:
      enabled: false
      hostname: ""
```
Be sure to still populate the `robotUser` and `robotSecret` with the credentials obtained from the Hub.

### Accessing the Services
Once you have deployed the FLAME Node with the ingress disabled, three services need to be port-forwarded:
* Node UI
* Hub Adapter
* Keycloak

#### Get the Service Names
Depending on what the helm deployment was named, the service names will vary. In our example above, we used 
`flame-node` for the release name so each of the services will have this as a prefix.

Get a list of currently running services (and their names) with
```bash
kubectl get svc
```
![services.png](../../public/images/installation/services.png)

#### Port Forward the Services
Using the names obtained in the previous section, we can forward the ports these services are using to the same ports 
on our local machine:
```bash
kubectl port-forward svc/flame-node-node-ui-service 3000:3000 & \
kubectl port-forward svc/flame-node-hub-adapter-service 5000:5000 & \
kubectl port-forward svc/flame-node-keycloak 8080:80
```
Now you can access these services in your browser. For example, to access the Node UI, open a browser and navigate to 
`http://localhost:3000`.
