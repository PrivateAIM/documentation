"""Basic FASTQ QC for FLAME federated analysis.

The analyzer expects a collection of objects (files) belonging to a folder/prefix.
Every object whose name ends with ``.fastq``, ``.fq``, ``.fastq.gz``, or ``.fq.gz`` is considered a FASTQ file
subject to QC.

The filenames are reported to the aggregator. Make sure that they do not include any
sensitive information.
"""

from __future__ import annotations

import json
import os
import subprocess
import tempfile
import zipfile
from typing import Any, Dict, List

from flame.star import StarModel, StarAnalyzer, StarAggregator

__author__ = "Jules Kreuer, jules.kreuer@uni-tuebingen.de"
__version__ = "0.1.0"

# Set of S3 object keys to analyze; None means all objects in the configured bucket/prefix.
# The same keys are used on all node.
FASTQ_S3_KEYS: List[str] | None = None


class FastqAnalyzer(StarAnalyzer):
    """Analyzer that performs QC across all FASTQ files in a provided folder dataset.

    Expected data layout provided to ``analysis_method`` for S3 data_type:
        data[0] -> dict mapping each queried object key to its object body (bytes/str).
    """

    def __init__(self, flame):  # type: ignore[no-untyped-def]
        super().__init__(flame)

    def _process_fastq_file(self, fname: str, path: str, size_bytes: int) -> Dict[str, Any]:
        """Run FastQC; never raises. Returns a result dict with pass False on any failure."""

        def fail(reason: str) -> Dict[str, Any]:
            return {
                "file": fname,
                "size_bytes": size_bytes,
                "pass": False,
                "warnings": False,
                "reason": reason,
                "total_sequences": 0,
                "sequence_length": 0,
                "gc_content": 0.0,
            }

        if size_bytes == 0:
            return fail("Empty file")

        try:
            with tempfile.TemporaryDirectory() as temp_dir:
                cmd = ["fastqc", "--quiet", "--outdir", temp_dir, path]
                result = subprocess.run(cmd, capture_output=True, text=True, timeout=300)
                if result.returncode != 0:
                    return fail(
                        f"FastQC failed (exit {result.returncode}): {result.stderr.strip()}"
                    )

                produced = [f for f in os.listdir(temp_dir) if f.endswith("_fastqc.zip")]
                if len(produced) != 1:
                    return fail(f"Unexpected FastQC zip count {len(produced)}: {produced}")
                zip_path = os.path.join(temp_dir, produced[0])
                with zipfile.ZipFile(zip_path, "r") as zf:
                    folder = produced[0][:-4]
                    data_entry = f"{folder}/fastqc_data.txt"
                    summary_entry = f"{folder}/summary.txt"
                    try:
                        data_content = zf.read(data_entry).decode("utf-8")
                        summary_content = zf.read(summary_entry).decode("utf-8")
                    except KeyError as exc:
                        return fail(f"Missing FastQC file: {exc}")
        except subprocess.TimeoutExpired:
            return fail("FastQC timeout")
        except FileNotFoundError:
            return fail("FastQC executable not found in PATH")
        except Exception as exc:  # last-resort catch -> mark file failed
            return fail(f"Unexpected error: {exc}")

        try:
            summary_data = self._parse_summary_data(summary_content)
            basic_stats = self._parse_fastqc_data_content(data_content)
        except Exception as exc:
            return fail(f"Parsing error: {exc}")

        merged = {**basic_stats, **summary_data}

        required_basic = ["total_sequences", "sequence_length", "gc_content"]
        for key in required_basic:
            if key not in merged:
                return fail(f"Missing stat {key}")

        if merged["total_sequences"] == 0:
            return fail("Zero sequences reported")

        failing_modules = [k for k, v in merged.items() if v == "FAIL"]
        if failing_modules:
            return fail("FAIL modules: " + ", ".join(failing_modules))

        warning_modules = [k for k, v in merged.items() if v == "WARN"]
        reason = "OK" if not warning_modules else "; ".join([f"WARN: {m}" for m in warning_modules])

        return {
            "file": fname,
            "size_bytes": size_bytes,
            "pass": True,
            "warnings": bool(warning_modules),
            "reason": reason,
            "total_sequences": merged["total_sequences"],
            "sequence_length": merged["sequence_length"],
            "gc_content": merged["gc_content"],
        }

    def _parse_summary_data(self, summary_content: str) -> Dict[str, str]:
        """Parse FastQC summary.txt into a {module: status} dict.

        Raises:
            ValueError: If a line cannot be parsed.
        """
        summary_data: Dict[str, str] = {}
        for raw in summary_content.strip().split("\n"):
            line = raw.strip()
            if not line:
                continue
            parts = line.split("\t")
            if len(parts) < 2:
                raise ValueError(f"Unparsable summary line: '{line}'")
            status = parts[0].strip()
            module_name = parts[1].strip().lower().replace(" ", "_")
            summary_data[module_name] = status
        return summary_data

    def _parse_fastqc_data_content(self, data_content: str) -> Dict[str, Any]:
        """Parse fastqc_data.txt content.

        Returns dict with basic statistics and module statuses discovered in the file.
        Raises if a critical numeric field is malformed.
        """
        stats: Dict[str, Any] = {}
        for raw in data_content.split("\n"):
            line = raw.strip()
            if not line:
                continue
            if line.startswith(">>") and line.endswith("<<"):
                parts = line[2:-2].split("\t")
                if len(parts) >= 2:
                    module = parts[0].strip().lower().replace(" ", "_")
                    stats[module] = parts[1].strip()
                continue
            if line.startswith("Total Sequences"):
                stats["total_sequences"] = int(line.split("\t")[1])
                continue
            if line.startswith("Sequence length"):
                length_str = line.split("\t")[1]
                # Preserve ranges exactly; convert single value to int
                if "-" in length_str:
                    stats["sequence_length"] = length_str
                else:
                    stats["sequence_length"] = int(length_str)
                continue
            if line.startswith("%GC"):
                stats["gc_content"] = float(line.split("\t")[1])
                continue
        return stats

    def analysis_method(
        self,
        data: List[Dict[str, Any]],
        aggregator_results: Any,
    ) -> Dict[str, Any]:  # noqa: D401 - FLAME required signature

        node_id = self.flame.get_id()

        if not data:
            return {
                "node_pass": False,
                "warnings_present": False,
                "valid_file_count": 0,
                "invalid_file_count": 0,
                "files": [],
                "reason": "No objects supplied",
                "node_id": node_id,
            }

        file_results: List[Dict[str, Any]] = []
        valid_file_count = 0

        for objects in data:
            for fname, content in objects.items():
                if not fname.endswith((".fastq", ".fq", ".fastq.gz", ".fq.gz")):
                    continue

                # Create temporary file with appropriate extension for FastQC to recognize format
                file_extension = ""
                if fname.endswith(".fastq.gz") or fname.endswith(".fq.gz"):
                    file_extension = ".fastq.gz"
                elif fname.endswith(".fastq") or fname.endswith(".fq"):
                    file_extension = ".fastq"

                with tempfile.NamedTemporaryFile(
                    mode="wb",
                    delete=False,
                    suffix=file_extension,
                ) as tmp_file:
                    temp_file_path = tmp_file.name

                    if isinstance(content, str):
                        tmp_file.write(content.encode("utf-8"))
                    else:
                        tmp_file.write(content)

                    tmp_file.flush()
                    written_size = tmp_file.tell()

                fr = self._process_fastq_file(fname, temp_file_path, written_size)
                file_results.append(fr)

                if fr["pass"]:
                    valid_file_count += 1

                os.unlink(temp_file_path)

        node_pass = valid_file_count == len(file_results) and valid_file_count > 0
        node_warnings_present = any(fr["warnings"] for fr in file_results)

        return {
            "node_pass": node_pass,
            "warnings_present": node_warnings_present,
            "valid_file_count": valid_file_count,
            "invalid_file_count": 0 if node_pass else (len(file_results) - valid_file_count),
            "files": file_results,
            "node_id": node_id,
        }


class FastqAggregator(StarAggregator):
    """Aggregator that combines QC results across nodes."""

    def __init__(self, flame):  # type: ignore[no-untyped-def]
        super().__init__(flame)

    def aggregation_method(self, analysis_results: List[Dict[str, Any]]) -> str:  # noqa: D401
        overall_pass = all(r["node_pass"] for r in analysis_results)
        overall_total = sum(r["valid_file_count"] for r in analysis_results)
        failed_nodes = [r["node_id"] for r in analysis_results if not r["node_pass"]]
        warnings_present = any(r["warnings_present"] for r in analysis_results)

        result = {
            "overall_pass": overall_pass,
            "warnings_present": warnings_present,
            "overall_total": overall_total,
            "failed_nodes": failed_nodes,
            "nodes": analysis_results,
        }

        return json.dumps(result)

    def has_converged(self, result, last_result, num_iterations):  # type: ignore[no-untyped-def]
        return True  # Single pass QC


def main():
    # Configure StarModel for S3/MinIO objects. The dataset configuration in each node's hub
    # should point to the desired bucket; here we only specify the object keys.
    StarModel(
        analyzer=FastqAnalyzer,
        aggregator=FastqAggregator,
        data_type="s3",
        query=FASTQ_S3_KEYS,
        simple_analysis=True,
        output_type="str",
    )


if __name__ == "__main__":  # pragma: no cover
    main()
