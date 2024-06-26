# Analysis Execution

Analysis and other node tasks are executed via airflow DAGs. The DAGs can be triggered via the airflow web interface,
which is available under port ```:8080``` on the node machine. The execution of the DAGs can also be monitored in the
webinterface.

## Login

The first time you access the webinterface you will be prompted to log in. Enter the credentials set in the `.env` file
to login as admin. Or use the credentials that you have obtained from the node administrator.

[//]: # ()
[//]: # ([![image]&#40;/images/node_images/airflow_login.png&#41;]&#40;/images/node_images/airflow_login.png&#41;)

## Test DAG

To test the configuration of the node as defined in the `.env` file, trigger the DAG
named `test_node_configuration`
in the user interface.  
A DAG is triggered in the UI by clicking on the **play** button, where it can be started either with or without a json
file containing additional configuration for the DAG run.



Trigger the DAG without any additional configuration to check if the node is properly configured. A notification
should appear in the UI that the DAG has been triggered.

To monitor the execution click on the name of the DAG. You should see the individual tasks contained in the DAG as well
as their status in the UI. If all tasks are marked as success, the node is properly configured and can connect to
harbor as well as a FHIR server.

!!! warning
    If you did not provide any FHIR_Server configurations in the .env-file, then this Trigger will fail, because this test will try to connect to the FHIR_server. All the nodes will be marked as red or orange except the "get_dag_config"


## Logs

The logs stored during the execution of a DAG can be accessed for each individual task by clicking the
colored,squared/circled - indicator next to the name of the task. In the new pop-up window you can see in the top a list
of options. There you can pick **Log** to view the Log of this task.



If there are any errors stacktraces can be found in these logs, as well as any other output of the tasks (stdout,
stderr)


## Run Analysis

To execute an analysis that is available for your node, trigger the `run_node` DAG, with configuration options
specifying the train image to be pulled from harbor and executed as well as additional environment variables or volumes.
A template train configuration is displayed below.

```json
{
  "repository": "<HARBOR-REGISTRY>/<node_NAMESPACE>/<TRAIN-IMAGE>",
  "tag": "latest",
  "env": {
    "FHIR_SERVER_URL": "<FHIR-ADDRESS>",
    "FHIR_USER": "<ID>",
    "FHIR_PW": "<PSW>"
  }
}
```

Replace the placeholders with the values of the train image to execute, and other variables with the values
corresponding to the nodes configuration and paste it into the configuration form shown in the following image.



### Running a train with volume data

Volume data (any data other than the data stored in the FHIR server) is made available to the train as read only volume
mounts. This mount needs to specified in the configuration of the DAG when it is started.
The path to which the volume must be mounted is specified in the train.

```json
{
  "repository": "<HARBOR-REGISTRY>/<NODE_NAMESPACE>/<ANALYSIS-ID>",
  "tag": "latest",
  "volumes": {
    "<Absolute path on node vm>": {
      "bind": "<Mount target in analysis container>",
      "mode": "ro"
    }
  }
}
```

### Running a train with GPU support

A train container can be configured to use the GPU of the node VM. The use of gpu resources requires the [nvidia
container runtime](https://github.com/NVIDIA/nvidia-docker) to be installed.

Follow these [instructions](https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/install-guide.html#docker)
to install the nvidia container runtime for docker.
Check if the nvidia container runtime is installed and usable by containers by running the following command:

```shell
sudo docker run --rm --gpus all nvidia/cuda:11.0.3-base-ubuntu20.04 nvidia-smi
```

If the command runs successfully, gpu resource can be configured for the train container by adding the following
configuration options to the DAG configuration:

1. Use all available GPUs on the node VM:
    ```json
    {
      "repository": "<HARBOR-REGISTRY>/<node_NAMESPACE>/<TRAIN-ID>",
      "tag": "latest",
      "gpus": "all"
    }
    ```
   
2. Use a selection of gpus identified by their ids:
    ```json
    {
      "repository": "<HARBOR-REGISTRY>/<node_NAMESPACE>/<TRAIN-ID>",
      "tag": "latest",
      "gpus": [0, 1]
    }
    ```
