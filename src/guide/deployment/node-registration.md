# Registration
As an institution wishing to become part of the FLAME platform, administrators must first register their organization 
in the [Hub](https://privateaim.dev/) as an available **Node**. Once registered, they will be provided credentials 
that will be used during the deployment of the node software so that their node can communicate with the Hub to send 
updates and results.

::: warning IMPORTANT
When changing the settings of your node in the central UI you need to restart your local node. 
:::

## Creating a Node in the Hub
Navigate to the [Hub UI](https://privateaim.dev/) and log in using your provided administrator credentials.

Click on **Admin** (1.) -> **General** (2.) -> **Nodes** (3.) -> **+add** (4.) to create a new node.
[![Navigate to Node Registration](/images/ui_images/add_node_hub.png)](/images/ui_images/add_node_hub.png)

Fill in the necessary information for your organization:
* **Name**: Unique name for your node
* **External Name**: Human-readable name for your node
* **Registry**: The repository from which your node will pull the analysis images. You must select at least one by clicking on the "+" next to the name
* **Type**: The type of node this will represent. A "default" node is one in which individual analyses will run, and an "aggregator" is one which performs the aggregation of the results for the analyses 
* **Visibility**: Whether this node can be seen and selected as an option for projects and analyses

The page should look similar to this when finished:

[![Creating a Node](/images/ui_images/hub_node_registration.png)](/images/ui_images/hub_node_registration.png)

Click "create" once everything has been filled out and selected, and you will be taken to the "Overview" tab for your 
node.

## Credentials for Deployment

Once the node is created, admins can access the "Robot" tab to obtain and update the credentials needed for deploying 
the node software on their server. One this page, there are 3 pieces of information for the node's robot: ID, name, and 
secret. 

Because the secret was automatically created when the node was registered and then hashed, we need to generate a new 
one. Click the "generate" button below the secret text field to create a new secret and copy this string somewhere 
for later. Then click "update" and you will see a green text box appear indicating that the robot secret 
for this node was successfully updated.

[![Getting Robot Credentials](/images/ui_images/hub_node_robot_credentials.png)](/images/ui_images/hub_node_robot_credentials.png)

::: warning Don't Copy the Hashed Secret!
If you see "hashed" next to the word secret above the text field, this means the value in the box below is hashed and 
cannot be used for the node deployment. If this is the case, and you have lost or forgotten the original secret, then 
simply generate a new one and update it.
:::

For deployment, we need the previously generated secret and **either** the robot ID or name. Copy either the ID or 
name to the same location you copied the secret. 

Now, you have everything needed for deploying the node software on your system.
