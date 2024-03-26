import{_ as e,c as t,o as a,a8 as i,aM as s,az as n}from"./chunks/framework.D4CiWSAs.js";const m=JSON.parse('{"title":"Registration","description":"","frontmatter":{},"headers":[],"relativePath":"guide/deployment/station-registration.md","filePath":"guide/deployment/station-registration.md"}'),o={name:"guide/deployment/station-registration.md"},r=i('<h1 id="registration" tabindex="-1">Registration <a class="header-anchor" href="#registration" aria-label="Permalink to &quot;Registration&quot;">​</a></h1><p>Stations must be registered in the central User-Interface in order to be the destination of a proposal or train.</p><div class="warning custom-block"><p class="custom-block-title">IMPORTANT</p><p>When changing the settings of your station in the central UI you need to restart your local station.</p></div><h2 id="central" tabindex="-1">Central <a class="header-anchor" href="#central" aria-label="Permalink to &quot;Central&quot;">​</a></h2><p>Click on Admin(1) -&gt; General(2) -&gt; Stations(3) -&gt; +Add(4) to create a new station. <a href="/images/ui_images/add_station_central.png"><img src="'+s+'" alt="image"></a></p><h2 id="key-pair-generation" tabindex="-1">Key pair generation <a class="header-anchor" href="#key-pair-generation" aria-label="Permalink to &quot;Key pair generation&quot;">​</a></h2><p>Generate a new key using <a href="https://www.openssl.org/" target="_blank" rel="noreferrer">open-ssl</a> locally on the machine you want to run your station on:</p><div class="language-shell vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">shell</span><pre class="shiki shiki-themes github-light github-dark vp-code"><code><span class="line"><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">openssl</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> genrsa</span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;"> -out</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> key.pem</span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;"> 2048</span></span></code></pre></div><p>Generate the associated public key using:</p><div class="language-shell vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">shell</span><pre class="shiki shiki-themes github-light github-dark vp-code"><code><span class="line"><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">openssl</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> rsa</span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;"> -in</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> key.pem</span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;"> -outform</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> PEM</span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;"> -pubout</span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;"> -out</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> public.pem</span></span></code></pre></div><p>and then register this key in the UI.</p><h3 id="public-key-registration" tabindex="-1">Public Key registration <a class="header-anchor" href="#public-key-registration" aria-label="Permalink to &quot;Public Key registration&quot;">​</a></h3><p>Here, you also need to set the name of your station, select the ecosystem (if your station is a PHT-Medic station use default) and set the public key of the station. <a href="/images/ui_images/pk_station.png"><img src="'+n+'" alt="image"></a><br> Once you have filled in all the fields, you can click &quot;Create&quot;. The <strong>registry credentials</strong> for your station will appear below. These are important for the <a href="/guide/deployment/station-installation.html">following installation</a>.</p>',13),l=[r];function h(p,d,c,g,k,u){return a(),t("div",null,l)}const _=e(o,[["render",h]]);export{m as __pageData,_ as default};
