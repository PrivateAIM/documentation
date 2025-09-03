# Using CLI Tools for Federated FASTQ QC

::: warning Assumed Knowledge
This guide assumes you're already familiar with the concepts shown in the **VCF QC** tutorial (federated execution model, analyzer vs. aggregator roles, project / datastore setup, approvals). If not, read that first: see [VCF QC Guide](/guide/user/vcf-qc) plus the background docs on [Coding an Analysis](/guide/user/analysis-coding) and the [Core SDK](/guide/user/sdk-core-doc).
:::

::: info Summary
This tutorial shows how to run a simple, single‑round federated FASTQ quality control (QC) analysis in **FLAME** using the external command‑line tool **FastQC** and the provided reference script <a href="/files/fastq_qc.py" download>fastq_qc.py</a>.
It is an MVP / demonstration workflow and is **not** a substitute for comprehensive sequencing data QC or clinical validation pipelines.
:::

::: info Download
Download the full reference script:  <a href="/files/fastq_qc.py" download>fastq_qc.py</a>
:::

## Goal
Show how to use a **command‑line tool** (FastQC in our case) inside a single‑round federated analysis: handling temporary output, enforcing runtime constraints (quiet mode + timeout), parsing only the minimal required artifacts, and aggregating per‑file module statuses and basic stats across nodes without moving raw read data. You will learn the exact CLI invocation pattern, where transient files live, what causes a FAIL / WARN at the file level, and how to reproduce a node’s result locally using plain shell commands before (or after) federation.

::: tip Why python?
As there is no FLAME StarModel for bash we must rely on python as wrapper for our CLI tools.
:::

## What the Script Does
Condensed overview (details parallel the VCF QC example):
* Analyzer writes each candidate FASTQ object to a temp file and runs: `fastqc --quiet --outdir <tmp> <file>`.
* Parses `fastqc_data.txt` (basic stats) + `summary.txt` (module statuses) from the produced `_fastqc.zip`.
* Fails a file on structural / runtime issues, zero sequences, missing required stats, or any module with status `FAIL`.
* Marks warnings if one or more modules report `WARN` (but none `FAIL`).
* Aggregator concatenates per‑node results into one JSON; single round (`simple_analysis=True`).

Anything not listed here works identically to the VCF QC pattern (data fan‑out, approvals, convergence logic).

## Prerequisites
- A project (proposal) with at least one analyzer node and one aggregator node approved (see [Project Guide](/guide/user/project)).
- The **genomics** master image available (contains `pysam` and other basic genomics tools).
- MinIO (S3) datastores configured on each participating node. See admin docs for bucket setup: [Bucket Setup](/guide/admin/bucket-setup-for-data-store) & [Data Store Management](/guide/admin/data-store-management).


::: warning Filenames & Privacy
FASTQ filenames (object keys) are included verbatim in aggregated outputs. Ensure they do **not** contain sensitive identifiers. If needed, anonymize beforehand.
:::


## CLI Invocation Used
Each file is processed via (conceptually):

```python
with tempfile.TemporaryDirectory() as temp_dir:          # Clean workspace
	cmd = ["fastqc", "--quiet", "--outdir", temp_dir, path]
	result = subprocess.run(                             # Controlled execution wrapper
		cmd,
		capture_output=True,                             # Prevent noisy/stdout leakage
		text=True,                                       # Easier error string handling
		timeout=300,                                     # Hard upper bound per file
	)
	if result.returncode != 0:
		# Mark file failed with sanitized reason (no raw stderr leakage)
		...
	# Extract minimal metrics; discard directory when context exits
```
The design above deliberately places each FASTQ file in its own clean workspace (`TemporaryDirectory`) so concurrent processing cannot collide on filenames and so every transient artifact (unzipped FastQC output, extracted text files) is guaranteed to be purged automatically on scope exit. 

A per‑file temporary copy is necessary because FastQC (like many classic bioinformatics CLI tools such as `samtools`) operates on **real filesystem paths**; some tools also rely on filename extensions to auto‑detect compression (e.g. distinguishing gzipped input). 

The explicit `timeout=300` acts as a safety valve: a single pathological, corrupt or unexpectedly huge file cannot monopolize runtime resources or stall the federated round. Increase this value only if you routinely process very large read sets and have validated performance. 

Failure **reasons are intentionally sanitized**: the script emits generic, high‑signal messages instead of raw FastQC stderr or stack traces, reducing the risk of **leaking sensitive sequence fragments** or environment internals across nodes.

If a timeout or execution failure occurs, the script simply marks that specific file as failed (with a concise reason) and continues processing the remaining files so one bad input never invalidates the entire node contribution.


## Output Structure
Example real output (abridged for width):

```json
{
  "overall_pass": false,
  "warnings_present": true,
  "overall_total": 2,
  "failed_nodes": ["e58721f5-b971-4028-bbf7-362a65a0e660"],
  "nodes": [
	 {
		"node_pass": true,
		"warnings_present": true,
		"valid_file_count": 2,
		"invalid_file_count": 0,
		"files": [
		  {
			 "file": "SRR062634.filt.fastq",
			 "size_bytes": 80755971,
			 "pass": true,
			 "warnings": true,
			 "reason": "WARN: per_tile_sequence_quality",
			 "total_sequences": 308846,
			 "sequence_length": 100,
			 "gc_content": 40.0
		  }
		  // ... second file ...
		],
		"node_id": "2a1828d3-e52a-4805-8dae-62eab8083031"
	 },
	 // ... second node ...
  ]
}
```
## Customizing (Quick List)
* Limit files: set `FASTQ_S3_KEYS = [...]`.
* Tune timeout: adjust `timeout=300`.
* Add metrics: extend `_parse_fastqc_data_content` to capture more fields.
* Module filtering: post‑process `summary_data` before failure logic.
* Output type changes: switch `output_type` if returning non‑string.

## Troubleshooting
| Issue | Hint |
|-------|------|
| `FastQC executable not found` | Use image incl. FastQC or rebuild.
| `FastQC timeout` | Increase timeout or subset reads.
| All files warning same modules | Investigate data quality locally with full HTML report.
| Zero sequences / missing stats | Validate input format; re‑download / regenerate file.
| Node fails with no files | Check extensions & datastore mapping; maybe restrict keys incorrectly.

## See Also
* [VCF QC Guide](/guide/user/vcf-qc)
* [Core SDK Reference](/guide/user/sdk-core-doc)
* [Coding an Analysis](/guide/user/analysis-coding)
* [Admin: Analysis Execution](/guide/admin/analysis-execution)
* [Admin: Bucket Setup](/guide/admin/bucket-setup-for-data-store)

----

Author: Jules Kreuer

