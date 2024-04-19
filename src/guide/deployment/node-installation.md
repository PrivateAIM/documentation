# Installation

::: info
This section will provide installation instructions for installing a PHT node.<br>**It assumes that the node has
been registered in the UI.**\
For instructions on how to register the node see the instructions [here](../deployment/node-registration).
:::

## Requirements

* [Docker](https://docs.docker.com/get-docker/) and [docker-compose](https://docs.docker.com/compose/install/) need to
  be installed.<br>
* For the default installation to work the ports `8080` and `5432` need to be available on localhost.


## Setup

::: danger Warning
If the node is set up on windows, the changes described [here](./node-troubleshooting.md#node-setup-on-windows) must be made,
before executing the following steps.


:::

1. Clone the repository: ```git clone https://github.com/PrivateAim/node-deployment.git```

2. Navigate into the cloned project `cd node` and edit the `.env` file with your local configuration and 
**the credentials** you received after the 
[Public key registration](./node-registration#public-key-registration).\
**Note:** The `.env.tmpl` file is a template file that can be used to generate a `.env` file with the correct environment
keys.

| Attribute                         | Explanation                                                                                                                                                                                   |
|:----------------------------------|:----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------| 
| `NODE_ID`                         | Chosen identifier of the node (match central UI configuration). You can find it as namespace                                                                                               |
| `NODE_PRIVATE_KEY_PATH`           | Path to the private key on the local filesystem that should be mounted as a volume                                                                                                            |
| `PRIVATE_KEY_PASSWORD`            | If the private key is encrypted with a password, this password can be set using this variable                                                                                                 |
| `AIRFLOW_USER`                    | Admin user to be created for the airflow instance                                                                                                                                             |
| `AIRFLOW_PW`                      | Password for the airflow admin user                                                                                                                                                           |
| `HARBOR_URL`                      | Url of the central harbor instance                                                                                                                                                            |
| `HARBOR_USER`                     | Username to authenticate against harbor                                                                                                                                                       |
| `HARBOR_PW`                       | Password to authenticate against harbor                                                                                                                                                       |
| `NODE_DATA_DIR`                   | Absolute path of the directory where the node stores the input data for trains.<br>This path is also used by the FHIR client to store the query results before passing them to the trains  |
| `FHIR_ADDRESS`<br>(optional)      | Address of the default FHIR server connected to the node <br>(this can also be configured per train)                                                                                       |
| `FHIR_USER`<br>(optional)         | Username to authenticate against the FHIR server using Basic Auth                                                                                                                             |
| `FHIR_PW`<br>(optional)           | Password for FHIR server Basic Auth                                                                                                                                                           |
| `FHIR_TOKEN`<br>(optional)        | Token to authenticate against the FHIR server using Bearer Token                                                                                                                              |
| `CLIENT_ID`<br>(optional)         | Identifier of client with permission to acces the FHIR server                                                                                                                                 |
| `CLIENT_SECRET`<br>(optional)     | Secret of above client to authenticate against the provider                                                                                                                                   |
| `OIDC_PROVIDER_URL`<br>(optional) | Token url of Open ID connect provider <br>(e.g. keycloak, that is configured for the FHIR server)                                                                                             |
| `FHIR_SERVER_TYPE`<br>(optional)  | Type of FHIR server <br>(PHT FHIR client supports IBM, Hapi and Blaze FHIR servers)                                                                                                           |

3. ABC

## Execution
1. Run ```docker-compose up -d```
2. Check that the logs do not contain any startup errors with ```docker-compose logs -f```
3. Go to ```http://localhost:8080``` nd check whether you can see the web interface of Apache Airflow
4. Login to the airflow web interface with the previously set user credentials
