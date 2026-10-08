# Introduction

The [PrivateAIM project](https://privateaim.de/eng/project.html), a pivotal initiative within the framework of the
[Medical Informatics Initiative (MII)](https://www.medizininformatik-initiative.de/de/start)  in Germany,
represents a groundbreaking endeavor in the realm of healthcare data analysis. Focusing on secure distributed analysis
of
medical data, PrivateAIM brings together expertise
from [various German university hospitals](https://privateaim.de/eng/team.html)
and partners to address the critical need for privacy-enhanced technologies in medical research. By leveraging
state-of-the-art privacy-preserving methods, PrivateAIM enables collaborative data analysis while ensuring the
confidentiality
of sensitive medical information. Through this project, researchers and healthcare professionals gain access to a
powerful
platform that not only facilitates distributed learning but also upholds the highest standards of data privacy and
security.
With its innovative approach, PrivateAIM is poised to drive significant advancements in medical research and ultimately
improve patient care outcomes.


## FLAME at a Glance

FLAME (Federated Learning and Analysis in Medicine) is the platform developed by PrivateAIM. It lets researchers
analyze medical data from several institutions without the data ever leaving them.

* **The data stays where it is.** Every participating site runs a *Node* next to its own data. Instead of collecting
  data centrally, FLAME sends the analysis code to the data.
* **A central Hub coordinates.** Researchers create projects, submit analyses and download results in the *Hub*. The
  Hub never has access to patient data.
* **Sites keep control.** Every site decides whether it takes part in a project, reviews the analysis code before it
  runs, and starts the execution itself.
* **Only aggregated results are returned.** The results of the sites are combined by an aggregator, and only this
  combined result is made available to the researcher.

How these parts work together is explained in the [Architecture](./architecture).

### What you can do with FLAME

* Run descriptive statistics and cohort counts across sites, on FHIR data or on files such as CSV or VCF.
* Train machine learning models with federated learning over several rounds.
* Use privacy-enhancing techniques such as local differential privacy.
* Bring your own Python analysis, built on the FLAME SDK and a master image with your dependencies.

### Where to start

| You are | You want to | Start here |
|---|---|---|
| a researcher or analyst | run an analysis on data of several sites | [User guide](../guide/user/index) |
| a node or realm administrator | manage users, review projects and analyses, provide data | [Admin guide](../guide/admin/index) |
| an operator | install a Hub or a Node | [Deployment guide](../guide/deployment/index) |
| new to the terminology | look up a term | [Glossary](./glossar) |

Common questions are answered in the [FAQs](../guide/faqs/faqs-of-getting-started).

[//]: # ([![Overview]&#40;/images/process_images/pht_services.png&#41;]&#40;/images/process_images/pht_services.png&#41;)

## Mission Statement

At PrivateAIM, our platform FLAME (Federated Learning and Analysis in Medicine) is rooted in our team's rich expertise
and experience,
which bring together the best components from existing distributed learning platforms to create innovative new software
solutions.
Drawing from experiences in established platforms, we merge the most compelling features and functionalities to build a
next-generation platform for secure distributed medical data analysis. This fusion of proven technologies enables us to
deliver
a robust and versatile solution that addresses the evolving needs of healthcare research and data analysis.
Furthermore, our alignment with the [MII](https://www.medizininformatik-initiative.de/de/start)
and [DIC](https://www.medizininformatik-initiative.de/de/konsortien/datenintegrationszentren) standards
underscores our dedication
to [interoperability and data exchange](https://www.medizininformatik-initiative.de/en/medical-informatics-initiatives-core-data-set)
within the healthcare ecosystem. By leveraging the strengths of existing platforms and integrating them into our
platform,
we facilitate FLAME's seamless integration with existing healthcare infrastructure and ensure compliance with industry
best practices.
We provide users with an intuitive experience while driving progress in medical research and data privacy.

## Security

FLAME protects the data of the participating sites on several levels:

* **Data locality:** patient data is never transferred to the Hub or to other sites.
* **Code review:** an analysis is only built and executed after every participating node has approved its code.
* **Isolation:** every analysis runs in its own container without internet access, and can only reach the data stores
  of its own project.
* **Encryption:** all connections use TLS. Messages and intermediate results exchanged between nodes are additionally
  encrypted end to end.
* **Access control:** users, roles and permissions are managed per organization. Starting an analysis and configuring
  data stores is reserved for the staff of the site.

The technical details are documented in [Security & Operations](../guide/deployment/node-security).

## Terms of Use

Copyright 2023-2025 PrivateAim Consortia

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

https://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
