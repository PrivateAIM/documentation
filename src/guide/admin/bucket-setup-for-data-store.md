# Bucket Setup for Data Store 

Before an analysis can be executed in FLAME, the required data must be made accessible through a configured data store. 
In this context, a bucket refers to a storage location—such as an S3 or MinIO bucket—that contains the dataset to be analyzed.
Creating a bucket is the first step in making data available to FLAME. 
The bucket will later be referenced by a data store configuration, which connects the FLAME project to the actual data. 

## Creating a Bucket

To create a new bucket, go to the "Buckets" tab in the Administrator Area on the left side of the page and click "Create Bucket".
Give your bucket a name following the bucket naming rules, optionally select additional features, and click "Create Bucket" in the lower-right corner under the Features section.

[![Data Store Creator](/images/minio_images/bucket_create.png)](/images/minio_images/bucket_create.png)

To enable FLAME Nodes to access the data during development, the access policy of the newly created bucket must temporarily be set to "Public" in the summary tab. This setting is only required during the development phase and should be adjusted accordingly in production environments.

### Uploading Data into a Bucket

To upload files or a directory into a bucket, navigate to "Object Browser" in the User Area and select the desired bucket.
Click the "Upload" button in the top-right corner and choose either "Upload File" or "Upload Folder". You can then select a file or folder from your local computer to upload.

[![Data Store Creator](/images/minio_images/bucket_upload.png)](/images/minio_images/bucket_upload.png)

If the upload starts successfully, a "Downloads/Uploads" tab will appear in the top-right corner, displaying the upload progress as a percentage.

### Deleting a Bucket

A bucket can only be deleted after all its contents have been removed. To do this, go to the "Buckets" tab in the Administrator Area, select the bucket you want to delete, and then click the "Delete Bucket" button in the top-right corner.

## Integrate a Bucket in the Node 

To make data from a bucket available for analysis within FLAME, a corresponding data store must be created for the project that intends to use the data.

This process is explained in detail in the [Creating a Data Store](/guide/admin/data-store-management#creating-a-data-store) section. When configuring a data store for a MinIO or S3 bucket, the following parameters must be provided:

[![Data Store Creator](/images/minio_images/bucket_node.png)](/images/minio_images/bucket_node.png)

* **Server:**  `node-datastore-minio`

* **Data Path:** `/` followed by the bucket name (e.g., `/hello-world`)

* **Data Store Type:** `S3`

* **Port:** `9000`