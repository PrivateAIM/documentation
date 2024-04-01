# Analysis Coding
::: warning Info
This section is under construction and the example does not run.
:::
This example can be used as `entrypoint.py`, which is referenced in this documentation.

### Example Analysis

#### Calculate average age based on a FHIR query
The query to be used in this analysis is the JSON version of the minimal example found in the next section.
What this analysis will do ist calculate the average age of patients matching the query across multiple nodes.  
The nodes will pass the query results to the aggregator.

```python
import flame_api
import asyncio
from fhirpy import AsyncFHIRClient

async def main():
    fhir_url = flame_api.source(“fhir”)
    client = AsyncFHIRClient(fhir_url)
    patients = client.resources(“Patient”)
    print(await patients.count())

if __name__ == “__main__”:
    loop = asyncio.get_event_loop()
    loop.run_until_complete(main())



```






