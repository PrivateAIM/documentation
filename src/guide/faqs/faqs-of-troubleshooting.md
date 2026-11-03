# Troubleshooting FAQs

## Node Site:

### What is the minimum configuration in my `values.yaml` for a Node deployment?
Add the node’s hostname, Hub client ID and secret, and crypto private key. Also set `expose.type` to `ingress` or `gateway`.
For details and an example, see [Node Installation: preparation](/guide/deployment/node-installation.md#preparation).

### How do I access to my Node without a domain name?
Set `expose.type` to `none` and leave the hostname blank. 
Then port-forward the Node UI, Hub Adapter, and Keycloak services. The Node UI will be available at http://localhost:3000.
For further information, visit [Node Installation: deploying without a Domain Name](/guide/deployment/node-installation.md#deploying-without-a-domain-name).

### How do I expose my Node behind a TLS configuration or a reverse proxy?
For a TLS config, create a Kubernetes TLS secret with `kubectl create secret tls tls-secret --key my-flame-node.key --cert my-flame-node.crt`,
then set `tlsSecretName: tls-secret` in the ingress settings. Check more in  [Node Troubleshooting:TLS setup](/guide/deployment/node-troubleshooting.md#setting-up-tls-connection).

The reverse-proxy instructions in the troubleshooting page are considered for Airflow; for the FLAME Node’s proxy assumptions, visit [Node Installation](/guide/deployment/node-installation.md).
