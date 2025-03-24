import{_ as t,c as a,a0 as o,o as r}from"./chunks/framework.BGabeMLJ.js";const n="/images/node_ui_images/data_store_creator.png",s="/images/node_ui_images/datastore_manager.png",m=JSON.parse('{"title":"Data Store Management","description":"","frontmatter":{},"headers":[],"relativePath":"guide/admin/data-store-management.md","filePath":"guide/admin/data-store-management.md"}'),i={name:"guide/admin/data-store-management.md"};function d(l,e,c,h,p,u){return r(),a("div",null,e[0]||(e[0]=[o('<h1 id="data-store-management" tabindex="-1">Data Store Management <a class="header-anchor" href="#data-store-management" aria-label="Permalink to &quot;Data Store Management&quot;">​</a></h1><p>Before an analysis can be run, its associated project must be allowed to access the required data at the institution. To achieve this, administrators can create <strong>data stores</strong>. These are the configuration settings that map individual projects to the directories containing the requested data on the organization&#39;s servers.</p><h2 id="creating-a-data-store" tabindex="-1">Creating a Data Store <a class="header-anchor" href="#creating-a-data-store" aria-label="Permalink to &quot;Creating a Data Store&quot;">​</a></h2><p>Navigate to the Data Store Creation tool by clicking on &quot;Data Stores&quot; -&gt; &quot;Create&quot; in the menu bar at the top of the page. You should see a partially filled out table:</p><p><a href="/images/node_ui_images/data_store_creator.png"><img src="'+n+'" alt="Data Store Creator"></a></p><p>Simply fill out the required information in the table and click &quot;Submit&quot; under the table. If everything worked correctly, a blue box will appear in the top right of the page indicating a data store was successfully created. If not, then please verify the provided values in tables or contact support for help.</p><p>A description of the fields in the table can be found below.</p><h3 id="field-descriptions" tabindex="-1">Field Descriptions <a class="header-anchor" href="#field-descriptions" aria-label="Permalink to &quot;Field Descriptions&quot;">​</a></h3><table tabindex="0"><thead><tr><th><strong>Field</strong></th><th><strong>Description</strong></th></tr></thead><tbody><tr><td>Project</td><td>Select from the currently approved list of projects for your node</td></tr><tr><td>Data Store</td><td>This field is automatically populated using the UUID of the selected project. This identifier is used as the name of the data store when it is created in the node software</td></tr><tr><td>Server</td><td>Name of the server on which the data is located</td></tr><tr><td>Data Path</td><td>The absolute directory path where the requested data is located</td></tr><tr><td>Data Store Type</td><td>Type of repository in which the data is stored. Currrently, only FHIR and S3 are supported</td></tr><tr><td>Port</td><td>Connection endpoint for accessing the server. Use 80 for HTTP and 443 for HTTPS. If a different protocol is used, please verify which port is accessible</td></tr><tr><td>Protocol</td><td>Protocol used for transferring files</td></tr><tr><td>Allowed Methods</td><td>Allowed methods for interacting with the data. Unless needed, this should be restricted to only <code>GET</code></td></tr></tbody></table><h2 id="managing-data-access" tabindex="-1">Managing Data Access <a class="header-anchor" href="#managing-data-access" aria-label="Permalink to &quot;Managing Data Access&quot;">​</a></h2><p>If a project is no longer approved, valid, or has been terminated, then the associated data stores should be removed. The Node UI provides an interface for both disconnecting individual analyses from accessing the requested data and permanently deleting data stores.</p><p>To manage previously created data stores as well as analysis data access, navigate to the Data Store Management page by clicking on &quot;Data Stores&quot; -&gt; &quot;Manage&quot; in the menu bar at the top of the Node UI. Here, 3 tabs will be visible: <a href="#managing-a-data-store">Data Store Overview</a>, <a href="#disconnecting-an-analysis">Analysis Overview</a>, and Data Store Tree Table. Each of these tabs provide a tabular description of the current data stores, analyses with data access, and an interactive overview of how the data stores, projects, and analyses of connected, respectively.</p><h3 id="managing-a-data-store" tabindex="-1">Managing a Data Store <a class="header-anchor" href="#managing-a-data-store" aria-label="Permalink to &quot;Managing a Data Store&quot;">​</a></h3><p>The &quot;Data Store Overview&quot; tab shows a table listing the previously created data stores. The columns describe the same fields used during creation (see <a href="#field-descriptions">Field Descriptions</a>).</p><p><a href="/images/node_ui_images/datastore_manager.png"><img src="'+s+'" alt="Data Store Manager"></a></p><h4 id="deleting-a-data-store" tabindex="-1">Deleting a Data Store <a class="header-anchor" href="#deleting-a-data-store" aria-label="Permalink to &quot;Deleting a Data Store&quot;">​</a></h4><p>The final column has a button for deleting the data store in that row. Simply click the button and confirm that you want to delete the data store to remove any reference of it.</p><div class="warning custom-block"><p class="custom-block-title">Stop the Analyses</p><p>Deleting a data store also disconnects all analyses for the associated project from the data. Be sure the analyses have either all run to completion or the users have been notified.</p></div><h3 id="disconnecting-an-analysis" tabindex="-1">Disconnecting an Analysis <a class="header-anchor" href="#disconnecting-an-analysis" aria-label="Permalink to &quot;Disconnecting an Analysis&quot;">​</a></h3><p>Though stopped and deleted analysis containers automatically delete their links to the needed data stores, sometimes errors occur during this process and the analysis link needs to be manually deleted. Similar to how a data store is deleted, the admin must simply navigate to the &quot;Connected Analyses&quot; tab and click on the delete button in the last column of the analysis they wish to disconnect from data access. A notification of a successful disconnection will appear in the top right of the screen after confirmation.</p>',20)]))}const f=t(i,[["render",d]]);export{m as __pageData,f as default};
