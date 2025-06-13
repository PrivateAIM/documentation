# FHIR Overwiew
FHIR (Fast Healthcare Interoperability Resources) is a standard developed by HL7 designed to facilitate the exchange of
healthcare information electronically. It allows healthcare systems to share data efficiently and securely.
FHIR uses standard data formats and elements (known as “resources”) to represent clinical concepts, which can be accessed through RESTful APIs.


## MII Core Dataset
The MII (Medical Informatics Initiative) core dataset is a standardized dataset developed in Germany to improve the interoperability
of health data across institutions. It includes essential health information, such as demographics, diagnoses, and treatments,
ensuring consistent data use in healthcare and research. This dataset is aligned with FHIR standards, allowing for seamless
data integration and exchange across different systems.

## Application in FLAME
In the FLAME platform, FHIR queries enable users to extract specific data from the MII core dataset, leveraging the standardized structure
to conduct analyzes across multiple nodes while maintaining data security and privacy. This is crucial for distributed learning and research
in healthcare, allowing for the aggregation of data without compromising sensitive information.

### Example FHIR Query
In the example provided, the queries are designed to count patients based on specific conditions and birthdates.

	•	Patient?birthdate=ge1990-01-01&_has:Condition:subject:code=73595000
	•	Patient?birthdate=ge2010-01-01&_has:Condition:subject:code=73595000

These queries search for patients born after specified dates who have a specific condition identified by its code (73595000).


## Customizing FHIR Queries
You can customize FHIR queries to fit the specific needs of your analysis. These queries can filter data based on various patient attributes,
such as demographics, conditions, or encounters, allowing for flexible and targeted data retrieval across different healthcare datasets.

This allows analysts to perform precise and relevant analyzes while ensuring the privacy of patient data by processing it
in a federated manner across multiple nodes.
