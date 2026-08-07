# Storage for the FLAME Hub

The Hub contains several stateful services. Storage is therefore an infrastructure decision, not
just a chart setting. The chart uses the cluster's default `StorageClass` unless an explicit class is
configured for a component.

## Recommended model

Use a CSI-backed volume service that provides durable block storage and supports detaching a volume
from a failed VM and reattaching it to the replacement node. Examples include OpenStack Cinder,
managed cloud block storage, and a storage system operated directly by the Kubernetes platform.

For FLAME clusters running as virtual machines on OpenStack, the recommended choice is the
[OpenStack Cinder CSI driver](https://github.com/kubernetes/cloud-provider-openstack). When the
Cinder volume type is backed by Ceph, replication already happens below Kubernetes. Do not add a
second Mayastor replication layer on top: it will slow everything down.


## Verify the cluster storage

List available classes and identify the default:

```bash
kubectl get storageclass
```


## Configure the chart

If the correct class is the cluster default, no storage override is necessary. Otherwise set the
same durable class on each persistent component in your override file. The exact keys can change as
upstream subcharts evolve, so use the current
[`values.yaml`](https://github.com/PrivateAIM/helm/blob/master/charts/flame-hub/values.yaml) as the
reference.

The first-party PostgreSQL and SeaweedFS settings look like this:

```yaml
postgresql:
  persistence:
    storageClass: <cinder-storage-class>
    size: 16Gi

seaweedfs:
  allInOne:
    data:
      storageClass: <cinder-storage-class>
      size: 80Gi
```

Also review persistence for Harbor registry/jobservice/Trivy, RabbitMQ, Grafana, Prometheus,
VictoriaLogs, and `serverCoreWorker`. Size these claims for the expected analysis and retention
load.

::: warning Storage classes are effectively immutable for existing claims
Changing a value does not migrate existing data.
:::
