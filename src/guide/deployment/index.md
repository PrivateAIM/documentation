# Deployment guide

FLAME consists of the central Hub and clinic-local Nodes. These guides are the canonical source for
deploying both components; repositories with scripts link back here instead of maintaining a second
copy of the instructions.

## Hub deployment

1. Read the [Hub deployment overview](./hub-introduction).
2. Prepare Kubernetes with [MicroK8s](./microk8s-quickstart) or
   [Minikube](./minikube-quickstart).
3. Select and verify [persistent storage](./hub-storage).
4. [Install and configure the Hub Helm chart](./hub-installation).

[Docker Compose](./hub-docker-compose) is available for development and evaluation.

## Node deployment

1. Prepare a cluster with [MicroK8s](./microk8s-quickstart) or
   [Minikube](./minikube-quickstart).
2. [Install the FLAME Node](./node-installation).
3. [Register it with the Hub](./node-registration).
4. Use the [troubleshooting guide](./node-troubleshooting) when required.
