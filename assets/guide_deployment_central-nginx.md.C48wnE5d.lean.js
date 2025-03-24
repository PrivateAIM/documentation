import{_ as n,c as a,a0 as p,o as e}from"./chunks/framework.BGabeMLJ.js";const h=JSON.parse('{"title":"Nginx","description":"","frontmatter":{},"headers":[],"relativePath":"guide/deployment/central-nginx.md","filePath":"guide/deployment/central-nginx.md"}'),l={name:"guide/deployment/central-nginx.md"};function t(i,s,r,o,c,d){return e(),a("div",null,s[0]||(s[0]=[p(`<h1 id="nginx" tabindex="-1">Nginx <a class="header-anchor" href="#nginx" aria-label="Permalink to &quot;Nginx&quot;">​</a></h1><p>To forward requests to the docker-containers, it is required to configure nginx as a reverse proxy. Therefore, two separate configurations for <a href="#harbor">harbor</a> and the <a href="#app">app</a> must be created.</p><h2 id="harbor" tabindex="-1">Harbor <a class="header-anchor" href="#harbor" aria-label="Permalink to &quot;Harbor&quot;">​</a></h2><p>For harbor, we create a new file (e.g. <code>harbor</code>) in the directory <code>/etc/nginx/sites-enabled</code> with the following content:</p><div class="warning custom-block"><p class="custom-block-title">Info</p><p>Don&#39;t forget to replace the placeholders with the actual values:</p><ul><li><code>[HARBOR_DOMAIN]</code>: Domain name (e.g. harbor.example.com)</li><li><code>[HARBOR_ADDRESS]</code>: Ip Address:Port of the harbor instance rev. proxy (e.g. 192.168.1.1:443)</li><li><code>[HARBOR_SSL_CRT]</code>: Path to certificate file (.crt)</li><li><code>[HARBOR_SSL_KEY]</code>: Path to certificate key file (.key)</li></ul></div><div class="language-txt vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">txt</span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span>server {</span></span>
<span class="line"><span>    server_name [HARBOR_DOMAIN];</span></span>
<span class="line"><span></span></span>
<span class="line"><span>    gzip            on;</span></span>
<span class="line"><span>    gzip_types      text/plain application/xml text/css application/javascript;</span></span>
<span class="line"><span>    gzip_min_length 1000;</span></span>
<span class="line"><span></span></span>
<span class="line"><span>    client_max_body_size 0;</span></span>
<span class="line"><span>    chunked_transfer_encoding on;</span></span>
<span class="line"><span>    </span></span>
<span class="line"><span>    listen 443 ssl;</span></span>
<span class="line"><span>    ssl_certificate [HARBOR_SSL_CRT];</span></span>
<span class="line"><span>    ssl_certificate_key [HARBOR_SSL_KEY];</span></span>
<span class="line"><span>    include /etc/letsencrypt/options-ssl-nginx.conf;</span></span>
<span class="line"><span>    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;</span></span>
<span class="line"><span></span></span>
<span class="line"><span>    location / {</span></span>
<span class="line"><span>        proxy_redirect                      off;</span></span>
<span class="line"><span>        proxy_set_header Host               $host;</span></span>
<span class="line"><span>        proxy_set_header X-Real-IP          $remote_addr;</span></span>
<span class="line"><span>        proxy_set_header X-Forwarded-For    $proxy_add_x_forwarded_for;</span></span>
<span class="line"><span>        proxy_set_header X-Forwarded-Proto  $scheme;</span></span>
<span class="line"><span>        proxy_pass                          [HARBOR_ADDRESS];</span></span>
<span class="line"><span></span></span>
<span class="line"><span>        proxy_buffering off;</span></span>
<span class="line"><span>        proxy_request_buffering off;</span></span>
<span class="line"><span>    }</span></span>
<span class="line"><span></span></span>
<span class="line"><span>}</span></span>
<span class="line"><span>server {</span></span>
<span class="line"><span>    if ($host = [HARBOR_DOMAIN]) {</span></span>
<span class="line"><span>        return 301 https://$host$request_uri;</span></span>
<span class="line"><span>    }</span></span>
<span class="line"><span></span></span>
<span class="line"><span></span></span>
<span class="line"><span>    server_name [HARBOR_DOMAIN];</span></span>
<span class="line"><span>    listen 80;</span></span>
<span class="line"><span>    return 404;</span></span>
<span class="line"><span></span></span>
<span class="line"><span>}</span></span></code></pre></div><h2 id="app" tabindex="-1">App <a class="header-anchor" href="#app" aria-label="Permalink to &quot;App&quot;">​</a></h2><p>For the app we need to create a new file (e.g. <code>app</code>) in the directory <code>/etc/nginx/sites-enabled</code> with the following content:</p><div class="warning custom-block"><p class="custom-block-title">Info</p><p>Don&#39;t forget to replace the placeholders with the actual values:</p><ul><li><code>[APP_DOMAIN]</code> Domain name (e.g. app.example.com)</li><li><code>[APP_SSL_CRT]</code>: Certificate file (.crt)</li><li><code>[APP_SSL_KEY]</code>: Certificate key file (.key)</li></ul></div><div class="language-txt vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">txt</span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span>map $sent_http_content_type $expires {</span></span>
<span class="line"><span>    &quot;text/html&quot;                 epoch;</span></span>
<span class="line"><span>    &quot;text/html; charset=utf-8&quot;  epoch;</span></span>
<span class="line"><span>    default                     off;</span></span>
<span class="line"><span>}</span></span>
<span class="line"><span></span></span>
<span class="line"><span>server {</span></span>
<span class="line"><span>    server_name [APP_DOMAIN];</span></span>
<span class="line"><span>    listen 443 ssl;</span></span>
<span class="line"><span>    </span></span>
<span class="line"><span>    ssl_certificate [APP_SSL_CRT];</span></span>
<span class="line"><span>    ssl_certificate_key [APP_SSL_KEY];</span></span>
<span class="line"><span>    include /etc/letsencrypt/options-ssl-nginx.conf;</span></span>
<span class="line"><span>    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;</span></span>
<span class="line"><span></span></span>
<span class="line"><span>    gzip            on;</span></span>
<span class="line"><span>    gzip_types      text/plain application/xml text/css application/javascript;</span></span>
<span class="line"><span>    gzip_min_length 1000;</span></span>
<span class="line"><span>    </span></span>
<span class="line"><span>    client_max_body_size 0;</span></span>
<span class="line"><span>    chunked_transfer_encoding on;</span></span>
<span class="line"><span></span></span>
<span class="line"><span>    location / {</span></span>
<span class="line"><span>        expires $expires;</span></span>
<span class="line"><span></span></span>
<span class="line"><span>        proxy_redirect                      off;</span></span>
<span class="line"><span>        proxy_set_header Host               $host;</span></span>
<span class="line"><span>        proxy_set_header X-Real-IP          $remote_addr;</span></span>
<span class="line"><span>        proxy_set_header X-Forwarded-For    $proxy_add_x_forwarded_for;</span></span>
<span class="line"><span>        proxy_set_header X-Forwarded-Proto  $scheme;</span></span>
<span class="line"><span>        proxy_read_timeout          1m;</span></span>
<span class="line"><span>        proxy_connect_timeout       1m;</span></span>
<span class="line"><span>        proxy_pass                          http://127.0.0.1:3000;</span></span>
<span class="line"><span>    }</span></span>
<span class="line"><span>    </span></span>
<span class="line"><span>    location /api/ {</span></span>
<span class="line"><span>        rewrite ^/api(/.*)$ $1 break;</span></span>
<span class="line"><span></span></span>
<span class="line"><span>        proxy_redirect                      off;</span></span>
<span class="line"><span>        proxy_set_header Host               $host;</span></span>
<span class="line"><span>        proxy_set_header X-Real-IP          $remote_addr;</span></span>
<span class="line"><span>        proxy_set_header X-Forwarded-For    $proxy_add_x_forwarded_for;</span></span>
<span class="line"><span>        proxy_set_header X-Forwarded-Proto  $scheme;</span></span>
<span class="line"><span>        proxy_read_timeout          2m;</span></span>
<span class="line"><span>        proxy_connect_timeout       2m;</span></span>
<span class="line"><span>        proxy_pass                          http://127.0.0.1:3002;</span></span>
<span class="line"><span>    }</span></span>
<span class="line"><span>    </span></span>
<span class="line"><span>    location /auth/ {</span></span>
<span class="line"><span>        rewrite ^/auth(/.*)$ $1 break;</span></span>
<span class="line"><span></span></span>
<span class="line"><span>        proxy_redirect                      off;</span></span>
<span class="line"><span>        proxy_set_header Host               $host;</span></span>
<span class="line"><span>        proxy_set_header X-Real-IP          $remote_addr;</span></span>
<span class="line"><span>        proxy_set_header X-Forwarded-For    $proxy_add_x_forwarded_for;</span></span>
<span class="line"><span>        proxy_set_header X-Forwarded-Proto  $scheme;</span></span>
<span class="line"><span>        proxy_read_timeout          2m;</span></span>
<span class="line"><span>        proxy_connect_timeout       2m;</span></span>
<span class="line"><span>        proxy_pass                          http://127.0.0.1:3010;</span></span>
<span class="line"><span>    }</span></span>
<span class="line"><span>    </span></span>
<span class="line"><span>    location /socket.io/ {</span></span>
<span class="line"><span>        proxy_set_header Host               $host;</span></span>
<span class="line"><span>        proxy_set_header X-Real-IP          $remote_addr;</span></span>
<span class="line"><span>        proxy_set_header X-Forwarded-For    $proxy_add_x_forwarded_for;</span></span>
<span class="line"><span>        proxy_set_header X-Forwarded-Proto  $scheme;</span></span>
<span class="line"><span></span></span>
<span class="line"><span>        proxy_pass                          http://127.0.0.1:3001;</span></span>
<span class="line"><span></span></span>
<span class="line"><span>        proxy_http_version 1.1;</span></span>
<span class="line"><span>        proxy_set_header Upgrade $http_upgrade;</span></span>
<span class="line"><span>        proxy_set_header Connection &quot;upgrade&quot;;</span></span>
<span class="line"><span>    }</span></span>
<span class="line"><span>}</span></span>
<span class="line"><span></span></span>
<span class="line"><span>server {</span></span>
<span class="line"><span>    if ($host = [APP_DOMAIN]) {</span></span>
<span class="line"><span>        return 301 https://$host$request_uri;</span></span>
<span class="line"><span>    }</span></span>
<span class="line"><span></span></span>
<span class="line"><span></span></span>
<span class="line"><span>    listen 80;</span></span>
<span class="line"><span>    server_name [APP_DOMAIN];</span></span>
<span class="line"><span>    return 404;</span></span>
<span class="line"><span>}</span></span></code></pre></div><h2 id="installer" tabindex="-1">Installer <a class="header-anchor" href="#installer" aria-label="Permalink to &quot;Installer&quot;">​</a></h2>`,11)]))}const x=n(l,[["render",t]]);export{h as __pageData,x as default};
