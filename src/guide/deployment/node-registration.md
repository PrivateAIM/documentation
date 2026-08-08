# Registering in the Hub

As an institution wishing to become part of the FLAME platform, administrators must first register their organization in
the [Hub](https://privateaim.net/) as an available **Node**. Once registered, they will be provided credentials that
will be used during the deployment of the node software so that their node can communicate with the Hub to send updates
and results.

::: warning IMPORTANT When changing the settings of your node in the central UI you need to restart your local node.
:::

## Creating a Node in the Hub

Navigate to the [Hub UI](https://privateaim.net/) and log in using your provided administrator credentials.

Click on **Admin** (1.) -> **General** (2.) -> **Nodes** (3.) -> **+add** (4.) to create a new node.
[![Navigate to Node Registration](/images/ui_images/add_node_hub.png)](/images/ui_images/add_node_hub.png)

Fill in the necessary information for your organization:

* **Name**: Unique name for your node
* **External Name**: Human-readable name for your node
* **Registry**: The repository from which your node will pull the analysis images. You must select at least one by
  clicking on the "+" next to the name
* **Type**: The type of node this will represent. A "default" node is one in which individual analyses will run, and an
  "aggregator" is one which performs the aggregation of the results for the analyses
* **Visibility**: Whether this node can be seen and selected as an option for projects and analyses

The page should look similar to this when finished:

[![Creating a Node](/images/ui_images/hub_node_registration.png)](/images/ui_images/hub_node_registration.png)

Click "create" once everything has been filled out and selected, and you will be taken to the "Overview" tab for your
node.

## Credentials for Deployment

Once the node is created, admins can access the "Crypto" and "Client" tabs which contain needed credentials and keys for
deploying the node software on their server.

### Crypto

To encrypt data that needs to be sent between different nodes, each node needs a crytographic key that can be used to
encrypt/decrypt the information. The "Crypto" tab allows the admin to generate a crytopgraphic key pair for this
purpose.

![Hub Crypto](/images/ui_images/hub_node_crypto.png)

Navigate to the "Crypto" tab and click on the "Generate" button at the bottom of the window. A public and private key
pair will be generated. The user should copy the contents of the "PrivateKey" section to a **local file and save it**.
We will need this key during installation and will no longer be accessible in your browser after you navigate away from
the Crypto tab.

::: tip Be sure to include the `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----` sections when copying the
private key.
:::

::: danger Don't Forget to Click Save!
Be sure to click "Save" when you generate a new key pair, otherwise the public key stored in the hub and the private key
used during deployment will not be from the same pair.
:::

### Client Credentials

This page contains two pieces of information required for the deploying the FLAME Node: the client ID and secret.

Because the secret was automatically created when the node was registered and then hashed, we need to generate a new
one. Click the regenerate icon (two circular arrows) next to the secret text field to generate a new secret. Be sure to
copy and save the generated string for future use. Then click "update" and you will see a green text box appear
indicating that the client secret for this node was successfully updated.

[![Getting Client Credentials](/images/ui_images/hub_client.png)](/images/ui_images/hub_client.png)

::: warning Don't Copy the Hashed Secret!
If you see "hashed" next to the word secret above the text field, this means the value in the box below is hashed and
cannot be used for the node deployment. If this is the case, and you have lost or forgotten the original secret, then
simply generate a new one and update it.
:::

For deployment, we need the previously generated secret and the client **ID**. Copy the ID to the same location you
copied the secret.

#### Redirect URI

The Hub authentication system needs to know where it is allowed to redirect to after a user logs in via the Node UI.
When you deploy your node, you should have a domain name that you will use to navigate to the Node UI once it is
deployed. That same domain name needs to be configured here as a valid redirect URI.

Click on the "+ Add" in the "Redirect URI (s)" section. Copy your domain name into the box (including the `http(s)://`)
and add `/flame/api/auth/callback/hub` to the end of it, like shown in the image above. This suffix is what the Node UI
uses for handling redirected users who just logged in. Once finished, scroll down and click the "Update" button to save
this.

::: info Login Issues If you try to login through the Node UI and get a warning saying "the redirect URI is missing or
does not match", it is because the redirect URI was not properly set for your client in this page. Make sure it includes
the `/flame/api/auth/callback/hub` and the correct HTTP protocol was specified.
:::

Now, you have everything needed for deploying the node software on your system.
