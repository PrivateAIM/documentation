# Basic VCF Quality Control using Python

::: warning Info
This tutorial shows how to run a simple, single‑round federated VCF quality control (QC) analysis in **FLAME** using the provided <a href="/files/vcf_qc.py" download>vcf_qc.py</a> script.
It reuses the generic concepts from the guides on [Coding an Analysis](/guide/user/analysis-coding) and the [Core SDK](/guide/user/sdk-core-doc). For hub usage basics see [Starting an Analysis](/guide/user/analysis).

This example is an MVP-level QC. Do not treat it as a substitute for comprehensive clinical-grade validation workflows.
:::

::: info Note
Download the full reference script: <a href="/files/vcf_qc.py" download>vcf_qc.py</a>
:::

## Goal
This tutorial demonstrates how to perform a federated quality check (QC) analysis using Python. You’ll learn how to inspect every `.vcf` or `.vcf.gz` file stored in an S3/MinIO bucket across multiple participating nodes. The process will generate an aggregated JSON report, summarizing the pass/fail status and warnings for each file and node.
While this example focuses on QC for VCF files, the concepts and workflow can be adapted to a wide range of distributed data analysis tasks.


## What the Script Does
The script (<a href="/files/vcf_qc.py" download>vcf_qc.py</a>) defines:

1. `VCFAnalyzer` (runs on each analyzer node)
   - Iterates over all VCF files made available via the project S3 datastore (optionally filtered by `VCF_S3_KEYS`).
   - Writes object bytes to a temporary file and opens it with `pysam.VariantFile`.
   - Collects per‑file checks:
     * Non‑empty file
     * `fileformat` present in header
     * At least one variant
     * (Warning) Missing contigs
     * (Warning) Unsorted records (chromosome & position order)
   - Counts variants, contigs and samples
   - Returns a per-node summary: counts of valid / invalid files, total variants, and a list of file result dictionaries.

2. `VCFAggregator` (runs on the aggregator node)
   - Receives all node summaries and produces JSON with:
     * `overall_pass` – all nodes passed (no invalid files and at least one valid file per passing node)
     * `overall_total` – total number of valid files across nodes
     * `failing_nodes` – indices of nodes whose `node_pass` is `False`
     * `warnings_present` – whether any node reported warnings
     * `nodes` – the raw per‑node results (for transparency / auditing)


::: tip File Selection (VCF_S3_KEYS)
The script exposes a top‑level variable `VCF_S3_KEYS: List[str] | None = None`.

| Value | Behavior |
|-------|----------|
| `None` | Analyze **all** objects in the configured bucket / prefix whose names end with `.vcf` or `.vcf.gz`. |
| `[...]` | Restrict analysis to exactly the listed object keys (must match the S3 object keys as seen in the datastore). |

Set this **before** starting the analysis (edit the script and re‑approve). The same files keys must be present on **all** participating nodes, otherwise nodes will attempt to fetch non-existent files. You may adapt the logic and implement a **per-node** key list.

Example restriction:
```python
# Only analyze two specific files inside the bucket prefix
VCF_S3_KEYS = [
    "cohortA/sample_001.vcf.gz",
    "cohortA/sample_002.vcf.gz",
]
```

Ensure VCF filenames (object keys) do **not** contain sensitive identifiers. Filenames are included verbatim in aggregated results.
:::

## Prerequisites
- A project (proposal) with at least one analyzer node and one aggregator node approved (see [Project Guide](/guide/user/project)).
- The **genomics** master image available (contains `pysam` and other basic genomics tools).
- MinIO (S3) datastores configured on each participating node. See admin docs for bucket setup: [Bucket Setup](/guide/admin/bucket-setup-for-data-store) & [Data Store Management](/guide/admin/data-store-management).

## Step‑by‑Step
1. Project Selection
   - Open the Hub, select your existing project (or create & approve one first).

2. Create Analysis
   - Go to Analyses → Create.
   - Select image group: `python` and choose the `genomics` image.
   - Name & describe (optional).

3. Select Nodes
   - Choose exactly one node as **aggregator** and one or more nodes as **analyzers**.

4. Add Code
   - Use / adapt <a href="/files/vcf_qc.py" download>vcf_qc.py</a> . (You can start from the reference below.)
   - Upload the file and set it as the entry point.

5. Prepare Data (per Node Admin)
   - On every analyzer node AND the aggregator node, create (or reuse) an S3 bucket in MinIO.
   - Set bucket policy to public (for this MVP example) via MinIO UI: Summary → Access Policy.
   - Upload VCF files (`*.vcf` or `*.vcf.gz`).
   - Keep consistent bucket name across nodes.

::: warning Important
Ensure VCF filenames (object keys) do **not** contain sensitive identifiers. Filenames are included verbatim in aggregated results.
:::

6. Connect Datastores to the Analysis
   - Node admin connects the bucket as a datastore to the project (role: aggregator connects too, because it enumerates file names for reporting).
   - Use protocol S3, correct host / port (e.g. `9000`), and `http` if TLS is not configured (MVP setting).

7. Build & Approvals
   - Lock the analysis.
   - Each node admin reviews & approves (see [Analysis Review](/guide/admin/analysis-review)).

8. Execute
   - Each node admin starts the analysis manually (see [Analysis Execution](/guide/admin/analysis-execution)).
   - The run is single‑round; once all analyzers finish, the aggregator produces the final JSON result.

9. Download Result
   - In the Hub UI, once status is Complete, download results (a tar archive). The JSON string is the final output.


## Reference Code (Excerpt)
Key logic from <a href="/files/vcf_qc.py" download>vcf_qc.py</a> (simplified for illustration; keep full version in your uploaded file):

```python
class VCFAnalyzer(StarAnalyzer):
    def analysis_method(self, data, aggregator_results):
        file_results = []
        valid_file_count = 0
        total_variant_count = 0
        for objects in data:  # one dict per connected S3 datastore
            for fname, content in objects.items():
                if not fname.endswith((".vcf", ".vcf.gz")):
                    continue
                # write temp + open via pysam, gather QC stats...
                fr = self._process_vcf_file(fname, tmp_file.name, written_size)
                file_results.append(fr)
                if fr["pass"]:
                    valid_file_count += 1
                    total_variant_count += fr.get("variant_count", 0)
        invalid_file_count = len(file_results) - valid_file_count
        return {
            "node_pass": invalid_file_count == 0 and valid_file_count > 0,
            "valid_file_count": valid_file_count,
            "invalid_file_count": invalid_file_count,
            "files": file_results,
            "total_variant_count": total_variant_count,
            "warnings_present": any(fr.get("warnings") for fr in file_results),
        }

class VCFAggregator(StarAggregator):
    def aggregation_method(self, analysis_results):
        result = {
            "overall_pass": all(r["node_pass"] for r in analysis_results),
            "warnings_present": any(r.get("warnings_present") for r in analysis_results),
            "overall_total": sum(r["valid_file_count"] for r in analysis_results),
            "failing_nodes": [i for i, r in enumerate(analysis_results) if not r["node_pass"]],
            "nodes": analysis_results,
        }
        return json.dumps(result)
```

## Output Structure
Final JSON (example structure):

```json
{
    "overall_pass": true,
    "warnings_present": true,
    "overall_total": 7,
    "failing_nodes": [],
    "nodes": [
        {
            "node_pass": true,
            "warnings_present": true,
            "valid_file_count": 3,
            "invalid_file_count": 0,
            "total_variant_count": 30,
            "files": [
                {
                    "file": "sample_1.vcf.gz",
                    "size_bytes": 948,
                    "pass": true,
                    "warnings": true,
                    "reason": "WARN: No contigs; WARN: Unsorted",
                    "contig_count": 0,
                    "sample_count": 3,
                    "variant_count": 9
                },
                {
                    "file": "sample_2.vcf",
                    "size_bytes": 2050,
                    "pass": true,
                    "warnings": false,
                    "reason": "",
                    "contig_count": 0,
                    "sample_count": 3,
                    "variant_count": 9
                }
                ... // More files
            ],
        }
        ... // More nodes
    ]
}
```

### Field Notes
File‑level fields:
* `pass` – `True` if no fatal issues.
* `warnings` – `True` if one or more non‑fatal warnings were added.
* `reason` – Concatenation of all messages, each prefixed with `FATAL:` or `WARN:`; empty string when there are none.
* `contig_count`, `sample_count`, `variant_count` – Simple counts extracted from the header / records.

Node / overall level warning flags (`warnings_present`) bubble up if **any** file on that node (or any node overall) has warnings.

Fatal messages include things like `FATAL: Empty file`, `FATAL: Zero variants`, `FATAL: OpenError:...`. Warnings currently include `WARN: No contigs` and `WARN: Unsorted`.

## Customizing
- Limit to specific files by setting `VCF_S3_KEYS = ["key/to/file1.vcf.gz", ...]` in the script.
- Extend `_process_vcf_file` for additional QC metrics (e.g., INFO field presence, genotype completeness). Ensure you keep output JSON serializable.
- Change `output_type` (`StarModel`) to `bytes` or `pickle` if you want to return richer objects (then adapt downstream tooling).

## Troubleshooting
| Issue | Cause | Action |
|-------|-------|--------|
| Empty results / `node_pass=False` | No `.vcf` files detected | Confirm bucket contents & datastore connection |
| `OpenError:ValueError` (or similar) | Corrupt / unsupported file | Re‑generate or remove problematic file |
| All files marked warning `Unsorted` | Input not coordinate-sorted | Sort with `bcftools sort` and re‑upload |
| `Zero variants` fatal | Header present but no records | Validate file generation pipeline |

## See Also
- [Core SDK Reference](/guide/user/sdk-core-doc)
- [Coding an Analysis](/guide/user/analysis-coding)
- [Admin: Bucket Setup](/guide/admin/bucket-setup-for-data-store)
- [Admin: Analysis Execution](/guide/admin/analysis-execution)
- [Survival Regression Example](/guide/user/survival-regression)

----

Author: Jules Kreuer
