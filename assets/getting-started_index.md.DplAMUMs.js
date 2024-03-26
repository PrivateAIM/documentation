import{_ as e,c as t,o as a,a8 as i,a9 as s,aa as n}from"./chunks/framework.D4CiWSAs.js";const y=JSON.parse('{"title":"Introduction","description":"","frontmatter":{},"headers":[],"relativePath":"getting-started/index.md","filePath":"getting-started/index.md"}'),r={name:"getting-started/index.md"},o=i('<h1 id="introduction" tabindex="-1">Introduction <a class="header-anchor" href="#introduction" aria-label="Permalink to &quot;Introduction&quot;">​</a></h1><p>The Personal Health Train (PHT) is, an open source, container-based secure distributed analysis platform, proposed within the <a href="https://www.go-fair.org/implementation-networks/overview/personal-health-train/" target="_blank" rel="noreferrer">GO:FAIR initiative</a> as one solution for distributed analysis of medical data, enhancing their FAIRness. Rather than transferring data to a central analysis site, the analysis algorithm (wrapped in a ‘train’), travels between multiple sites (e.g., hospitals – so-called ‘train stations’) securely hosting the data.</p><p>The following overview shows all interactions between service components to execute a train iteratively over three stations with our PHT-TBI architecture. <a href="/images/process_images/pht_services.png"><img src="'+s+'" alt="Overview"></a></p><h2 id="mission-statement" tabindex="-1">Mission Statement <a class="header-anchor" href="#mission-statement" aria-label="Permalink to &quot;Mission Statement&quot;">​</a></h2><p>From Machine Learning (ML) healthcare can profit by ‘learning’ models which support clinical practice in treatment decision support systems (TDSS). To increase the robustness of an obtained model and produce meaningful results, generally, the analysis outcome depends on the number of training samples and data quality.</p><p>But meaningful data to improve predictions in medical research and healthcare is often distributed across multiple sites and is not easily accessible. This data contains highly sensitive patient information, may consist at each site different data formats and cannot be shared without explicit consent of the patient. Our goal is to make this data available for trains with stations to support privacy-preserving distributed machine learning in healthcare with our open-source implementation of the PHT.</p><p>Implementing trains as light-weight containers enable even complex data analysis workflows to travel between sites, for example, genomics pipelines or deep-learning algorithms – analytics methods that are not easily amenable to established distributed queries or simple statistics.</p><h2 id="security" tabindex="-1">Security <a class="header-anchor" href="#security" aria-label="Permalink to &quot;Security&quot;">​</a></h2><h3 id="security-protocol" tabindex="-1">Security Protocol <a class="header-anchor" href="#security-protocol" aria-label="Permalink to &quot;Security Protocol&quot;">​</a></h3><p>The following flow chart depicts the security protocol used for protecting participating stations against malicious code, as well as encrypting any stored results using envelope encryption.<br> This ensures that only approved algorithms are executed and that only previously registered participants in an analysis can access the results. <a href="/images/process_images/security_protocol.png"><img src="'+n+'" alt="Security Protocol"></a></p>',10),l=[o];function c(h,d,p,u,m,g){return a(),t("div",null,l)}const _=e(r,[["render",c]]);export{y as __pageData,_ as default};