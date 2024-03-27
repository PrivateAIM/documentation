# Registration

Nodes must be registered in the hub User-Interface in order to be the destination of a proposal or train.

::: warning IMPORTANT
When changing the settings of your node in the central UI you need to restart your local node. 
:::

## Hub
Click on Admin(1) -> General(2) -> nodes(3) -> +Add(4) to create a new node.
[![image](/images/ui_images/add_station_central.png)](/images/ui_images/add_station_central.png)

## Key pair generation

Generate a new key using [open-ssl](https://www.openssl.org/) locally on the machine you want to run your node on:

```shell
openssl genrsa -out key.pem 2048
```

Generate the associated public key using:
```shell
openssl rsa -in key.pem -outform PEM -pubout -out public.pem
```
and then register this key in the UI.

### Public Key registration
Here, you also need to set the name of your node, select the ecosystem (if your node is a PHT-Medic node use 
default) and set the public key of the node.

Once you have filled in all the fields, you can click "Create". The **registry credentials** for your node will appear 
below. These are important for the [following installation](/guide/deployment/node-installation).
