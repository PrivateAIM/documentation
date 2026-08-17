# Install the FLAME Hub with Helm

The FLAME Hub chart installs the Hub services, PostgreSQL, SeaweedFS, the enabled observability and
messaging dependencies, and optionally a bundled Harbor registry. Keep site-specific configuration
in an override file; do not copy the complete default `values.yaml`, because copied defaults become
stale during upgrades.

## Prerequisites

- Kubernetes and Helm 3 are available from the operator workstation.
- The chosen [StorageClass](./hub-storage) has been tested.
- An Ingress controller or Gateway API controller is installed.

Harbor cannot be hosted below the Hub's path. If it is enabled, it needs its own hostname.

## Choose Ingress or Gateway API

The chart supports both routing models.

### Ingress

Enable `global.flameHub.ingress` for path-based routing through one Hub hostname. The default
annotations target ingress-nginx and include the body-size and timeout settings required for large
uploads. Replace them when using another controller. Harbor has its own ingress block and hostname.

### Gateway API

The chart is tested with
[NGINX Gateway Fabric](https://docs.nginx.com/nginx-gateway-fabric/install/helm/). Install the Gateway
API resources supported by the selected NGF release before installing its controller. The commands
below pin NGF and its Gateway API resources to the same release. FLAME uses NGF's `SnippetsPolicy`,
which is disabled by default and must be enabled explicitly.For a simple self-managed cluster without a `LoadBalancer` implementation, NGF can instead run as a DaemonSet with fixed NodePorts:

```bash
NGF_VERSION=v2.6.7

kubectl kustomize \
  "https://github.com/nginx/nginx-gateway-fabric/config/crd/gateway-api/standard?ref=${NGF_VERSION}" \
  | kubectl apply -f -

helm upgrade --install ngf oci://ghcr.io/nginx/charts/nginx-gateway-fabric \
  --namespace nginx-gateway --create-namespace \
  --version "${NGF_VERSION#v}" \
  --set nginxGateway.snippets.enable=true \
  --set nginx.kind=daemonSet \
  --set nginx.service.type=NodePort \
  --set nginx.service.externalTrafficPolicy=Local \
  --set-json 'nginx.service.nodePorts=[{"port":31437,"listenerPort":80},{"port":30478,"listenerPort":443}]'
```


This exposes the listeners on the selected ports of each eligible node. Configure the public reverse
proxy or load balancer to route to those ports.

The chart can create its own Gateway, or attach HTTPRoutes to an existing Gateway. Enable
`global.flameHub.gatewayApi.enabled` and set `nginxGatewayFabric.snippets: true` when using NGF.
An external Gateway requires a `parentRef` and may require a `ReferenceGrant` when it lives in a
different namespace.

### Minimum Gateway API values

This minimal example creates a TLS-enabled Gateway for the Hub and bundled Harbor. The referenced
Secret must contain a certificate valid for both `hub.test` and `harbor.test`:

```yaml
global:
  flameHub:
    publicHttps: true
    ingress:
      enabled: false
    gatewayApi:
      enabled: true
      hostname: hub.test
      tls:
        enabled: true
        certificateRef: hub-local-tls
      gateway:
        gatewayClassName: nginx
      nginxGatewayFabric:
        snippets: true

harbor:
  enabled: true
  externalURL: https://harbor.test
  ingress:
    enabled: false
  gatewayApi:
    enabled: true
```

Harbor inherits the global Gateway certificate settings. Set `harbor.gatewayApi.tls` only when its
hostname uses a different certificate. See the current
[`values.yaml`](https://github.com/PrivateAIM/helm/blob/master/charts/flame-hub/values.yaml) for all
fields.

## Install from the chart repository

```bash
helm repo add flame https://PrivateAIM.github.io/helm
helm repo update
helm show values flame/hub > values-reference.yaml
```

Create a small `values-hub.yaml`. This Ingress example relies on the chart defaults for generated
credentials and the default StorageClass:

```yaml
global:
  flameHub:
    publicHttps: true
    ingress:
      enabled: true
      hostname: hub.test

authup:
  publicURL: https://hub.test

harbor:
  enabled: true
  externalURL: https://harbor.test
  ingress:
    enabled: true
```

Compare this example with the current
[`values_min.yaml`](https://github.com/PrivateAIM/helm/blob/master/charts/flame-hub/values_min.yaml)
and [`values.yaml`](https://github.com/PrivateAIM/helm/blob/master/charts/flame-hub/values.yaml)
before use.

Install into a dedicated namespace:

```bash
helm upgrade --install flame-hub flame/hub \
  --namespace flame-hub --create-namespace \
  --values values-hub.yaml \
  --wait --timeout 15m
```

To work on unreleased chart source instead, clone the Helm repository, run
`helm dependency update charts/flame-hub`, and use `./charts/flame-hub` as the chart argument.

## Credentials and Secrets

On first installation the chart generates random values and keeps them in three Secrets:

| Secret | Purpose |
| --- | --- |
| `flame-hub-auth` | RabbitMQ, Redis, Grafana, and authup credentials and connection strings |
| `flame-hub-pg` | PostgreSQL username and password; also used by Harbor |
| `flame-hub-harbor` | Harbor admin password, connection string, and the 16-character core `secretKey` |

Retrieve initial administrator passwords with:

```bash
kubectl -n flame-hub get secret flame-hub-auth \
  -o jsonpath='{.data.authup-admin-password}' | base64 -d; echo

kubectl -n flame-hub get secret flame-hub-harbor \
  -o jsonpath='{.data.harbor-admin-password}' | base64 -d; echo
```

Chart-managed Secrets and important PVCs carry Helm's `keep`
policy and can remain after `helm uninstall`; inventory them explicitly during cleanup.

## Verify the installation

```bash
kubectl -n flame-hub get pods,pvc
kubectl -n flame-hub get httproute,gateway # (or ingress)
helm -n flame-hub status flame-hub
```


## Multiple releases in one namespace

Several dependency charts cannot template resource names. If multiple Hub releases must share a
namespace, assign unique PostgreSQL Service/Secret, central auth Secret, Harbor Service/Secret, and
matching dependency references. The complete list is maintained in the
[chart README](https://github.com/PrivateAIM/helm/tree/master/charts/flame-hub#running-multiple-releases-in-the-same-namespace).
