# Analysis
::: warning Important
Prerequisites
Before creating a new analysis, ensure that at least one proposal has been created within your organization.
If not, create a proposal first [here](./project).

This guide serves as an MVP (Minimum Viable Product) and “Hello World” example for developers testing the FLAME platform.
It is intended for basic functionality testing and initial exploration. A more comprehensive and detailed guide will be
available soon, covering all aspects of the platform in depth.
:::

## Creating an Analysis
1. **Navigate to Analysis**: In the Home section, select Analysis from the left-hand menu. You’ll arrive at the Outgoing page.
2. **Initiate Creation**: Click the **Create** button to access the Analysis Wizard for defining all aspects of your analysis.
3. **Submit analysis**: Analysis Wizard
### Key Steps:
- Name: Optionally provide a title for your analysis.
- Description: Optionally provide a description of for your analysis.
- Projects: Select the proposal that the analysis is linked to (only one can be chosen).
- Image Selection: Define the master image group and select the appropriate image (e.g., Python base, ML, etc.).
- Node Selection: Choose the nodes where the analysis will be executed.
- Upload: Upload the analysis code files. You can upload a single file or an entire directory.
- Files: Ensure you select the appropriate entry point file.

3. **Lock Analysis**: Lock the analysis pipeline to proceed to the next step.
4. **Build Analysis**: The analysis pipeline is then built and distributed across the selected nodes.
[![image](/images/ui_images/hub_add_analysis_from_proposal.png)](/images/ui_images/hub_add_analysis_from_proposal.png)

## Approval 
Before the analysis can be built and executed, it must be approved by the nodes you selected during setup.
Refer to the [Admin Guide](../admin/analysis-review) for detailed information on the approval process.

## Execution
Once approved, the analysis is ready for execution:

Node Execution
Each node administrator must manually start the analysis via the node UI. For more details, consult the [Node Guide](../admin/analysis-execution).

## Download Results
Once all nodes have completed the analysis, click the Download button under the Results section to retrieve the results as a tar file.
