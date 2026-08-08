# Demo Instance

## Overview

This guide explains how analysts can execute analyses on FLAME. It serves as a starting point and provides an overview of the complete workflow, linking to the detailed documentation for each individual step.

Two common use cases are covered:

- Running the existing demo analysis [HALTA](https://github.com/PrivateAIM/Herrsching2026) to become familiar with the platform and verify that the environment is working correctly.
- Developing and executing your own analysis, using either the provided demo code as a starting point or your own analysis implementation.

### Scope

This guide covers the complete workflow required to prepare and execute an analysis on the demo instance. It explains how to:

- create and configure a project
- upload data and make it available in a data store
- connect the data store to a FLAME node
- execute an existing demo analysis
- develop and run your own analysis

Where appropriate, references to dedicated documentation pages are provided for more detailed explanations of individual steps.

### Goal

After completing this guide, you should be able to make data available for analysis and successfully execute either a provided demo analysis or your own analysis on the FLAME platform.

## Preparation

### 1. Submit a Project Proposal

To run an analysis, a project proposal must first be submitted in the Hub. A proposal defines the scope of the
analysis, including the target nodes, the requested data, and the images to be used. Submitting a proposal is described in detail
[here](./project).


### 2. Upload Data to the Data Store

To run an analysis on data, the data first needs to be made available in the corresponding node's data store. Each node has its own data store, in which a dedicated bucket can be created for each project. The required data can then be uploaded to the project-specific bucket.

The setup of a data store bucket is described in detail [here](../admin/bucket-setup-for-data-store).

#### Demo Data

The data for the existing demo analysis [HALTA](https://github.com/PrivateAIM/Herrsching2026) can be found [here for Node 1](https://github.com/PrivateAIM/Herrsching2026/blob/master/data/node1/synthetic_eucare_1_labeled.csv) and [here for Node 2](https://github.com/PrivateAIM/Herrsching2026/blob/master/data/node2/synthetic_eucare_2_labeled.csv).

#### Synthetic Data

If you do not have access to real data, you can create your own synthetic dataset and use it to test your analysis.

### 3. Connect the Data Store to the Node

To enable an analysis to access the required data, the data store must be connected to the corresponding node. The process of connecting a data store to a node is described in detail [here](../admin/data-store-management).


## Running Analyses

Once the project has been created, the data uploaded to the data store, and the data store connected to the node,
an analysis can be created within the project. Creating an analysis involves selecting the analysis code, the
target nodes, and the entrypoint for the analysis, and is described in detail [here](./analysis).

[//]: # (TODO: update analysis.md, its content is outdated)

### Run the Demo Analysis

The script for the existing demo analysis [HALTA](https://github.com/PrivateAIM/Herrsching2026) is available
[on GitHub](https://github.com/PrivateAIM/Herrsching2026/blob/master/analysis/analysis.py) and can be used to run
the demo analysis on the previously uploaded demo data.

### Create Your Own Analysis

See [Analysis Coding](./analysis-coding) for instructions on developing your own analysis.