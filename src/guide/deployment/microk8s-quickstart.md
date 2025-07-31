# Getting Started with microk8s and Helm
This guide demonstrates how to get microk8s and Helm running on a debian-based server (e.g. ubuntu).

## Install microk8s and Helm
### Update System Packages
Assuming you are working with a freshly installed OS, be sure to first update the system packages before proceeding:
```bash
sudo apt update -y && sudo apt upgrade -y
```

### Install snap
We will use the snap package manager for installing and managing microk8s. First, install the snap daemon
```bash
sudo apt install -y snapd
```
::: info 
You may be asked during installation about which timezone you are in. This can occur twice, once for the region and 
once for a city. For both, enter the number corresponding to the option that *best* fits your location and 
press `Enter` to continue with installation.
:::

Before continuing, check whether you can run commands using snap by executing `snap list`. If this returns an error, 
then the snap executable needs to be added to the `PATH` environment variable. This can be done easily be running the 
following command:
```bash
echo 'export PATH=$PATH:/snap/bin' >> ~/.bashrc && source ~/.bashrc
```

### Use snap to install microk8s
Next, install the `core` dependency along with microk8s using snap:
```bash
sudo snap install core && sudo snap install microk8s --classic --channel=1.32
```

Verify you can run microk8s:
```bash
microk8s version
```
::: warning
If you see a message saying `Insufficient permissions to access MicroK8s.`, then visit 
[fixing microk8s permissions](#fixing-microk8s-permissions) in the [Troubleshooting](#troubleshooting) section.
:::

### Install Helm
We will install helm using its install script that we can get using `curl`. First install `curl`:
```bash
sudo apt install curl
```
Install Helm:
```bash
curl -fsSL -o get_helm.sh https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3
chmod 700 get_helm.sh
./get_helm.sh
```

## Setup microk8s
### Update Storage Location
Because we need to be able to download and store several container images, we need to ensure that there is enough disk 
space available. By default, microk8s will store everything on your root file system located at `/`. 
Depending on how your server was setup, bulk storage may be located on a different logical volume (LV) than your root 
file system. You can check this by running:
```bash
df -h
```
<figure style="margin: 3em 0 3em 0">
<img src="/images/installation/logical_volumes.png" style="display: block; margin: auto" alt="LV sizes" />
<figcaption style="text-align:center"><b>Example output</b>. Here the root file system, installed at <code>/</code> 
(yellow arrow) only has 13GB available, 
but a different LV mounted at <code>/mnt/vdb1</code> (green arrow) has 435GB.</figcaption></figure>

If you need to use a different LV for storage, replace `<new mount>` in the following command with the mount path 
of the LV you want to use for storage and then execute the command:
```bash
cat <<EOF > /var/snap/microk8s/current/args/containerd
--config \${SNAP_DATA}/args/containerd.toml
--root <new mount>/var/lib/containerd
--state <new mount>/run/containerd
--address \${SNAP_COMMON}/run/containerd.sock
EOF
```
For the example above, we would replace `<new mount>` with `/mnt/vdb1`.

Restart microk8s to apply this change:
```bash
sudo snap restart microk8s
```

### Generate the Configuration
Now create a folder for the microk8s configuration at `~/.kube`:
```bash
mkdir -p ~/.kube && chmod 0700 ~/.kube
```
Generate a configuration file and store it in this new folder:
```bash
microk8s kubectl config view --raw > ~/.kube/config
```

::: tip
You can shorten the command for interacting with the k8s API by creating an alias:
```bash
echo "alias kubectl='microk8s kubectl'" >> ~/.bashrc && source ~/.bashrc
```
:::

This configuration is required for Helm to work properly. Check whether Helm can contact the microk8s API by running:
```bash
helm list
```
::: warning
If you see a message saying `Error: Kubernetes cluster unreachable: Get "http://localhost:8080/version": dial tcp 
127.0.0.1:8080: connect: connection refused`, then try the following:
* Ensure you have permission to read/write the `.kube/` folder: `chown -f -R $USER ~/.kube`
* Regenerate the microk8s configuration file: `microk8s kubectl config view --raw > ~/.kube/config`  
:::

### Install Required Addons
Several features which are required by the flame node software can be enabled in microk8s through its "addons". Run 
the following to activate these addons:
```bash
microk8s enable dashboard
microk8s enable ingress
microk8s enable hostpath-storage
microk8s enable metrics-server
```

## Final Checks
Ensure that you can run the following without errors

| Service          | Command            | Expected Output                                    | Troubleshooting Step                                                                                                                                   |
|------------------|--------------------|----------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------|
| microk8s         | `microk8s version` | `MicroK8s v1.32.3 revision 8148`                   | Check whether the current user is part of the `microk8s` group: `groups` If not, then end the current session and log back in or run `newgrp microk8s` |
| ingress          | `microk8s status`  | `enabled:  <br>...<br>ingress`                     | Enable ingress addon: `microk8s enable ingress`                                                                                                        |
| hostpath-storage | `microk8s status`  | `enabled:  <br>...<br>hostpath-storage`            | Enable ingress addon: `microk8s enable hostpath-storage`                                                                                               |
| helm             | `helm list`        | `NAME NAMESPACE REVISION UPDATED STATUS CHART APP VERSION` | Go through the steps in the [Generating the Configuration](#generate-the-configuration) section                                                        |

## Troubleshooting
### Fixing microk8s permissions
The default user for your server needs to be added to the "microk8s" group to execute commands for the microk8s 
service. Run the following to add the current user to the group:
```bash
sudo usermod -a -G microk8s $USER
```
Then you need to reload the user groups by either rebooting or running:
```bash
newgrp microk8s
```
Finally, check if you have sufficient permissions to interact with microk8s:
```bash
microk8s version
```
