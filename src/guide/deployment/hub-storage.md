# OpenEBS/Mayastor for FLAME (optional)

OpenEBS is a chart that provides extra storage options. We will be using Mayastor Replicated Storage to synchronize Persistent Volumes across multiple nodes in the cluster. This aims to ensure no data is lost when a node fails. With extra configuration, it enables automatic failover.

If you want to enable storage replication, you need to:
1. Prepare your k8s nodes
2. Install OpenEBS into your k8s cluster 
3. Configure the your Application (FLAME Hub) to use the new storage class

## Node Setup
Before installing OpenEBS, you must prepare the k8s nodes you want to use for mayastor.

### Automatic script 🤖
Use the script `prepare_for_mayastor.sh`.
> The script has been tested in Debian.
>
> The script can safely be run multiple times.

Download the script: [prepare_for_mayastor.sh](https://github.com/PrivateAIM/hub-deployment/tree/master/scripts)

```bash
wget https://docs.privateaim.de/scripts/prepare_for_mayastor.sh
chmod +x prepare_for_mayastor.sh
sudo ./prepare_for_mayastor.sh
```
*Note: Adjust the URL to match your documentation hosting or use the relative path if accessing directly.*

Alternatively, you can manually do the following:

### 1. Configure hugepages
Enable hugepages:
```bash
echo 1024 > /sys/kernel/mm/hugepages/hugepages-2048kB/nr_hugepages
```
Persist hugepages and apply:
```bash
echo "vm.nr_hugepages = 1024" > /etc/sysctl.d/20-microk8s-hugepages.conf
sysctl --system
```

### 2. Load NVMe-oF module
Load the module immediately:
```bash
modprobe nvme-tcp
```
Persist the module across reboots:
   * If `/etc/modules-load.d/nvme-tcp.conf` does not exist or does not
     contain `nvme-tcp`, create it with:
```bash
echo "nvme-tcp" > /etc/modules-load.d/nvme-tcp.conf
```

### 3. Verify
Check hugepages:
```bash
grep HugePages_Total /proc/meminfo
```
Check the module is active:
```bash
lsmod | grep nvme_tcp
```

### 4. Label the node for Mayastor
```bash
kubectl label node <node_name> openebs.io/engine=mayastor
```

## Installing OpenEBS

The FLAME Helm repository provides a [wrapper chart for OpenEBS](https://github.com/PrivateAIM/helm/blob/master/charts/third-party/openebs) with some suggested default values.
Installing this chart will add a new StorageClass to your cluster. You can tell workloads of the Flame Hub to use this StorageClass by specifying it in `flame-hub/values.yaml`. Usually, only stateful workloads (StatefulSets) need replicated storage.


1. **Clone the [Flame Helm Repository](https://github.com/PrivateAIM/helm/) and navigate to `charts/third-party/openebs`**
2. Make sure you have 3 nodes in your cluster.
3. Make sure you have read the previous section on node preparation for mayastor.
    * If not already labeled, label your nodes:
`kubectl label node <node_name> openebs.io/engine=mayastor`
4. Clone `values.yaml` to `values_local.yaml`.
5. Fill in your kubelet path and populate the disk pools section with your unmounted drives.
6. Install the chart:

```bash
helm dependency update .
```
```bash
helm install openebs . --namespace openebs --create-namespace -f values_local.yaml
```

7. Verify disk pools and `mayastor` storage classes:
```bash
kubectl get diskpools -n openebs
```
kubectl get storageclasses
8. Edit your FLAME-Hub values-file to use the new StorageClass. A reinstall of the Hub will probably be required.

## Use the new storage class

In your `values.yaml`(or better `values_override.yaml`) you can specify the storage class for the different components of the FLAME Hub. 

Example:
```yaml
minio:
  persistence:
    storageClass: "mayastor-replicated"
```