import{_ as e,c as a,o as t,a8 as n,a9 as s,aa as i,ab as o,ac as r,ad as l,ae as h}from"./chunks/framework.D7NPx0id.js";const v=JSON.parse('{"title":"Analysis Execution","description":"","frontmatter":{},"headers":[],"relativePath":"guide/admin/analysis-execution.md","filePath":"guide/admin/analysis-execution.md"}'),c={name:"guide/admin/analysis-execution.md"},d=n('<h1 id="analysis-execution" tabindex="-1">Analysis Execution <a class="header-anchor" href="#analysis-execution" aria-label="Permalink to &quot;Analysis Execution&quot;">​</a></h1><p>One of the primary functions of the Node UI is to allow admins to control the analyses running on their node. This page describes the different features in the Node UI for managing and interacting with the analysis containers.</p><p>To see the statuses of the approved analyses for your node, click the &quot;Analyses&quot; button in the menu bar at the top of the Node UI after logging in.</p><h2 id="table-overview" tabindex="-1">Table Overview <a class="header-anchor" href="#table-overview" aria-label="Permalink to &quot;Table Overview&quot;">​</a></h2><p>The analysis table provides an overview of all the approved analyses on your node as well as display their current states in the &quot;Run Status&quot; column. The columns have the table have various options for sorting the entries including being able to filter by certain categorical variables in addition to ordering by name or date.</p><div class="info custom-block"><p class="custom-block-title">Detailed Dates</p><p>Hovering your mouse cursor over a date with show the exact date and time</p></div><p>The search bar above the table allows the admin to quickly search for specific analyses using keywords or identifiers. Additionally, to get the latest entries without refreshing the whole page, simply click the white &quot;refresh&quot; button above the table on the right side of the page.</p><p><a href="/images/node_ui_images/analysis_table.png"><img src="'+s+'" alt="analysis table overview"></a></p><h2 id="controlling-an-analysis-run" tabindex="-1">Controlling an Analysis Run <a class="header-anchor" href="#controlling-an-analysis-run" aria-label="Permalink to &quot;Controlling an Analysis Run&quot;">​</a></h2><p>Managing an analysis run can be done using the buttons in the last column of the table. Before an analysis can be started, a data store needs to be created for the associated project. See <a href="/guide/admin/data-store-management.html">Managing Data Stores</a> for more information on how to do this.</p><h3 id="starting-an-analysis-run" tabindex="-1">Starting an Analysis Run <a class="header-anchor" href="#starting-an-analysis-run" aria-label="Permalink to &quot;Starting an Analysis Run&quot;">​</a></h3><p><a href="/images/node_ui_images/analysis_start.png"><img src="'+i+'" alt="Analysis Start Button" width="40"></a></p><p>The green play button is used to start an analysis. This button will only be enabled if the image for the analysis was configured and built as explained in <a href="/guide/user/analysis.html">Analysis</a>. The administrator can see the status of the image compilation in the &quot;Build Status&quot; column of the analysis. By pressing the start button, the admin will create a new container on their node, pull the analysis image, and begin the run.</p><div class="info custom-block"><p class="custom-block-title">Analysis Data Access</p><p>As long as a data store was created for the analysis&#39;s project, by pressing the &quot;Start&quot; button, the node software will automatically configure everything in the backend to enable the container to access the requested data.</p></div><h3 id="stopping-an-analysis-run" tabindex="-1">Stopping an Analysis Run <a class="header-anchor" href="#stopping-an-analysis-run" aria-label="Permalink to &quot;Stopping an Analysis Run&quot;">​</a></h3><p><a href="/images/node_ui_images/analysis_stop.png"><img src="'+o+'" alt="Analysis Stop Button" width="40"></a></p><p>During an analysis run, a node admin may want to halt an analysis container manually. Once an analysis is started, the yellow stop button will be enabled and can be used to prematurely stop the container. After stopping the run, the green play button will change to indicate that the admin can rerun the analysis if they choose.</p><p>Analyses that have run to completion will enter this &quot;stopped&quot; state by default.</p><h3 id="deleting-an-analysis-run" tabindex="-1">Deleting an Analysis Run <a class="header-anchor" href="#deleting-an-analysis-run" aria-label="Permalink to &quot;Deleting an Analysis Run&quot;">​</a></h3><p><a href="/images/node_ui_images/analysis_delete.png"><img src="'+r+'" alt="Analysis Delete Button" width="40"></a></p><p>In order to permanently remove the analysis container from the node cluster, the admin can click on the red delete button when it becomes activated after starting the analysis. This action also deletes the data access configuration for the individual analysis.</p><h3 id="viewing-the-analysis-logs" tabindex="-1">Viewing the Analysis Logs <a class="header-anchor" href="#viewing-the-analysis-logs" aria-label="Permalink to &quot;Viewing the Analysis Logs&quot;">​</a></h3><p><a href="/images/node_ui_images/analysis_logs.png"><img src="'+l+'" alt="Analysis Logs Button" width="40"></a></p><p>Once an analysis is started, administrators can view the logs for the associated containers. By default, two containers are created for each analysis: one container running the analysis image itself and a nginx container used for sending canned messages to the message broker service to let other nodes know about the current status. When the admin clicks on the white logs button, a new tab will open showing the logs for both of these containers.</p><p><a href="/images/node_ui_images/logs_page.png"><img src="'+h+'" alt="Example Analysis Logs"></a></p><p>The logs on this page are retrieved directly from the containers, and if the administrator wishes to stream the logs, they can press the &quot;Refresh periodically&quot; toggle in the top right of the page in order to refresh the logs every 5 seconds.</p><div class="info custom-block"><p class="custom-block-title">Past Runs</p><p>If the analysis was run prior or restarted, logs from the previously created containers will be available at the bottom of this page.</p></div>',27),u=[d];function g(p,y,m,f,b,_){return t(),a("div",null,u)}const q=e(c,[["render",g]]);export{v as __pageData,q as default};