# Data Store Management

Before an analysis can be run, its associated project must be allowed to access the required data at the institution.
To achieve this, either an administrator or data steward needs to create **data stores**.
These are the configuration settings that map individual projects to the directories containing the requested data
on the organization's servers.

## Creating a Data Store

Navigate to the Data Store Creation tool by clicking on "Data Stores" -> "Create" in the menu bar at the top of the
page. You should see a partially filled out table:

[![Data Store Creator](/images/node_ui_images/data_store_creator.png)](/images/node_ui_images/data_store_creator.png)

Simply fill out the required information in the table and click "Submit" under the table. If everything worked
correctly, a green box will appear in the top right of the page indicating a data store was successfully created. If
not, a red box will appear with a suggestion as to what may be wrong. If this occurs, please verify the provided
values in the table or contact support for help.

::: tip Private S3 Buckets
For more information on how to generate the required keys for private S3 buckets, visit
[Bucket Setup for Data Store](./bucket-setup-for-data-store.md)
:::

A description of the fields in the table can be found below.

### Field Descriptions

| **Field**               | **Description**                                                                                                                                                             |
|-------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Project                 | Select from the currently approved list of projects for your node                                                                                                           |
| Data Store              | This field is automatically populated using the UUID of the selected project. This identifier is used as the name of the data store when it is created in the node software |
| Data Store Type         | Type of repository in which the data is stored. Currrently, only FHIR and S3 are supported                                                                                  |
| Data Path (FHIR only)   | The absolute directory path where the requested data is located                                                                                                             |
| Bucket Name (S3 only)   | The name of the S3 bucket in which the data is located                                                                                                                      |
| Bucket Access (S3 only) | Whether the S3 bucket is "Private" or "Public". It is highly recommeded to keep all S3 buckets set to private                                                               |
| Access Key (S3 only)    | Generated access key used for accessing the listed, private S3 bucket                                                                                                       |
| Secret Key (S3 only)    | Generated secret key used for accessing the listed, private S3 bucket                                                                                                       |
| Hostname                | Name of the server on which the data is located                                                                                                                             |
| Port                    | Connection endpoint for accessing the server. Use 80 for HTTP and 443 for HTTPS. If a different protocol is used, please verify which port is accessible                    |
| Protocol                | Protocol used for transferring files                                                                                                                                        |

## Managing Data Access

If a project is no longer approved, valid, or has been terminated, then the associated data stores should be removed.
The Node UI provides an interface for both disconnecting individual analyses from accessing the requested data and
permanently deleting data stores.

To manage previously created data stores as well as analysis data access, navigate to the Data Store Management page by
clicking on "Data Stores" -> "Manage" in the menu bar at the top of the Node UI to access an overview table of the
current data stores (see [Field Descriptions](#field-descriptions) for descriptions of the columns).

Each listed data store in this table also has a button for testing the connection to the mapped server in the "Test"
column. If a user reports that they are unable to access the requested data, you can use this button to check whether
the connection is still valid. If it is no longer valid, for example because a security setting or port was changed,
the data store should be deleted and recreated.

[![Data Store Manager](/images/node_ui_images/datastore_manager.png)](/images/node_ui_images/datastore_manager.png)

### Deleting a Data Store

The final column has a button for deleting the data store in that row. Simply click the button and confirm that you
want to delete the data store, thereby removing all access to the associated data.

::: warning Stopping the Analyses
Deleting a data store also immediately disconnects all analyses and projects from the data. Be sure the analyses
have either all run to completion or the users have been notified.
:::

