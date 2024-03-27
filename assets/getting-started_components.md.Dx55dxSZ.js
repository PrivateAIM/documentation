import{_ as t,c as e,o as r,a8 as a}from"./chunks/framework.DXyIX5iy.js";const b=JSON.parse('{"title":"Components","description":"","frontmatter":{},"headers":[],"relativePath":"getting-started/components.md","filePath":"getting-started/components.md"}'),l={name:"getting-started/components.md"},n=a('<h1 id="components" tabindex="-1">Components <a class="header-anchor" href="#components" aria-label="Permalink to &quot;Components&quot;">​</a></h1><p>Several Git repositories contain the components of the FLAME. Third party components can be found on the respective manufacturer&#39;s site. These components can be roughly separated into the following categories:</p><ul><li>Hub</li><li>Node</li></ul><p>All <strong>public</strong> repositories can be found on <a href="https://github.com/PrivateAim" target="_blank" rel="noreferrer">GitHub</a>.</p><h2 id="hub" tabindex="-1">Hub <a class="header-anchor" href="#hub" aria-label="Permalink to &quot;Hub&quot;">​</a></h2><p>Hub components/services are individual packages/services within one monorepo.</p><table><thead><tr><th style="text-align:left;">Service</th><th style="text-align:center;">Repository</th><th style="text-align:center;">Programing Language</th><th style="text-align:left;">Lead</th></tr></thead><tbody><tr><td style="text-align:left;"><strong>UI</strong></td><td style="text-align:center;"><a href="https://github.com/PrivateAim/hub" target="_blank" rel="noreferrer">PrivateAim/hub</a></td><td style="text-align:center;">TypeScript</td><td style="text-align:left;"><a href="https://github.com/tada5hi" target="_blank" rel="noreferrer">tada5hi</a></td></tr><tr><td style="text-align:left;"><strong>Core</strong></td><td style="text-align:center;"><a href="https://github.com/PrivateAim/hub" target="_blank" rel="noreferrer">PrivateAim/hub</a></td><td style="text-align:center;">TypeScript</td><td style="text-align:left;"><a href="https://github.com/tada5hi" target="_blank" rel="noreferrer">tada5hi</a></td></tr><tr><td style="text-align:left;"><strong>Realtime</strong></td><td style="text-align:center;"><a href="https://github.com/PrivateAim/hub" target="_blank" rel="noreferrer">PrivateAim/hub</a></td><td style="text-align:center;">TypeScript</td><td style="text-align:left;"><a href="https://github.com/tada5hi" target="_blank" rel="noreferrer">tada5hi</a></td></tr><tr><td style="text-align:left;"><strong>Analysis</strong></td><td style="text-align:center;"><a href="https://github.com/PrivateAim/hub" target="_blank" rel="noreferrer">PrivateAim/hub</a></td><td style="text-align:center;">TypeScript</td><td style="text-align:left;"><a href="https://github.com/tada5hi" target="_blank" rel="noreferrer">tada5hi</a></td></tr><tr><td style="text-align:left;"><strong>Storage</strong></td><td style="text-align:center;"><a href="https://github.com/PrivateAim/hub" target="_blank" rel="noreferrer">PrivateAim/hub</a></td><td style="text-align:center;">TypeScript</td><td style="text-align:left;"><a href="https://github.com/tada5hi" target="_blank" rel="noreferrer">tada5hi</a></td></tr></tbody></table><ul><li><code>UI</code> - Frontend application for proposal and train management, downloading of results and much more</li><li><code>Core</code> - Main backend application to manage resources and trigger commands &amp; events through the message broker</li><li><code>Realtime</code> - Distribute resource events to authorized clients</li><li><code>Analysis</code> - Microservice fulfilling different aspects for analysis execution.</li><li><code>Storage</code> - Storing code-, temp-, result-files for an analysis.</li></ul><table><thead><tr><th style="text-align:left;">Third-Party Service</th><th style="text-align:left;">Repository</th><th style="text-align:center;">Programing Language</th></tr></thead><tbody><tr><td style="text-align:left;"><strong>Authup</strong></td><td style="text-align:left;"><a href="https://github.com/authup/authup" target="_blank" rel="noreferrer">authup/authup</a></td><td style="text-align:center;">TypeScript</td></tr><tr><td style="text-align:left;"><strong>Harbor</strong></td><td style="text-align:left;"><a href="https://github.com/goharbor/harbor" target="_blank" rel="noreferrer">goharbor/harbor</a></td><td style="text-align:center;">Go/TypeScript</td></tr><tr><td style="text-align:left;"><strong>RabbitMQ</strong></td><td style="text-align:left;"><a href="https://github.com/rabbitmq/rabbitmq-server" target="_blank" rel="noreferrer">rabbitmq/rabbitmq-server</a></td><td style="text-align:center;">Starlark</td></tr><tr><td style="text-align:left;"><strong>Vault</strong></td><td style="text-align:left;"><a href="https://github.com/hashicorp/vault" target="_blank" rel="noreferrer">hashicorp/vault</a></td><td style="text-align:center;">Go/JavaScript</td></tr></tbody></table><ul><li><code>Authup</code> - Identity and Access Management (IAM) to manage users, roles, robots, permissions, ...</li><li><code>Harbor</code> - Harbor is a docker registry to distribute images. In the context of the PrivateAim it is used for train distribution across multiple locations.</li><li><code>RabbitMQ</code> - RabbitMQ is a message broker. It is used for the communication between microservices.</li><li><code>Vault</code> - Vault is a secret storage service for managing and storing sensitive information.</li></ul><h2 id="node" tabindex="-1">Node <a class="header-anchor" href="#node" aria-label="Permalink to &quot;Node&quot;">​</a></h2><p>Local components/services are packages utilized in local setups by analysts and administrators. The node-deployment repository is used to set up local nodes by administrators.</p><table><thead><tr><th style="text-align:left;">Service</th><th style="text-align:center;">Repository</th><th style="text-align:center;">Programing Language</th><th style="text-align:left;">Lead</th></tr></thead><tbody><tr><td style="text-align:left;"><strong>node</strong></td><td style="text-align:center;"><a href="https://github.com/PrivateAIM/node-deployment" target="_blank" rel="noreferrer">PrivateAim/node-deployment</a></td><td style="text-align:center;">Python</td><td style="text-align:left;"><a href="https://github.com/mjugl" target="_blank" rel="noreferrer">mjugl</a></td></tr></tbody></table><ul><li><code>node</code> - ...</li></ul><table><thead><tr><th style="text-align:left;">Third-Party Service</th><th style="text-align:left;">Repository</th><th style="text-align:center;">Programing Language</th></tr></thead><tbody><tr><td style="text-align:left;"><strong>Airflow</strong></td><td style="text-align:left;"><a href="https://github.com/apache/airflow" target="_blank" rel="noreferrer">apache/airflow</a></td><td style="text-align:center;">Python/TypeScript</td></tr><tr><td style="text-align:left;"><strong>Vault</strong></td><td style="text-align:left;"><a href="https://github.com/hashicorp/vault" target="_blank" rel="noreferrer">hashicorp/vault</a></td><td style="text-align:center;">Go/JavaScript</td></tr></tbody></table><ul><li><code>Airflow</code> - An open source, community developed platform to programmatically author, schedule and monitor workflows and the primary component of the node.</li><li><code>Vault</code> - Vault is a secret storage service for managing and storing sensitive information.</li></ul>',16),i=[n];function o(s,d,h,g,c,p){return r(),e("div",null,i)}const f=t(l,[["render",o]]);export{b as __pageData,f as default};
