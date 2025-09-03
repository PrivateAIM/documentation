"""Basic VCF QC for FLAME federated analysis.

The analyzer expects a collection of objects (files) belonging to a folder/prefix.
Every object whose name ends with ``.vcf`` or ``.vcf.gz`` is considered a VCF file
subject to QC.

The filenames are reported to the aggregator. Make sure that they do not include any
sensitive information.
"""

from __future__ import annotations

import json
import tempfile
from typing import Any, Dict, List

from flame.star import StarModel, StarAnalyzer, StarAggregator

import pysam

__author__ = "Jules Kreuer, jules.kreuer@uni-tuebingen.de"
__version__ = "0.1.1"

# Set of S3 object keys to analyze; None means all objects in the configured bucket/prefix.
# The same keys are used on all node.
VCF_S3_KEYS: List[str] | None = None


class VCFAnalyzer(StarAnalyzer):
    """Analyzer that performs QC across all VCF files in a provided folder dataset.

    Expected data layout provided to ``analysis_method`` for S3 data_type:
        data[0] -> dict mapping each queried object key to its object body (bytes/str).
    """

    def __init__(self, flame):  # type: ignore[no-untyped-def]
        super().__init__(flame)

    def _process_vcf_file(self, fname: str, path: str, size_bytes: int) -> Dict[str, Any]:
        """Process a single VCF file and return its QC results."""

        fatal_reasons = []
        warning_reasons = []

        is_sorted = True
        prev_key = None
        variant_count = 0
        contigs = []
        samples = []
        header = None

        if size_bytes == 0:
            fatal_reasons.append("Empty file")

        else:
            try:
                with pysam.VariantFile(path, "r") as vf:  # type: ignore[name-defined]
                    header = vf.header
                    contigs = list(header.contigs)
                    samples = list(header.samples)
                    contig_order = {c: i for i, c in enumerate(contigs)}

                    for rec in vf:  # type: ignore[assignment]
                        c_idx = contig_order.get(rec.chrom, 10**9)
                        key = (c_idx, rec.pos)
                        if prev_key is not None and key < prev_key:
                            is_sorted = False
                        prev_key = key
                        variant_count += 1

            except Exception as e:
                # We do not want to leak potential private information that may be included in the error.
                # Therefore, we catch all exceptions and report a generic error message.
                fatal_reasons.append("OpenError:ValueError:invalid header")

        # Fatal conditions:
        if header is None or not (hasattr(header, "version") and header.version is not None):
            fatal_reasons.append("No fileformat")
        if variant_count == 0:
            fatal_reasons.append("Zero variants")

        # Warning conditions:
        if not contigs:
            warning_reasons.append("No contigs")
        if not is_sorted:
            warning_reasons.append("Unsorted")

        passed = not fatal_reasons
        warnings_flag = bool(warning_reasons)

        reason_list = []
        reason_list.extend([f"FATAL: {fr}" for fr in fatal_reasons])
        reason_list.extend([f"WARN: {wr}" for wr in warning_reasons])
        reason = "; ".join(reason_list)

        fr = {
            "file": fname,
            "size_bytes": size_bytes,
            "pass": passed,
            "warnings": warnings_flag,
            "reason": reason,
            "contig_count": len(contigs),
            "sample_count": len(samples),
            "variant_count": variant_count,
        }

        return fr

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
                "reason": "No objects supplied",
                "valid_file_count": 0,
                "invalid_file_count": 0,
                "files": [],
                "node_id": node_id,
            }

        file_results: List[Dict[str, Any]] = []
        valid_file_count = 0
        for objects in data:
            for fname, content in objects.items():
                if not fname.endswith((".vcf", ".vcf.gz")):
                    continue

                with tempfile.NamedTemporaryFile(mode="wb") as tmp_file:
                    if isinstance(content, str):
                        tmp_file.write(content.encode("utf-8"))
                    else:
                        tmp_file.write(content)

                    # Ensure data is flushed to disk so that size lookups/opening via a new
                    # file descriptor (pysam.VariantFile) see the written bytes.
                    tmp_file.flush()
                    written_size = tmp_file.tell()
                    fr = self._process_vcf_file(fname, tmp_file.name, written_size)
                    file_results.append(fr)

                    if fr["pass"]:
                        valid_file_count += 1

        invalid_file_count = len(file_results) - valid_file_count
        node_pass = invalid_file_count == 0 and valid_file_count > 0
        node_warnings_present = any(fr.get("warnings") for fr in file_results)

        return {
            "node_pass": node_pass,
            "warnings_present": node_warnings_present,
            "valid_file_count": valid_file_count,
            "invalid_file_count": invalid_file_count,
            "files": file_results,
            "node_id": node_id,
        }


class VCFAggregator(StarAggregator):
    """Aggregator that combines QC results across nodes."""

    def __init__(self, flame):  # type: ignore[no-untyped-def]
        super().__init__(flame)

    def aggregation_method(self, analysis_results: List[Dict[str, Any]]) -> str:  # noqa: D401
        overall_pass = all(r["node_pass"] for r in analysis_results)
        overall_total = sum(r["valid_file_count"] for r in analysis_results)
        warnings_present = any(r.get("warnings_present") for r in analysis_results)
        failed_nodes = [r["node_id"] for r in analysis_results if not r["node_pass"]]

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
        analyzer=VCFAnalyzer,
        aggregator=VCFAggregator,
        data_type="s3",
        query=VCF_S3_KEYS,
        simple_analysis=True,
        output_type="str",
    )


if __name__ == "__main__":  # pragma: no cover
    main()
