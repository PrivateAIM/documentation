# FAQs as Administrator. Node Management

### What are the main responsibilities of a Node administrator?
A Node administrator's main responsibilities include running and monitoring approved analyses, managing local data stores,
and defining data stores according to the available data types.
For detailed responsibilities, refer to [node management](/guide/admin/node-management).

### How do I set up a data store?
Setting up a data store involves an initial configuration during the Node installation to enable the  **Node Data Store** service.
First, refer to [Node installation| Node Data Store](/guide/deployment/node-installation/#optional-node-data-store) for guidance. 
Once the installation is successfully completed, you can configure storage solutions like S3 buckets and FHIR servers through the Node UI. 
For managing your data store, consult [Data Store Management](/guide/admin/data-store-management).
* To set up a **FHIR server**, _Flame_ enables you to deploy your own server from scratch during the Node installation.
* To set up a **S3 bucket** on Seaweed, refer to [bucket Setup for Data Store](/guide/admin/bucket-setup-for-data-store).

### How do I execute an analysis on a node?
Once an analysis was approved and a data Store was configured, the Node UI on the Analyses field display a tabular section where you can
find your project and on the "Toogle Analysis" you can start manually your analysis. Refer to [analysis execution](/guide/admin/analysis-execution).

