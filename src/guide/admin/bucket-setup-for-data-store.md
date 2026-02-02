# Bucket Setup for Data Store

Before an analysis can be executed in FLAME, the required data must be made accessible through a configured data store.
In this context, a bucket refers to a storage location—such as an S3 or MinIO bucket—that contains the dataset to be
analyzed.
Creating a bucket is the first step in making data available to FLAME.
The bucket will later be referenced by a data store configuration, which connects the FLAME project to the actual data.

The examples shown below use the included MinIO object store, but these steps can be applied to other S3 stores.

## Creating a Bucket

To create a new bucket, go to the "Buckets" tab in the Administrator Area on the left side of the page and click "Create
Bucket".
Give your bucket a name following the bucket naming rules, optionally select additional features, and click "Create
Bucket" in the lower-right corner under the Features section.

[![Data Store Creator](/images/minio_images/bucket_create.png)](/images/minio_images/bucket_create.png)

### Generating Access and Secret Keys

By default, S3 buckets are set to "Private", and accessing the data they contain requires the use of an **access key**
and **secret key**. These keys are also required when creating a data store in the Node UI for this bucket. In MinIO,
administrators and data stewards can generate a key pair by following these steps:

1. Navigate to the "Access Keys" tab in the Administrator Area on the left side of the page
2. Click the "Create access key" button in the top right corner of the page
3. Enter any desired metadata including a name and expiration date for the keys
    * It is recommended you enable the "Restrict beyond user policy" toggle and further limit the access key
      permissions. More details can be found in [Modifying Access Key Permissions](#modifying-access-key-permissions)
4. Click the "Create" button at the bottom

::: warning Save the Keys!
The secret key is **only** accessible during creation so it is important you record both keys now as you will need
them when creating a data store
:::

[![MinIO Access Key Generation](/images/minio_images/access_key_creation.png)](/images/minio_images/access_key_creation.png)

#### Modifying Access Key Permissions

Access keys have the same policies as the user who created them by default, however, it is advisable to limit the
permissions of the access keys used for data store creation. FLAME analyses only require the following permissions:

* Bucket
    * `s3:GetBucketLocation`
    * `s3:ListBucket`
* Data
    * `s3:GetObject`

Thus, administrators and data stewards can use the following custom **Access Key Policy** (replacing `<bucket name>`
with the name of the appropriate bucket) for additional security:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "s3:GetBucketLocation",
                "s3:ListBucket"
            ],
            "Resource": [
                "arn:aws:s3:::<bucket name>"
            ]
        },
        {
            "Effect": "Allow",
            "Action": [
                "s3:GetObject"
            ],
            "Resource": [
                "arn:aws:s3:::<bucket name>/*"
            ]
        }
    ]
}
```

This policy can be applied either during access key creation or afterward by editing the access key settings.

### Uploading Data into a Bucket

To upload files or a directory into a bucket, navigate to "Object Browser" in the User Area and select the desired
bucket.
Click the "Upload" button in the top-right corner and choose either "Upload File" or "Upload Folder". You can then
select a file or folder from your local computer to upload.

[![Data Store Creator](/images/minio_images/bucket_upload.png)](/images/minio_images/bucket_upload.png)

If the upload starts successfully, a "Downloads/Uploads" tab will appear in the top-right corner, displaying the upload
progress as a percentage.

### Deleting a Bucket

A bucket can only be deleted after all its contents have been removed. To do this, go to the "Buckets" tab in the
Administrator Area, select the bucket you want to delete, and then click the "Delete Bucket" button in the top-right
corner.

## Integrate a Bucket in the Node

To make data from a bucket available for analysis within FLAME, a corresponding data store must be created for the
project that intends to use the data.

This process is explained in detail in
the [Creating a Data Store](/guide/admin/data-store-management#creating-a-data-store) section. When configuring a data
store for a MinIO or S3 bucket, the following parameters must be provided:

[![Data Store Creator](/images/minio_images/bucket_node.png)](/images/minio_images/bucket_node.png)

* **Data Store Type:** `S3`
* **Hostname:**  `node-datastore-minio`
* **Bucket Name:** `<bucket name>`
* **Access Key:** Generated access key for the listed, private S3 bucket
* **Secret Key:** Generated secret key for the listed, private S3 bucket
* **Port:** `9000`
