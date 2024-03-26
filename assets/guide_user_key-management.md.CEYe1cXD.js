import{_ as e,c as t,o,a8 as a,aN as i,aO as n,aP as r}from"./chunks/framework.D4CiWSAs.js";const k=JSON.parse('{"title":"Key Management","description":"","frontmatter":{},"headers":[],"relativePath":"guide/user/key-management.md","filePath":"guide/user/key-management.md"}'),s={name:"guide/user/key-management.md"},l=a('<h1 id="key-management" tabindex="-1">Key Management <a class="header-anchor" href="#key-management" aria-label="Permalink to &quot;Key Management&quot;">​</a></h1><p>As a user of the PHT, the Desktop App is required to perform certain processes in the User Interface. The desktop app allows you to sign a train and decrypt results using an existing key pair or with a generated pair in the Desktop App.</p><p>The desktop app can be downloaded from the following <a href="https://github.com/PHT-Medic/desktop-app/releases/latest" target="_blank" rel="noreferrer">link</a> for Mac, Linux and Windows on GitHub.</p><h3 id="generation" tabindex="-1">Generation <a class="header-anchor" href="#generation" aria-label="Permalink to &quot;Generation&quot;">​</a></h3><p>The first thing you need from the Desktop APP is an <em>RSA-key-pair</em>. For this, follow these steps.</p><ol><li>Start the application.</li><li>From the Homepage click on <strong>Settings</strong> on the left hand side.</li></ol><p><a href="/images/offline_tool_images/settings.png"><img src="'+i+'" alt="Offline Tool Start"></a></p><ol start="3"><li>Click on the <strong>KeyPair</strong>-button of the RSA box.</li></ol><p><a href="/images/offline_tool_images/encryption.png"><img src="'+n+'" alt="Offline Tool KeyPairs"></a></p><ol start="4"><li>Specify the directory where the keys should be saved.</li><li>Specify the filename of the private and the public key on the right side.</li><li>Select a passphrase for your private key. (If you press enter, an empty passphrase will be used)</li><li>Click on the <strong>Generate</strong>-button.</li></ol><h3 id="load" tabindex="-1">Load <a class="header-anchor" href="#load" aria-label="Permalink to &quot;Load&quot;">​</a></h3><p>If you already have made a key-pair, you can load them into the Desktop APP. For this, follow these steps.</p><ol><li>Start the application.</li><li>From the Homepage click on <strong>Settings</strong> on the left hand side.</li><li>Click on the <strong>KeyPair</strong>-button of the RSA box.</li><li>Specify the directory where the keys are saved.</li><li>Specify the Passphrase for the key.</li><li>Click on the <strong>Load</strong>-button.</li></ol><h3 id="upload" tabindex="-1">Upload <a class="header-anchor" href="#upload" aria-label="Permalink to &quot;Upload&quot;">​</a></h3><p>Log into the Central-UI with either the identity provider from your organization or an account that your realm admin set up. In the <a href="./../admin/identity-providers.html">admin guide</a>, you can find how the user management and configuration of identity providers is done. After signing in for the first time, you should register the public key you generated in the Desktop APP in the Central Services. In the <strong>Home</strong> section press <strong>Settings</strong> in the menu on the left-hand side and then press <strong>Secrets</strong>.</p><p>You can define the public key</p><ul><li><strong>type</strong>: You can choose between an RSA-key and a Paillier-key. The Paillier-key is not needed in the base case. For more information, look at the &quot;<a href="./homomorphic-encryption.html">Train With Homomorphic Encryption</a>&quot; chapter.</li><li><strong>name</strong>: The preferred name for this specific key.</li></ul><p>Furthermore, you do have two options for loading the key into the system:</p><ol><li>Load the key via the file path (through the <strong>Browse</strong> option)</li><li>Copy and paste the whole key into the <strong>Content</strong>-section.</li></ol><p>On the right side, you will then find each already stored keys with specific name as list below the <strong>Overview</strong> and the search bar (where you can filter for a specific key in the list).</p><p><a href="/images/ui_images/Register_Updating_public_key.png"><img src="'+r+'" alt="image"></a></p>',21),h=[l];function p(d,c,g,m,f,u){return o(),t("div",null,h)}const _=e(s,[["render",p]]);export{k as __pageData,_ as default};
