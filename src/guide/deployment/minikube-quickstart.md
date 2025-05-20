# Getting Started with minikube and Helm
This guide demonstrates how to get minikube and Helm running on a debian-based server (e.g. ubuntu). Docker is required as minikube runs inside a container.

## Install Docker
### Update System Packages
Assuming you are working with a freshly installed OS, be sure to first update the system packages before proceeding:
```bash
sudo apt update -y && sudo apt upgrade -y
```

### Docker Script
These are the summarized instructions for installing Docker on Ubuntu. For more details, visit https://docs.docker.com/engine/install/ubuntu/

#### Setup Docker' `apt` Repository
```bash
# Add Docker's official GPG key:
sudo apt-get update
sudo apt-get install ca-certificates curl
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc

# Add the repository to Apt sources:
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "${UBUNTU_CODENAME:-$VERSION_CODENAME}") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update
```

#### Install Docker and its Plugins
```bash
sudo apt-get install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```

### Post Docker Installation Steps
#### Create Group

Create a `docker` group
```bash
sudo groupadd docker
```


Add your user to the docker group
```bash
sudo usermod -aG docker $USER
```

Exit your session and log back in to apply the changes.

#### Test Image Pull
Check whether you are able to pull docker images at this point:
```bash
docker pull alpine
```

If you have any issues, follow the tips in the [Docker Troubleshooting](#docker-troubleshooting) section.

### Configure a Volume Mount for Image Storage (optional)
It may be that your server has a separate volume mounted for mass storage. By default, Docker uses the root directory `/var` for storage, and this may be limited depending on how your serever is configured. You can check whether your bulk storage is located on a different logical volume (LV) by running:
```bash
df -h
```
<figure style="margin: 3em 0 3em 0">
<img src="../../public/images/installation/logical_volumes.png" style="display: block; margin: auto" alt="LV sizes" />
<figcaption style="text-align:center"><b>Example output</b>. Here the root file system, installed at <code>/</code> 
(yellow arrow) only has 13GB available, 
but a different LV mounted at <code>/mnt/vdb1</code> (green arrow) has 435GB.</figcaption></figure>

If you need to use a different LV for storage, perform the following steps replace `<mount-path>` with the path for your mounted volume e.g. `/mnt/vdb1`:
1. Stop the Docker service
```bash
sudo systemctl stop docker
```

2. Make a folder on your LV where you want to store images
```bash
sudo mkdir -p <mount-path>/docker
```

3. Edit or create `/etc/docker/daemon.json` to configure the data root path
```json
{
  "data-root": "<mount-path>/docker"
}
```

4. Start Docker
```bash
sudo systemctl start docker
```

5. Verify the New Configuration
```bash
docker info | grep "Docker Root Dir"
```
should show something like this:
```bash
Docker Root Dir: <mount path>/docker
```


### Docker Troubleshooting
#### Configure Proxy Settings for Docker
If your institution is behind a proxy, you have to inform Docker how to use it.

Create a directory for Docker configurations and create a configuration file called `proxy.conf`:
```bash
sudo mkdir -p /etc/systemd/system/docker.service.d
sudo nano /etc/systemd/system/docker.service.d/proxy.conf
```

Add the following to `proxy.conf`, replacing the proxy address with the one for your institution:
```bash
[Service]
Environment="HTTP_PROXY=http://proxy.place.com:3128"
Environment="HTTPS_PROXY=http://proxy.place.com:3128"
Environment="NO_PROXY=localhost,127.0.0.1,10.0.0.0/8"
```

::: tip
For certain domains and hostnames to access the server, you may also need to include them in your `NO_PROXY` variable. If you already know the domain you will provide the FLAME Node deployment, add it to the `NO_PROXY` variable now.
:::

Reload the daemon and restart Docker:
```bash
sudo systemctl daemon-reload
sudo systemctl restart docker
```


## Install minikube
### Download `minikube` Install Script
```bash
curl -LO https://storage.googleapis.com/minikube/releases/latest/minikube-linux-amd64
sudo install minikube-linux-amd64 /usr/local/bin/minikube
rm minikube-linux-amd64
```

### Install `kubectl`
#### Download and Run the Install Script
This is the binary used for querying the resources in minikube.

```bash
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
```

#### Configure the Binary
```bash
sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl 
```

### Deploy minikube
finally, we are ready to deploy the minikube container. We will deploy it with a specific network plugin called calico which is used for creating new analysis containers. Additionally, we need to enable the ingress addon for minikube. This addon allows received web traffic to be properly routed by minikube.

```bash
minikube start --network-plugin=cni --cni=calico --addons=ingress
```

### Install Helm
Helm is used for deploying charts, which are pre-packaged and configured kubernetes resources. This is required for deploying FLAME Node as it is provided as a helm chart.
```bash
curl -fsSL -o get_helm.sh https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3
chmod 700 get_helm.sh
./get_helm.sh
```

## Install haproxy
A reverse proxy is required for routing incoming web traffic to minikube. Here, we use haproxy within a Docker container to handle this work.

### Create `haproxy.cfg`
First we need to create the configuration file that we will pass to the haproxy container at runtime. Save the following in a file called `haproxy.cfg`:
```bash
global
  log stdout format raw daemon debug
  maxconn 60000
  log 127.0.0.1 local0
  log 127.0.0.1 local1 notice
  user  haproxy
  group haproxy

defaults
  log global
  option httplog
  option dontlognull
  mode http
  timeout client 10s
  timeout connect 5s
  timeout server 10s
  timeout http-request 10s

frontend all
  bind *:80
  mode http
  use_backend cluster

backend cluster
  mode http
  server node $MINIKUBE_IP:80 check
```

### Deploy haproxy Container
Run the following to create a haproxy container that binds port 80 and routes traffic to minikube using the recently created `haproxy.cfg` file:
```bash
docker run --name "haproxy" \
    -p 80:80 \
    -d \
    --rm \
    --sysctl net.ipv4.ip_unprivileged_port_start=0 \
    -v ./haproxy.cfg:/usr/local/etc/haproxy/haproxy.cfg \
    -e MINIKUBE_IP="$(minikube ip)" \
    --network "minikube" \
    haproxy:3.1.7-alpine3.21@sha256:3e1367158e93d65d0186d6b2fb94b0a5a5d7e1cac0cabedb0cda52c80dad1113
```

## Final Steps
At this point, the domain pointing to this server should be routed to minikube. Open a browser and navigate to the domain and you should see an nginx 404 page. If this is true, you can continue with the [FLAME Node Deployment](/guide/deployment/node-installation).
