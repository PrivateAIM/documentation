# Troubleshooting

## Node Setup on Windows

If you are on a Windows Computer you need to change the line seperator to the **Unix/macOS**-style for the airflow
directory. In Pycharm you can follow these steps:

1. Select the airflow folder
2. Click on File in the top-left corner
3. Click on File Properties -> Line Separators -> LF - Unix and maxOS (\n)

### Custom DAGs

If you want to use custom dags in airflow, you will have to change the  docker-compose.yml; instated of pulling the latest pre-build airflow image; you have to build airflow locally. 
This is done by commenting out the  "build: './airflow' "  line and uncommenting the "  image: ghcr.io/pht-medic/node-airflow:latest"  line

```yaml
# ------------- ommitted ------------
services:
  airflow:
    # replace with the build command
    build: './airflow'
    # remove the image command
    image: ghcr.io/pht-medic/airflow:latest
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
# ------------- ommitted ------------
```

## Edit airflow admin user/password

Changing the Airflow admin password/user in the env file after the build is not directly possible. Either use Airflow UI to change the password or delete the airflow volume and rebuild after the change.

## Airflow behind a reverse proxy
Edit the airflow configuration in `airflow/airflow.cfg` according to the instructions found [here](https://airflow.apache.org/docs/apache-airflow/stable/howto/run-behind-proxy.html)
Set forwarding in your reverse proxy (nginx for example) to access the airflow instance running on ```http://127.0.0.1:8080```
After updating the configuration stop the instance if it is running (```docker-compose down```) and restart it after rebuilding the image
(```docker-compose up --build -d```).

## Using an Existing Secret for the Crypto Private Key
Should you not wish to copy and paste the contents of the privatre key used for encrypting intermediate results into your `values.yaml` for deployment, you can also create a generic kubernetes secret from a file containing the private key (e.g. `myPrivateKey.pem`) and use that secret in the `values.yaml` to provide the needed information.

### Create a Generic Secret
First, make sure your crypto private key is saved to a file on the local machine, we will use `myPrivateKey.pem` for this example. Now create a generic kuberneets secret with any name you wish to use, we will call ours "super-safe-node-key":
```
kubectl create secret generic super-safe-node-key --from-file=private_key.pem=/path/to/private_key.pem
```

### Use Secret in `values.yaml`
Now that we have a sceret with our private crypto key, we can use that secret when deploying the node by providing the name of the secret in the `values.yaml`:
```yaml
hub:
  crypto:
    existingSecret: super-safe-node-key
```

### Setting up TLS connection

1. Produce your own certificate `my-flame-node.crt` and private key `my-flame-node.key`, either self-signed or signed with a Certificate Authority (check required steps here - )
2. Save your public certificate inside the file `certs.pem`, [which could be used later to produce a configMap for your kube node configuration](./node-installation.md#using-a-pre-defined-configmap)
3. Run the following command to create a secret for TLS protocol:
    `$ kubectl create secret tls tls-secret --key my-flame-node.key --cert my-flame-node.crt`
If you need a secret for multiple domain names (e.g. external and internal addresses), you can execute almost the same command but with multiple flags `--key` and `--cert`.

After that add to your custom `my-values.yaml` file the following line inside the ingress block:
`tlsSecretName: tls-secret`. 
As the result, your logical block of ingress in the customized values file should look like the following:
```yaml
ingress:
  enabled: true
  hostname: "https://my-flame-node.org"
  tlsSecretName: tls-secret
```


## Reinstalling a Node

Before installing a node again after it's been deleted, it might be crucial to clean up Persistent Volumes left by a previously deployed node instance, 
because they tend to persist inside kubernetes cluster even after a worker node gets deleted.
To do that launch the following command in your shell:
`$ kubectl delete pvc --all`


## Setting Up User Authorization via Keycloak

Possible issues:
- Login failure - resulting in the error message `Invalid URI`

Though this should be done automatically during installation provided that the `ingress.hostname` value is filled out in the `values.yaml` file used during the `helm install` step, if your domain changes or something goes wrong during deployment then follow these steps to update the bundled Keycloak instance with your used URI:

1. Click on the top right button of your NodeUI web page - "Node Keycloak Admin"; then log in as an admin.
0. Press the button "Manage realms", then go to the correct "<b>flame</b>" realm. Thereafter, you could notice that the part of your URL after '#' is changed, now it shall include a chosen realm name.
0. Go to "Clients" on the left panel and click on the appropriate ClientID for the NodeUI (the default is "<b>node-ui</b>")
0. Scroll down in the node-ui client settings until you'll see the fields "Valid redirect URIs". 
0. In this field type the root URL of your node website. For example it could be the following:
  - "https://my-flame-node.org/*"
  - "http://my-flame-node.org/*"
