# FAQs as User. Proposals & Analysis 

### How do I get started as a User on FLAME?
1. Request Access: Contact the Hub administrator to be added to a Realm.
2. Receive Credentials: The assigned Admin of your organisation will get a login credentials for the Hub UI and provide you the necessary rights to login in the Hub.
3. Log In: Navigate to the Hub UI and log in with your credentials.
4. Explore Projects: Browse available projects and proposals in your Realm.
5. Submit Analysis Request: If approved, you can create an analysis for a project.
6. Write Your Code: Develop your analysis using the [FLAME Python SDK](https://github.com/PrivateAIM/python-sdk.git) as base for your entrypoint.
7. Test Locally: Test your analysis code locally before submitting to FLAME.
8. Submit for Review: Submit your script analysis to the Hub for node administrator approval.
9. Request your Node admin to set up a data store according to your analysis.
10. Monitor Execution: Once approved, execute your analysis across participating nodes.

### What is a Proposal in FLAME?
A proposal in FLAME defines a research initiative involving multiple organizations or nodes. It includes project metadata (title, description, objectives), specifies participating nodes/hospitals, and acts as a container for analyses. Approval from node administrators is required before running analyses, enabling federated analysis across institutions on the same dataset questions.

### How do I submit a project proposal?
Create a proposal via Hub UI, specifying participants and details, then await administrative approval.

### How do I write and code an analysis?
To write an analysis for FLAME, use the STAR pattern (Secure Training And Aggregation for Research)
For more details, check [Analysis Coding](https://docs.privateaim.net/guide/user/analysis-coding.html) section of this documentation.

### Can I test my analysis locally before running it on FLAME?
Yes, Use the `StarModelTester` for local testing before deployment.
For further information, check [local-testing](https://docs.privateaim.net/guide/user/local-testing.html). 

### What coding examples are available?
Yes, though the documentation you will find examples suck like [run-your-first-analysis](https://docs.privateaim.net/guide/user/run-your-first-analysis.html)
and further **examples** in the [Analysis Coding](https://docs.privateaim.net/guide/user/analysis-coding.html) section of this documentation.

