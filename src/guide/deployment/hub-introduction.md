# FLAME Hub deployment

This section describes a standalone FLAME Hub deployment. The supported production path is the
[FLAME Hub Helm chart](https://github.com/PrivateAIM/helm/tree/master/charts/flame-hub) on Kubernetes.
Docker Compose is available for development and evaluation, but it does not include Harbor and is
not the recommended production topology.

## What the chart installs

The Hub chart installs the FLAME services and their supporting components, including:

- Core FLAME Hub services
- Databases, S3 Storage, Message Broker
- Harbor for storing container images (optional, you can also bring your own)
- Ingress or HTTPRoute/Gateway, but **no Ingress controller or Gateway Controller**

## Baseline requirements

- A supported Kubernetes cluster and Helm 3.
- A default `StorageClass`, or explicit storage classes for every persistent component.
- At least 4 CPU cores and enough memory and storage for the enabled services. Capacity depends on
  the number and size of analyses; the worker and registry volumes usually dominate.
- A DNS name for the Hub. If the bundled Harbor registry is enabled, it needs a separate hostname.
- An Ingress controller or a Gateway API implementation. The chart is tested with NGINX Gateway
  Fabric when using Gateway API.
- TLS certificates for every public hostname in a real deployment.

For an OpenStack-hosted cluster, use the OpenStack Cinder CSI driver and a suitable Cinder
`StorageClass`. Cinder/Ceph supplies durable, reattachable block storage.

## Repository responsibilities

- This documentation repository owns the deployment concepts and complete guides.
- [`PrivateAIM/hub-deployment`](https://github.com/PrivateAIM/hub-deployment) contains small helper
  scripts, copyable configuration snippets and the docker-compose file.
- [`PrivateAIM/helm`](https://github.com/PrivateAIM/helm) owns the chart, default values, and the
  exhaustive value reference.

Continue with [Kubernetes preparation](./microk8s-quickstart) or go directly to
[installing the Hub chart](./hub-installation) if a cluster is already available.
