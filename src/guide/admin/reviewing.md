# Why is there a review?
Each site must independently approve or reject projects and individual analyses to fulfill the requirements of German
hospitals. You can automatically approve proposals or analyses if you have contracts or other trust delegations.

# What is there to review?
Before accepting a proposal or a analysis, the requested data and the code contained in a analysis need to be reviewed. While
removing network access and the built-in security features should be sufficient to prevent the transfer of input data,
the code still needs to be examined to prevent any undesirable behavior.

## Proposals
Proposals are the top level organizational unit of the FLAME platform and reflect a study or project.
Proposals describe the goal of an analysis, the requested data and an estimation of the potential risk of participation.
When the description of the proposal meets the local requirements of your node, a user with the role of
**node Authority** can accept the proposal, otherwise the proposal is rejected (optionally with comments for improvement).

Joining a proposal means that users of other nodes also joined the proposal can select your node as a
participant in the analysis they create for this proposal.

## Analysis
Analysis code that should be executed on the data requested in the proposal. The code is user submitted,
so while the security protocol prevents unencrypted data transfer via docker images and restricts network access,
the analysis code still needs to be reviewed to avoid malicious behavior.
