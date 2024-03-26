import{_ as i,c as s,o as a,a8 as t,aB as n,aC as e,aD as h,aE as l,aF as o,aG as r}from"./chunks/framework.D4CiWSAs.js";const q=JSON.parse('{"title":"Train Execution","description":"","frontmatter":{},"headers":[],"relativePath":"guide/admin/train-execution.md","filePath":"guide/admin/train-execution.md"}'),p={name:"guide/admin/train-execution.md"},k=t('<h1 id="train-execution" tabindex="-1">Train Execution <a class="header-anchor" href="#train-execution" aria-label="Permalink to &quot;Train Execution&quot;">​</a></h1><p>Trains and other station tasks are executed via airflow DAGs. The DAGs can be triggered via the airflow web interface, which is available under port <code>:8080</code> on the station machine. The execution of the DAGs can also be monitored in the webinterface.</p><h2 id="login" tabindex="-1">Login <a class="header-anchor" href="#login" aria-label="Permalink to &quot;Login&quot;">​</a></h2><p>The first time you access the webinterface you will be prompted to log in. Enter the credentials set in the <code>.env</code> file to login as admin. Or use the credentials that you have obtained from the station administrator.</p><p><a href="/images/station_images/airflow_login.png"><img src="'+n+'" alt="image"></a></p><h2 id="test-dag" tabindex="-1">Test DAG <a class="header-anchor" href="#test-dag" aria-label="Permalink to &quot;Test DAG&quot;">​</a></h2><p>To test the configuration of the station as defined in the <code>.env</code> file, trigger the DAG named <code>test_station_configuration</code> in the user interface.<br> A DAG is triggered in the UI by clicking on the <strong>play</strong> button, where it can be started either with or without a json file containing additional configuration for the DAG run.</p><p><a href="/images/station_images/airflow_ui.png"><img src="'+e+'" alt="image"></a></p><p>Trigger the DAG without any additional configuration to check if the station is properly configured. A notification should appear in the UI that the DAG has been triggered.</p><p>To monitor the execution click on the name of the DAG. You should see the individual tasks contained in the DAG as well as their status in the UI. If all tasks are marked as success, the station is properly configured and can connect to harbor as well as a FHIR server.</p><p>!!! warning If you did not provide any FHIR_Server configurations in the .env-file, then this Trigger will fail, because this test will try to connect to the FHIR_server. All the nodes will be marked as red or orange except the &quot;get_dag_config&quot;</p><p><a href="/images/station_images/test_config_dag.png"><img src="'+h+'" alt="image"></a></p><h2 id="logs" tabindex="-1">Logs <a class="header-anchor" href="#logs" aria-label="Permalink to &quot;Logs&quot;">​</a></h2><p>The logs stored during the execution of a DAG can be accessed for each individual task by clicking the colored,squared/circled - indicator next to the name of the task. In the new pop-up window you can see in the top a list of options. There you can pick <strong>Log</strong> to view the Log of this task.</p><p><a href="/images/station_images/task_logs.png"><img src="'+l+'" alt="image"></a></p><p>If there are any errors stacktraces can be found in these logs, as well as any other output of the tasks (stdout, stderr)</p><p><a href="/images/station_images/task_log_details.png"><img src="'+o+`" alt="image"></a></p><h2 id="run-train" tabindex="-1">Run Train <a class="header-anchor" href="#run-train" aria-label="Permalink to &quot;Run Train&quot;">​</a></h2><p>To execute a train that is available for your station, trigger the <code>run_train</code> DAG, with configuration options specifying the train image to be pulled from harbor and executed as well as additional environment variables or volumes. A template train configuration is displayed below.</p><div class="language-json vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">json</span><pre class="shiki shiki-themes github-light github-dark vp-code"><code><span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">{</span></span>
<span class="line"><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">  &quot;repository&quot;</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">: </span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;">&quot;&lt;HARBOR-REGISTRY&gt;/&lt;STATION_NAMESPACE&gt;/&lt;TRAIN-IMAGE&gt;&quot;</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">,</span></span>
<span class="line"><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">  &quot;tag&quot;</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">: </span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;">&quot;latest&quot;</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">,</span></span>
<span class="line"><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">  &quot;env&quot;</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">: {</span></span>
<span class="line"><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">    &quot;FHIR_SERVER_URL&quot;</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">: </span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;">&quot;&lt;FHIR-ADDRESS&gt;&quot;</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">,</span></span>
<span class="line"><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">    &quot;FHIR_USER&quot;</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">: </span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;">&quot;&lt;ID&gt;&quot;</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">,</span></span>
<span class="line"><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">    &quot;FHIR_PW&quot;</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">: </span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;">&quot;&lt;PSW&gt;&quot;</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">  }</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">}</span></span></code></pre></div><p>Replace the placeholders with the values of the train image to execute, and other variables with the values corresponding to the stations configuration and paste it into the configuration form shown in the following image.</p><p><a href="/images/station_images/trigger_run_train.png"><img src="`+r+`" alt="image"></a></p><h3 id="running-a-train-with-volume-data" tabindex="-1">Running a train with volume data <a class="header-anchor" href="#running-a-train-with-volume-data" aria-label="Permalink to &quot;Running a train with volume data&quot;">​</a></h3><p>Volume data (any data other than the data stored in the FHIR server) is made available to the train as read only volume mounts. This mount needs to specified in the configuration of the DAG when it is started. The path to which the volume must be mounted is specified in the train.</p><div class="language-json vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">json</span><pre class="shiki shiki-themes github-light github-dark vp-code"><code><span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">{</span></span>
<span class="line"><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">  &quot;repository&quot;</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">: </span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;">&quot;&lt;HARBOR-REGISTRY&gt;/&lt;STATION_NAMESPACE&gt;/&lt;TRAIN-ID&gt;&quot;</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">,</span></span>
<span class="line"><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">  &quot;tag&quot;</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">: </span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;">&quot;latest&quot;</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">,</span></span>
<span class="line"><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">  &quot;volumes&quot;</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">: {</span></span>
<span class="line"><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">    &quot;&lt;Absolute path on station vm&gt;&quot;</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">: {</span></span>
<span class="line"><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">      &quot;bind&quot;</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">: </span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;">&quot;&lt;Mount target in train container&gt;&quot;</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">,</span></span>
<span class="line"><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">      &quot;mode&quot;</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">: </span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;">&quot;ro&quot;</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">    }</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">  }</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">}</span></span></code></pre></div><h3 id="running-a-train-with-gpu-support" tabindex="-1">Running a train with GPU support <a class="header-anchor" href="#running-a-train-with-gpu-support" aria-label="Permalink to &quot;Running a train with GPU support&quot;">​</a></h3><p>A train container can be configured to use the GPU of the station VM. The use of gpu resources requires the <a href="https://github.com/NVIDIA/nvidia-docker" target="_blank" rel="noreferrer">nvidia container runtime</a> to be installed.</p><p>Follow these <a href="https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/install-guide.html#docker" target="_blank" rel="noreferrer">instructions</a> to install the nvidia container runtime for docker. Check if the nvidia container runtime is installed and usable by containers by running the following command:</p><div class="language-shell vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">shell</span><pre class="shiki shiki-themes github-light github-dark vp-code"><code><span class="line"><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">sudo</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> docker</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> run</span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;"> --rm</span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;"> --gpus</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> all</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> nvidia/cuda:11.0.3-base-ubuntu20.04</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> nvidia-smi</span></span></code></pre></div><p>If the command runs successfully, gpu resource can be configured for the train container by adding the following configuration options to the DAG configuration:</p><ol><li><p>Use all available GPUs on the station VM:</p><div class="language-json vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">json</span><pre class="shiki shiki-themes github-light github-dark vp-code"><code><span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">{</span></span>
<span class="line"><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">  &quot;repository&quot;</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">: </span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;">&quot;&lt;HARBOR-REGISTRY&gt;/&lt;STATION_NAMESPACE&gt;/&lt;TRAIN-ID&gt;&quot;</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">,</span></span>
<span class="line"><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">  &quot;tag&quot;</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">: </span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;">&quot;latest&quot;</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">,</span></span>
<span class="line"><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">  &quot;gpus&quot;</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">: </span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;">&quot;all&quot;</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">}</span></span></code></pre></div></li><li><p>Use a selection of gpus identified by their ids:</p><div class="language-json vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">json</span><pre class="shiki shiki-themes github-light github-dark vp-code"><code><span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">{</span></span>
<span class="line"><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">  &quot;repository&quot;</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">: </span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;">&quot;&lt;HARBOR-REGISTRY&gt;/&lt;STATION_NAMESPACE&gt;/&lt;TRAIN-ID&gt;&quot;</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">,</span></span>
<span class="line"><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">  &quot;tag&quot;</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">: </span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;">&quot;latest&quot;</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">,</span></span>
<span class="line"><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">  &quot;gpus&quot;</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">: [</span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">0</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">, </span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">1</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">]</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">}</span></span></code></pre></div></li></ol>`,31),d=[k];function g(u,c,E,y,F,m){return a(),s("div",null,d)}const C=i(p,[["render",g]]);export{q as __pageData,C as default};