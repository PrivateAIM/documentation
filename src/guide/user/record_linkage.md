# Privacy-Preserving Record Linkage (PPRL)

::: warning Info
This tutorial shows how to run a privacy-preserving record linkage analysis in **FLAME** using the provided <a href="/files/record_linkage_intersection.py" download>record-linkage.py</a> script.
It reuses the generic concepts from the guides on [Coding an Analysis](/guide/user/analysis-coding) and the [Core SDK](/guide/user/sdk-core-doc). For hub usage basics see [Starting an Analysis](/guide/user/analysis).

This example is an MVP-level record linkage.
:::

::: info Download
Download the full reference script: <a href="/files/record_linkage_intersection.py" download>record_linkage.py</a>
:::

## Goal

This tutorial demonstrates how to perform a multi-centric record linkage analysis using Python, a user-adapted configuration TOML file, and a streamlined version of the Mainzelliste pseudonymization, identity management, and record linkage system. 
The streamlined version of Mainzelliste, implemented in Rust, provides high performance, robustness, and a compact runtime footprint, making it suitable for distributed data processing across multiple institutions or nodes.

Record linkage is the process of identifying records that correspond to the same individual across different datasets. In multi-centric settings, this must be done without sharing sensitive personal data between sites. Mainzelliste achieves this through privacy-preserving algorithms: identifying information is encoded using Bloom filters, and original identifiers are replaced by pseudonyms, ensuring that sensitive data is never directly exchanged.

In this tutorial, you will learn how to detect records belonging to the same individual across CSV files stored in an S3/MinIO bucket, spanning multiple participating nodes. The analysis is static, meaning it is performed automatically at the start of a project, provided the feature is enabled. The result is an aggregated JSON report, summarizing intersections between all nodes as well as pairwise comparisons, allowing analysts to understand which records match across sites without exposing raw personal data.

While this example focuses on CSV files, the workflow and concepts are applicable to a wide range of distributed, privacy-preserving data analysis tasks, including healthcare data stored in FHIR servers or relational databases. This tutorial also illustrates how to configure the analysis using a TOML file, handle pseudonymized identifiers, and aggregate results from multiple nodes, providing a foundation for scalable, secure, and privacy-conscious record linkage.

## Analysis Workflow

The general workflow of the record linkage analysis is as follows:
- The aggregator node generates configuration files (including the salt value for later Bloom filter generation) for all analyzer nodes and distributes them.
- Each analyzer node starts Mainzelliste with the configuration, retrieves patient data from its S3 datastore, and processes it into Bloom filters using the salt value. Each analyzer node then sends its ID and the Bloom filters back to the aggregator node.
- The aggregator node receives the Bloom filters from all analyzer nodes and performs record linkage by adding them to Mainzelliste. Identical patients are assigned the same pseudonyms. The aggregator node then computes the pairwise intersections and the number of patients shared across sites. This information is collected in a JSON list and made available for download in the hub. Additionally, the aggregator node informs the respective analyzer nodes about which of their patients are duplicates, enabling this information to be used in future analyses.


## Prerequisites
- A project (proposal) with at least one analyzer node and one aggregator node approved (see [Project Guide](/guide/user/project)).
- The **record-linkage** master image available (contains `mainzelliste`).
- MinIO (S3) datastores configured on each participating node. See admin docs for bucket setup: [Bucket Setup](/guide/admin/bucket-setup-for-data-store) & [Data Store Management](/guide/admin/data-store-management).

### Python Analysis Script
The script (<a href="/files/record_linkage_intersection.py" download>record_linkage.py</a>) defines:

1. `RLAnalyzer` (runs on each analyzer node)  
   - **`__init__()`**: Initializes the analyzer node.  
   - **`analysis_method()`**: Executes the main analysis workflow, consisting of multiple steps:  
     * **Initialize PostgreSQL** – Prerequisite for Mainzelliste (using `run_as_postgres()`, `init_db()`, `start_postgres()`, `create_user_and_db()`).  
     * **Start Mainzelliste** – Provides pseudonymization services and performs Bloom filter calculations.  
       - `wait_for_mainzelliste()`: Polls the Mainzelliste health check, attempting to establish a connection until the timeout is reached.  
     * **Process patients from CSV** – Iterates over all patients in the project’s S3 datastore.  
       - `add_patients()`: Adds patients to Mainzelliste from CSV (using `create_session_and_token()` to start a session and `get_new_pseudonyms()` to obtain pseudonyms).  
       - `get_bloomfilters()`: Retrieves Bloom filters from Mainzelliste for record linkage.  
     * **Cleanup** – Cleanly shuts down services.  
       - `cleanup()`: Stops PostgreSQL (via `stop_postgres()`).  
     * **Multi-stage processing** – Analysis is performed in up to three iterations (stages 0–2).  
   

2. `RLAggregator` (runs on the aggregator node)
   - **`__init__()`**: Initializes the aggregator node, initializes PostgresSQL and starts Mainzelliste.
     * **Generates configurations** - Generates configurations for analyzers and aggregator (using `create_config_nodes()`, `create_config_aggregator()`).
     * **Initialize PostgreSQL** – Prerequisite for Mainzelliste (using `run_as_postgres()`, `init_db()`, `start_postgres()`, `create_user_and_db()`). 
     * **Start Mainzelliste** – Provides pseudonymization services and performs Bloom filter calculations.  
   - **`aggregation_method()`**: Executes matching logic, collects, and distributes results, consisting of multiple steps:  
     * Return configuration to analyzer nodes.
     * Gather Bloom filter results from all analyzers.
     * `wait_for_mainzelliste()`: Polls the Mainzelliste health check, attempting to establish a connection until the timeout is reached.  
     * **Identify duplicates** – Perform record linkage with Bloom filters: iterates over all Bloom filters of all analyzer nodes and adds them to Mainzelliste.  
       - Matching Patients get same pseudonyms.
     * **Compute intersections** - Computes global and pairwise duplicates: calculates intersection of all nodes based on pseudonyms (using `all_nodes_intersect()`).
     * Return results to analyzers and hub.
     * `stop_postgres()`: Stops PostgreSQL.  


### TOML Configuration File
Additionally to the Python analysis script, the analyst must provide a project-specific `config.toml` file.

The configuration file specifies the `data fields` on which record linkage should be performed.
Therefore, the analyst must be familiar with the project’s data and assess whether it is suitable for record linkage.

If no such file is provided, the script falls back to a built-in default configuration, which may not be compatible with the project’s data fields and could therefore cause the analysis to fail.

The `config.toml` file below indicates the fields that the analyst should customize for the project. 

```toml
[patient_settings]
vorname = "String"
nachname = "String"
geburtstag = "Integer"
geburtsmonat = "Integer"
geburtsjahr = "Integer"
ort = "String"
plz = "Integer"

[matcher_frequency]
vorname = 0.000235
nachname = 0.0000271
geburtstag = 0.0333
geburtsmonat = 0.0833
geburtsjahr = 0.0286
ort = 0.01
plz = 0.01

[matcher_error_rate]
vorname = 0.01
nachname = 0.008
geburtstag = 0.005
geburtsmonat = 0.002
geburtsjahr = 0.004
ort = 0.04
plz = 0.04

[validate_fields]
vorname = "^[A-Za-zäÄöÖüÜßáÁéÉèÈ\\.\\- ]*[A-Za-zäÄöÖüÜßáÁéÉèÈ]+[A-Za-zäÄöÖüÜßáÁéÉèÈ\\.\\- ]*$"
nachname = "^[A-Za-zäÄöÖüÜßáÁéÉèÈ\\.\\- ]*[A-Za-zäÄöÖüÜßáÁéÉèÈ]+[A-Za-zäÄöÖüÜßáÁéÉèÈ\\.\\- ]*$"

[validate_date]
fields = ["geburtstag", "geburtsmonat", "geburtsjahr"]

[thresholds] 
is_match = 0.95
non_match = 0.95

[exchange_groups]
exchange_group_0 = ["vorname","nachname"]
exchange_group_1 = ["geburtstag","geburtsjahr","geburtsmonat"]
```
The `config.toml` file supports the following settings:

| **Field**       | **Description**                                                                                                                                                             |
|-----------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **patient_settings**         | Defines the data type of each field (`String` or `Integer`)                                                                                                           |
| **matcher_frequency**      | A real-valued parameter in the range `[0,1]` that specifies the relative frequency of values in the field *{fieldname}*. It corresponds to the *u-probability* in the Fellegi–Sunter model (Fellegi and Sunter, 1969). Typically, it is set as the reciprocal of the number of possible values the field can take (or observed in a sufficiently large dataset). **Examples:**  Month → `1/12 ≈ 0.0833` and Day of the month → `1/30 ≈ 0.0333` |
| **matcher_error_rate**          | A real-valued parameter in the range `[0,1]` that specifies the assumed error rate for the field *{fieldname}*. This can be estimated from sufficiently large test datasets with known matching status. In practice, however, a uniform ad-hoc value across all fields (e.g., `0.05`) is often sufficient                                                                                                                           |
| **validate_fields**       | A regular expression applied to specific string fields to verify their validity. For example, it can ensure that names do not contain numbers                                                                                                             |
| **validate_date** | A list of fields that together define a complete date                                                                                  |
| **tresholds**            | A value between [0,1] indicating the minimum weight for a record pair to count as a definitive match. To prevent failures in Flame, both `is_match` and `non_match` must be set identically                    |
| **exchange_groups**        | A comma-separated list of field names that are treated as interchangeable. For the built-in matchers (`EpilinkMatcher`, `ThreadedEpilinkMatcher`), all possible permutations of the fields across two records are compared, and the permutation with the highest similarity contributes to the overall score                                                                                                                          


## Reference Code (Excerpt)
The following excerpts highlight the key distributed computing patterns in <a href="/files/record_linkage_intersection.py" download>record_linkage.py</a>. The full file contains additional logic.

When executing the record linkage analysis in the FLAME platform, multiple iterations between the aggregator and analyzer nodes are required:
- **Initialization:** The RLAnalyzer and RLAggregator are started. 
- **First iteration:** The analyzer’s `analysis_method()` is called. Since configuration files from the aggregator are required before Bloom filter generation can begin, the `analysis_method()` returns `None`. The aggregator detects this (because `aggregator_results` are `None`) and responds with the configuration files in a dictionary under the key `"config"`.
- **Second iteration:** As `aggregator_results` are no longer `None` and contain the `"config"` key, the analyzer recognizes the second iteration, generates the Bloom filters, and returns them. The aggregator then checks the analysis results again. Because they are not `None`, it concludes that this is no longer the first iteration. Once the iterations are complete, the aggregator receives the string `"finished"`. At this point, since the `analysis_results` are neither `None` nor equal to `"finished"`, it moves into the `else` branch and performs the record linkage. It then sends the duplicate patient results back to the respective nodes. 
- **Final step:** The analyzer nodes detect the final iteration because the `aggregator_results` are not `None` and do not contain the `"config"` key. They therefore move into their own `else` branch and store the information about duplicates for future use. Once the analysis is complete, the aggregator receives the string `"finished"` and finally returns the computed intersections to the hub, marking the end of the analysis.


The `StarModel` configuration defines how data is distributed and processed across nodes:

```python
def main():
    # Configure StarModel for S3/MinIO objects. The dataset configuration in each node's hub
    # should point to the desired bucket; here we only specify the object keys.
    StarModel(
        analyzer=RLAnalyzer,
        aggregator=RLAggregator,
        data_type="s3",           # Distributed S3/MinIO data sources
        simple_analysis=False,     # Multi-iterative analysis
        output_type="str",        # JSON string result
    )
```
This setup enables each analyzer node to process its local data independently while using the same analysis logic.
In the case of record linkage, the process is a mulit-iterative analysis, which is why `simple_analysis` is set to `False`.


### Analyzer Node Processing
Each analyzer node processes its local dataset and returns structured results. The `analysis_method()` receives a list of dictionaries where each dictionary maps S3 object keys to their actual file content (bytes):

```python
class RLAnalyzer(StarAnalyzer):
    def add_patients(self, keep_keys, data, url, content_header, api_key):
        """Adds patients to the Mainzelliste and returns pseudonyms."""
        for file_bytes in data[0].values():
            decoded = file_bytes.decode("utf-8")
            csv_reader = csv.DictReader(io.StringIO(decoded), delimiter=";")
        ...

    def analysis_method(self, data: List[Dict[str, Any]], aggregator_results: Any) -> Dict[str, Any]:
        if aggregator_results == None: # 0 Iteration
            self.flame.flame_log("0. Iteration")
            return None
        elif "config" in aggregator_results[0]: # 1 Iteration
            ...
            pseudonyms = self.add_patients(keep_keys, data, url, content_header, api_key)
            patients_sorted = self.get_bloomfilters(pseudonyms, url, content_header, api_key)
            ...
            return {self.flame.get_id(): patients_sorted}

        else: # 2 Iteration
            duplicates = aggregator_results[0][self.flame.get_id()]

            self.flame.flame_log("Save intermediate data...")
            self.flame.save_intermediate_data(
                data=duplicates,
                location="local",
                tag="record-linkage-results",
                silent=False
            )

            self.cleanup(self.result)  # End Mainzelliste + Postgres
            return "finished"
```


The temporary file approach is necessary to start the mainzelliste with a file path, but FLAME provides S3 object content as in-memory data. Each analyzer processes only its local data but returns results in a standardized format for aggregation.

### Secure Data Handling
Files are processed in temporary locations without exposing sensitive content:

Error handling ensures that sensitive details from local processing don't leak across the federation.

Bloom filters, combined with a salt value, are used to protect patient data. They make the original information non-readable while still allowing secure record linkage across nodes.

### Cross-Node Aggregation
The aggregator combines results from all analyzer nodes into a federated summary. Since `has_converged()` evaluates to `False` if the number of iterations is below 2, the `aggregation_method()` is executed up to three iterations (stages 0–2).

```python
class RLAggregator(StarAggregator):
    def aggregation_method(self, analysis_results: List[Dict[str, Any]]) -> str:
        if analysis_results[0] is None: # 0 iteration
            self.flame.flame_log("0 iteration") 
            return {"config": self.analyzer_config_dict}
      
        elif analysis_results[0] == "finished": # 2 iteration
            self.flame.flame_log("aggregator finishes")
            return self.hub_results
        
        else: # 1 iteration
            ...
                return node_results
        
    def has_converged(self, result, last_result, num_iterations):
        if num_iterations >= 2: # iterative federation
            return True
        return False
```

The aggregator receives structured data from each node and produces federation-wide statistics without accessing raw data files.

## Output Structure
The final JSON result can be downloaded from the Hub.   
The structure summarizes the number of matching records across nodes. For documentation purposes, placeholders are shown instead of the actual (longer) node IDs.

- **Example with two nodes**  
```json
{
  "node1-id:node2-id": 5,
  "total": 5
}
```
- **Example with three nodes** 
```json
{
    "node1-id:node2-id": 5, 
    "node1-id:node3-id": 5, 
    "node2-id:node3-id": 4, 
    "total": 3
}
```

## See Also
- [Core SDK Reference](/guide/user/sdk-core-doc)
- [Coding an Analysis](/guide/user/analysis-coding)
- [Admin: Bucket Setup](/guide/admin/bucket-setup-for-data-store)
- [Admin: Analysis Execution](/guide/admin/analysis-execution)
- [Survival Regression Example](/guide/user/survival-regression)
