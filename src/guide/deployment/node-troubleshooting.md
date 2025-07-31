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
