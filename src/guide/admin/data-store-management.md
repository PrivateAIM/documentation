# Data Store Management

Before an analysis can be run, its associated project must be allowed to access the required data at the institution. 
To achieve this, administrators can create **data stores**. These are the configuration settings that map individual 
projects to the directories containing the requested data on the organization's servers.

## Creating a Data Store
Navigate to the Data Store Creation tool by clicking on "Data Stores" -> "Create" in the menu bar at the top of the 
page. You should see a partially filled out table:

[![Data Store Management](/images/node_ui_images/data_store_creator.png)](/images/node_ui_images/data_store_creator.png)

Simply fill out the required information in the table and click "Submit" under the table. If everything worked 
correctly, a blue box will appear in the top right of the page indicating a data store was successfully created. If 
not, then please verify the provided values in tables or contact support for help.

A description of the fields in the table can be found below.

### Field Descriptions
| **Field**       | **Description**                                                                                                                                                             |
|-----------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Project         | Select from the currently approved list of projects for your node                                                                                                           |
| Data Store      | This field is automatically populated using the UUID of the selected project. This identifier is used as the name of the data store when it is created in the node software |
| Server          | Name of the server on which the data is located                                                                                                                             |
| Data Path       | The absolute directory path where the requested data is located                                                                                                             |
| Data Store Type | Type of repository in which the data is stored. Currrently, only FHIR and S3 are supported                                                                                  |
| Port            | Connection endpoint for accessing the server. Use 80 for HTTP and 443 for HTTPS. If a different protocol is used, please verify which port is accessible                    |
| Protocol        | Protocol used for transferring files                                                                                                                                        |
| Allowed Methods | Allowed methods for interacting with the data. Unless needed, this should be restricted to only `GET`                                                                         

## Managing Data Access
If a project is no longer approved, valid, or has been terminated, then the associated data stores should be removed. 
The Node UI provides an interface for both disconnecting individual analyses from accessing the requested data and 
permanently deleting data stores.

To manage previously created data stores as well as analysis data access, navigate to the Data Store Management page by
clicking on "Data Stores" -> "Manage" in the menu bar at the top of the Node UI. Here, 3 tabs will be visible: 
[Data Store Overview](#managing-a-data-store), [Analysis Overview](#disconnecting-an-analysis), and Data Store Tree 
Table. Each of these tabs provide a tabular description of the current data stores, analyses with data access, and an 
interactive overview of how the data stores, projects, and analyses of connected, respectively.

### Managing a Data Store
This tab shows a table listing the previously created data stores. The columns describe the same fields used during 
creation (see [Field Descriptions](#field-descriptions)).

#### Deleting a Data Store
The final column has a button for deleting the data store in that row. Simply click the button and confirm that you 
want to delete the data store to remove any reference of it.

::: warning Stop Analyses
Deleting a data store also disconnects all analyses for the associated project from the data. Be sure the analyses 
have either all run to completion or the users have been notified.
:::

### Disconnecting an Analysis
Though stopped and deleted analysis containers automatically delete their links to the needed data stores, sometimes 
errors occur during this process and the analysis link needs to be manually deleted. Similar to how a data store is 
deleted, the admin must simply navigate to the "Analysis Overview" tab and click on the delete button in the last 
column of the analysis they wish to disconnect from data access. A notification of a successful disconnection will 
appear in the top right of the screen after confirmation.
