# Node Settings

Some general node settings can be configured directly in the Node UI.
Click the **gear icon** in the top right corner to open the settings panel.

## Available Options

| **Setting** | **Description** |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Require Data Store** | Toggle to control whether an analysis requires a data store before it can be started. If enabled, analyses will remain in a waiting state until the corresponding data store is configured. |
| **Autostart Analyses** | Immediately start an analysis as soon as it is detected in the Hub for the current node. If a data store is required but not yet configured, the analysis will not be started. |
| **Autostart Interval** | How often (in seconds) the Hub is queried to check for new analyses. A lower value means faster detection of new analyses, but also more frequent communication with the Hub. |
