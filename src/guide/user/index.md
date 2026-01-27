# User Guide

::: warning Important
This guide serves as an MVP (Minimum Viable Product) and “Hello World” example for developers testing the FLAME
platform.
It is intended for basic functionality testing and initial exploration. A more comprehensive and detailed guide will be
available soon, covering all aspects of the platform in depth.
:::

## Introduction

This guide is designed for analysts and users seeking to leverage FLAME for secure medical data analysis.
To begin, contact us for access to the FLAME hub testing interface via Discord.

FLAME enables users to safely access and analyze medical data without transferring sensitive information outside their
organization.
Analysts can create a “Proposal” within our MVP to request access to a testing dataset.
Upon approval, analysis scripts are executed on local nodes. Results are returned to the analyst, maintaining the
integrity of the original data.

## Overview

**`SDK Documentaion`**

- [FLAME Core SDK](/guide/user/sdk-core-doc)

**`Concepts/Tutorials`**

- [Coding an Analysis](/guide/user/analysis-coding)
  - Example Analyses
    - [Aggregation with fedstats](/guide/user/coding_examples/survival-regression)
    - [Basic VCF Quality Control using Python](/guide/user/coding_examples/vcf-qc)
    - [Using CLI Tools for Federated FASTQ QC](/guide/user/coding_examples/cli-fastqc)
    - [Image classification using deep learning approaches](/guide/user/coding_examples/deep-learning-image-classifier)
    - [Utilizing Differential Privacy for Privacy Enhancement](/guide/user/coding_examples/differential-privacy-mvp)
    - [Training a Federated Generalized Linear Model (GLM) from the Fedstat library](/guide/user/coding_examples/fedstats-logistic-regression)
    - [Federated Logistic Regression classifier for Pancreatic Cancer Data](/guide/user/coding_examples/federated-logistic-regression)
    - [Analysing text-formatted clinical data with GeMTeX](/guide/user/coding_examples/gemtex-text-score-example)
    - [Connecting patient records across clinical sites with Privacy-Preserving Record Linkage (PPRL)](/guide/user/coding_examples/record_linkage)
- [Local Analysis Testing](/guide/user/local-testing)
  - Local Testing Examples
    - [Federated Logistic Regression classifier for Pancreatic Cancer Data](/guide/user/testing_examples/local-testing-logistic-regression-example)
    - [Utilizing Differential Privacy for Privacy Enhancement](/guide/user/testing_examples/local-testing-dp-example)
- [FHIR Queries](/guide/user/fhir-query)

**`Using the Hub`**

- [Submitting a Project Proposal](/guide/user/project)
- [Starting an Analysis](/guide/user/analysis)
