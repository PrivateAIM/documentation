# Analysis Definition in Kubernetes

As the administrator of your FLAME Node, it is important to understand how the analyses are being deployed on your system. While the [publicly available helm chart for the FLAME Node](https://github.com/PrivateAIM/helm/tree/master/charts/flame-node) makes it easy to see exactly how the components are defined, the analyses themselves are deployed using the Pod Orchestrator using the [Python kubernetes library](https://github.com/kubernetes-client/python) making it more difficult to quickly assess their configuration. This page covers the various kubernetes resources that are deployed when an analysis is started and well as how certain parameters can be modified to fit your security requirements.

Here is a brief overview of the resources that are deployed when initiating an analysis:

* [Analysis Deployment](#analysis-deployment)
    * Analysis ReplicaSet
        * Analysis Pod
* [Nginx Deployment](#nginx-deployment)
    * Nginx ReplicaSet
        * Nginx Pod
* [Services](#services)
* [ConfigMap](#configmap)
* [NetworkPolicy](#network-policy)

## Deployments
When a FLAME Analysis is started, the Pod Orchestrator service creates two separate deployments: one for the analysis itself, and one for a nginx instance. Both are required for the analysis to be able to run and transmit its results, but as shown below, both have very stringent policies in place to severely limit their traffic.

Each [Deployment](https://kubernetes.io/docs/concepts/workloads/controllers/deployment/) is so configured to create a [ReplicaSet](https://kubernetes.io/docs/concepts/workloads/controllers/replicaset/) which is responsible for maintaining a specified number of [Pod](https://kubernetes.io/docs/concepts/workloads/pods/) replicas at any given time. By using deployments, the workload can be better managed, and also allow one to monitor the state of the rollout and scale the workload as needed. Additionally, this template enables the use of [Labels and Selectors](https://kubernetes.io/docs/concepts/overview/working-with-objects/labels/) which are subsequently used to apply a restrictive [NetworkPolicy](https://kubernetes.io/docs/concepts/services-networking/network-policies/) to the generated Pods thus controlling the traffic in and out of the analysis container.

### Analysis Deployment
Though the code for each analysis is manually reviewed and approved prior to running on any node, precautions are still taken to lock down all traffic both entering and leaving the Pod in which it is running in the kubernetes cluster. By default, every analysis deployed by the Pod Orchestrator has a restrictive Network Policy (see [NetworkPolicy](#network-policy) below) applied to it using the labels and selectors. 

However, the analysis cannot run in complete isolation since it still requires access to the data and needs to communicate with other FLAME components for sending progress updates and the results. In order to control its communication, a Nginx sidecar container is deployed in parallel with the analysis which serves as a proxy for all requests into and exiting the container. Details on how this Nginx sidecar controls traffic is discussed in the [Nginx Deployment](#nginx-deployment) section.

An additional security measure to ensure that the analysis pod was created using the FLAME pipeline is verification using the OIDC protocol and the included Keycloak instance. Keycloak serves as an identity provider (IDP) to check whether requests made by certain components or services are who they say they are by bundling a JSON Web Token (JWT) with their request. Our software registers the FLAME services with Keycloak upon deployment and communication is authenticated using the OAuth2 endpoints. 

When an analysis is deployed via the FLAME UI or gateway, the Pod Orchestrator first verifies that the request came from an official FLAME component by checking the included JWT against Keycloak, and if authenticated, proceeds to register a new client within Keycloak. This registration process generates a token that is included in the analysis deployment and is subsequently used for retrieving a JWT from Keycloak that is included in all of its sent requests, including those sent for accessing the desired protected data being shared by your organization.


#### Template
Each analysis deployment can be defined with the following template:
```yaml
kind: Deployment
apiVersion: apps/v1
metadata:
  name: <analysis deployment name>
  namespace: default
  labels:
    app: <analysis deployment name>
    component: flame-analysis
spec:
  replicas: 1
  selector:
    matchLabels:
      app: <analysis deployment name>
      component: flame-analysis
  template:
    metadata:
      labels:
        app: <analysis deployment name>
        component: flame-analysis
    spec:
      containers:
        - name: <analysis deployment name>
          image: <URL to image in Harbor>
          ports:
            - containerPort: 8000
              protocol: TCP
          env:
            - name: DATA_SOURCE_TOKEN
              value: none_needed
            - name: KEYCLOAK_TOKEN
              value: <randomly generated token>
            - name: ANALYSIS_ID
              value: <analysis UUID>
            - name: PROJECT_ID
              value: <project UUID>
            - name: DEPLOYMENT_NAME
              value: <analysis deployment name>
          resources: {}
          terminationMessagePath: /dev/termination-log
          terminationMessagePolicy: File
          imagePullPolicy: IfNotPresent
      restartPolicy: Always
      terminationGracePeriodSeconds: 30
      dnsPolicy: ClusterFirst
      securityContext: {}
      imagePullSecrets:
        - name: flame-harbor-credentials
      schedulerName: default-scheduler
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxUnavailable: 25%
      maxSurge: 25%
  revisionHistoryLimit: 10
  progressDeadlineSeconds: 600
status:
  observedGeneration: 1
  replicas: 1
  updatedReplicas: 1
  readyReplicas: 1
  availableReplicas: 1
  conditions:
    - type: Available
      status: 'True'
      reason: MinimumReplicasAvailable
      message: Deployment has minimum availability.
    - type: Progressing
      status: 'True'
      reason: NewReplicaSetAvailable
      message: >-
        ReplicaSet "<analysis deployment name>"
        has successfully progressed.
```

### Nginx Deployment
Nginx serves as a sidecar proxy, acting as the *only* means of communication between the analysis pod and everything else. The partnered analysis container can communicate only through the endpoints defined within this Nginx deployment (endpoint descriptions can be found in the [ConfigMap](#configmap) section), and like the analysis deployment, the same restrictive Network Policy is applied to the pods in this deployment through the use of specific labels and selectors.

The created Nginx pod is only capable of communication with the partnered analysis pod, itself, and the DNS service for your kubernetes cluster. Because the analysis pod needs to communicate with other FLAME components, it must be able to discover those services within the kubernetes cluster and thus requires access to the kubernetes DNS service to resolve these service names.

#### Template
Each Nginx deployment can be defined with the following template:
```yaml
kind: Deployment
apiVersion: apps/v1
metadata:
  name: nginx-<analysis deployment name>
  namespace: default
  generation: 1
  labels:
    app: nginx-<analysis deployment name>
    component: flame-analysis-nginx
spec:
  replicas: 1
  selector:
    matchLabels:
      app: nginx-<analysis deployment name>
  template:
    metadata:
      labels:
        app: nginx-<analysis deployment name>
        component: flame-analysis-nginx
    spec:
      volumes:
        - name: nginx-vol
          configMap:
            name: nginx-<analysis deployment name>-config
            items:
              - key: nginx.conf
                path: nginx.conf
            defaultMode: 420
      containers:
        - name: nginx-<analysis deployment name>
          image: nginx:latest
          ports:
            - containerPort: 80
              protocol: TCP
          resources: {}
          volumeMounts:
            - name: nginx-vol
              mountPath: /etc/nginx/nginx.conf
              subPath: nginx.conf
          livenessProbe:
            httpGet:
              path: /healthz
              port: 80
              scheme: HTTP
            initialDelaySeconds: 15
            timeoutSeconds: 5
            periodSeconds: 20
            successThreshold: 1
            failureThreshold: 1
          terminationMessagePath: /dev/termination-log
          terminationMessagePolicy: File
          imagePullPolicy: Always
      restartPolicy: Always
      terminationGracePeriodSeconds: 30
      dnsPolicy: ClusterFirst
      securityContext: {}
      schedulerName: default-scheduler
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxUnavailable: 25%
      maxSurge: 25%
  revisionHistoryLimit: 10
  progressDeadlineSeconds: 600
status:
  observedGeneration: 1
  replicas: 1
  updatedReplicas: 1
  readyReplicas: 1
  availableReplicas: 1
  conditions:
    - type: Available
      status: 'True'
      reason: MinimumReplicasAvailable
      message: Deployment has minimum availability.
    - type: Progressing
      status: 'True'
      reason: NewReplicaSetAvailable
      message: >-
        ReplicaSet
        "nginx-<analysis deployment name>-<unique ID>" has
        successfully progressed.
```

## Services
A kubernetes [Service](https://kubernetes.io/docs/concepts/services-networking/service/) is what allows a specific application to be exposed and accessed within a Pod. Kubernetes creates an endpoint to the specified Pod and given port, and because Pods are ephemeral, a separate Service resource is required to direct traffic to correct Pod. For the FLAME Node software, services are created for both analysis and Nginx Pods at ports `8000` and `80`, respectively. These services use the same labels and selectors as the deployments, and thus are subject the same restrictive Network Policy.

Below are the configurations for both the analysis and Nginx Services.

### Analysis Service Template
```yaml
kind: Service
apiVersion: v1
metadata:
  name: <analysis deployment name>
  namespace: default
  labels:
    app: <analysis deployment name>
    component: flame-analysis
spec:
  ports:
    - protocol: TCP
      port: 80
      targetPort: 8000
  selector:
    app: <analysis deployment name>
  type: ClusterIP
```

### Nginx Service Template
```yaml
kind: Service
apiVersion: v1
metadata:
  name: nginx-<analysis deployment name>
  namespace: default
  labels:
    app: nginx-<analysis deployment name>
    component: flame-analysis-nginx
spec:
  ports:
    - protocol: TCP
      port: 80
      targetPort: 80
  selector:
    app: nginx-<analysis deployment name>
  type: ClusterIP
```

## ConfigMap
A kubernetes [ConfigMap](https://kubernetes.io/docs/concepts/configuration/configmap/) is used in the FLAME Node to define the endpoints for the Nginx sidecar pod by providing the imported Nginx configuration. Because the traffic from the analysis pod is tightly controlled, it is necessary to pre-define the Nginx endpoints with which this pod can use for communication and transmitting results. The endpoints are to enable communication with other Flame Node components and are configured such that each one will only accept connections from the analysis container (as defined by its Service IP). 

::: info Incoming Messages
One endpoint, `/analysis`, is configured to allow the FLAME Message Broker and Pod Orchestrator to send information to the analysis pod and serves as the **only** point of ingress to the analysis. 
:::

The ConfigMap resource name with use the format of `nginx-<analysis deployment name>-config` and is defined as such:
```yaml
kind: ConfigMap
apiVersion: v1
metadata:
  name: nginx-<analysis deployment name>-config
  namespace: default
  labels:
    component: flame-nginx-analysis-config-map
data:
  nginx.conf: |2-

                worker_processes 1;
                events { worker_connections 1024; }
                http {
                    sendfile on;
                    
                     server {
                        listen 80;
                        
                        client_max_body_size 0;
                        chunked_transfer_encoding on;
                        
                        proxy_redirect off;
                        proxy_set_header Host $host;
                        proxy_set_header X-Real-IP $remote_addr;
                        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
                        proxy_set_header X-Forwarded-Proto $scheme;
                        
                        # health check
                        location /healthz {
                            return 200 'healthy';
                        }
                        # analysis deployment to kong
                        location /kong {
                            rewrite     ^/kong(/.*) $1 break;
                            proxy_pass  http://flame-node-kong-proxy;
                            allow       <Analysis Service endpoint IP>;
                            deny        all;
                        }
                        
                        location ~ ^/storage/(final|local|intermediate)/ {
                            rewrite     ^/storage(/.*) $1 break;
                            proxy_pass http://flame-node-node-result-service:8080;
                            allow       <Analysis Service endpoint IP>;
                            deny        all;
                        }
                        
                        location /hub-adapter/kong/datastore/<project UUID> {
                            rewrite     ^/hub-adapter(/.*) $1 break;
                            proxy_pass http://flame-node-hub-adapter-service:5000;
                            allow       <Analysis Service endpoint IP>;
                            deny        all;
                        }
                        
                        # analysis deployment to message broker: participants
                        location ~ ^/message-broker/analyses/<analysis UUID>/participants(|/self) {
                            rewrite     ^/message-broker(/.*) $1 break;
                            proxy_pass  http://flame-node-node-message-broker;
                            allow       <Analysis Service endpoint IP>;
                            deny        all;
                        }
                        
                         # analysis deployment to message broker: analysis message
                        location ~ ^/message-broker/analyses/<analysis UUID>/messages(|/subscriptions) {
                            rewrite     ^/message-broker(/.*) $1 break;
                            proxy_pass  http://flame-node-node-message-broker;
                            allow       <Analysis Service endpoint IP>;
                            deny        all;
                        }
                        # analysis deployment to message broker: healthz
                        location /message-broker/healthz {
                            rewrite     ^/message-broker(/.*) $1 break;
                            proxy_pass  http://flame-node-node-message-broker;
                            allow       <Analysis Service endpoint IP>;
                            deny        all;
                        }
                        
                        # analysis deployment to po log stream
                        location /po/stream_logs {
                            #rewrite     ^/po(/.*) $1 break;
                            proxy_pass  http://flame-node-po-service:8000;
                            allow       <Analysis Service endpoint IP>;
                            deny        all;
                            proxy_connect_timeout 10s;
                            proxy_send_timeout    120s;
                            proxy_read_timeout    120s;
                            send_timeout          120s;
                        }
                        
                        # message-broker/pod-orchestration to analysis deployment
                        location /analysis {
                            rewrite     ^/analysis(/.*) $1 break;
                            proxy_pass  http://<analysis deployment name>;
                            allow       <FLAME Message Broker Service endpoint IP>;
                            allow       <FLAME Pod Orchestrator Service endpoint IP>;
                            deny        all;
                        }
                    }
                }
```

## Network Policy
The Network Policy resource is a policy which restricts traffic either exiting (egress) or entering (ingress) a matching pod. It is applied to any pod with a matching label, in the case of the FLAME Node, the label is `app: <analysis deployment name>` meaning that any resource in the kubernetes cluster with a matching label selector will have this network policy applied to it e.g. the analysis and nginx pods. the applied policy contains rules for both ingress and egress. The ingress policy makes it so that only traffic coming from the associated Nginx pod is allowed, while the egress policy only allows requests to be sent to either the Nginx pod or the kubernetes cluster's DNS pod. 

The DNS permission is necessary to enable pod name resolution within the kubernetes cluster, thus allowing the analysis pod to communicate with the FLAME components. No other traffic or communication, including to others pods or the internet, is capable by the analysis and Nginx pods while this policy is in place.

Here is the template describing this policy:
```yaml
kind: NetworkPolicy
apiVersion: networking.k8s.io/v1
metadata:
  name: nginx-to-<analysis deployment name>-policy
  namespace: default
  labels:
    component: flame-nginx-to-analysis-policy
spec:
  podSelector:
    matchLabels:
      app: <analysis deployment name>
  ingress:
    - from:
        - podSelector:
            matchLabels:
              app: nginx-<analysis deployment name>
  egress:
    - to:
        - podSelector:
            matchLabels:
              app: nginx-<analysis deployment name>
        - podSelector:
            matchLabels:
              k8s-app: kube-dns
          namespaceSelector:
            matchLabels:
              kubernetes.io/metadata.name: kube-system
  policyTypes:
    - Ingress
    - Egress
```
