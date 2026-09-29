# Guide: Run Your First Analysis

This guide is for data analysts and researchers who want to use the FLAME platform. It provides a step-by-step instruction on how to start an analysis and view the results through the **FLAME Hub**. By the end of this guide, you will have successfully executed a sample analysis and be ready to develop your own analysis scripts.

::: info FLAME Core Concept
FLAME follows a **Code to Data** approach: You can run your analysis scripts on datasets stored at various university hospitals or institutions, while the sensitive patient records stay in their protected environment. FLAME sends your script to the **nodes** (the local environments at each site) and only aggregated results are returned.
:::

**🧬 HALTA Demo:**
In this guide, we use HALTA as an example. HALTA is a federated pipeline for Long COVID research that collects local statistics (like age and symptom distributions) and trains a machine learning model on each node. These local results are then aggregated into global plots and statistics. The analysis code and synthetic sample data are provided on [GitHub](https://github.com/PrivateAIM/Herrsching2026/tree/master).

## 1. Access to the Hub

The **Hub** is the central web portal where you manage your projects, upload analysis scripts and download the final results. There are two ways to get access:

* **Your Institution**: If FLAME is already installed at your institution, please contact your Node Admin for an account.
* **Test Instance**: To explore the platform first, you can use our [test instance](https://staging.privateaim.net/). Please reach out to the administrators via [Discord](https://discord.com/invite/yCTX7ePnhb) for access.

## 2. The Analysis Workflow

### Step 1: Create a Project Proposal

Before starting an analysis, you need to create a **project**. A project contains all analyses related to your research topic. At this stage, you select the nodes that are eligible to participate in your study. For the detailed process, see [Submitting a Project Proposal](./project).

**🧬 HALTA Demo:**  For this example, create a project for the topic "Long COVID Research". Select Node `default-1` and Node `default-2`, as these nodes already contain the necessary demo data for this analysis. Additionally, one aggregator node has to be selected to merge the results. Here you can choose `aggregator-1`.

🤝 **Node Admin required:** After submission, the Node Admins of the selected institutions must approve the project before you can proceed.

### Step 2: Data Preparation

Next, you need to ensure that the required data is available on the respective nodes. Depending on the institution's infrastructure, your data can be provided in different ways:

| Data Store | Description |
| :--- | :--- |
| **FHIR Server** | Institutions can connect a FHIR server to FLAME. This allows you to work directly with patient records in the standardized FHIR format within your script. |
| **Object Storage** | If you have your data in structured files like CSV or Parquet, these can be saved in an object storage bucket. |

**🧬 HALTA Demo:** If you are running the test analysis, the required demo data is already distributed across the nodes. You can review the expected data format and structure on [GitHub](https://github.com/PrivateAIM/Herrsching2026/tree/master/data).

🤝 **Node Admin required (for real projects):** For security reasons, only Node Admins can manage data. Please coordinate with your Node Admin to ensure that the necessary data is prepared and linked to your project before you launch your analysis script.

### Step 3: Start the Analysis

Once your project is approved and the data is ready, you can start your analysis in the Hub. After the execution is complete, your results will be available for download. For a step-by-step walkthrough, please see [Starting an Analysis](./analysis).

**🧬 HALTA Demo:**

* **Code:** Download the analysis script `analysis.py` from [GitHub](https://github.com/PrivateAIM/Herrsching2026/blob/master/analysis/analysis.py) and use it as the analysis code.
* **Image:** Select a base image containing the required libraries, e.g. Group: `python`, Image: `ml`
* **Entrypoint:** Choose `analysis.py` as the entrypoint.

🤝 **Node Admin required:** The analysis starts once all participating nodes have approved the script and triggered the execution manually.

*Note: A deployed analysis cannot be edited. If you need to modify your script, simply create a new analysis within your project.*

## 3. Write Your Own Analysis

Now that you are familiar with the FLAME workflow, you can begin developing your own analysis pipelines.

### Learn the Basics (SDK)

To write a script that is compatible with FLAME, you need to understand how it handles data distribution and aggregation.

You can start with the [Analysis Coding Guide](./analysis-coding), which explains how to implement your logic using the `StarAnalyzer` class for local node processing and the `StarAggregator` class for aggregating the results.

### Test Locally

We recommend testing your scripts locally before uploading them to the Hub. This allows you to iterate and debug quickly on your own machine without waiting for node approvals at each step.

You can use the FLAME Python Core SDK (specifically tools like `StarModelTester` or `ProxyModelTester`) to simulate a federated environment using synthetic data.

Refer to the [Local Testing Guide](./local-testing) for detailed instructions.

### Examples

We provide a variety of example analyses in our documentation. You can find examples for both [actual production scripts](./coding_examples/survival-regression) and [local simulation testing](./testing_examples/local-testing-logistic-regression-example).
