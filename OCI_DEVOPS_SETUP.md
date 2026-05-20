# OCI DevOps CI/CD Setup with GitHub

## Step 1 - Create the OCI DevOps Project

1. OCI Console → **Developer Services → DevOps → Projects**
2. Click **Create project**, give it a name
3. Under **Logs**, enable logging (required - build logs won't show without it)
4. Click Create

## Step 2 - Store Secrets in Vault

**2a - Generate and store the OCIR Auth Token:**
1. OCI Console → your profile (top right) → **Auth Tokens → Generate token**, copy it immediately (only shown once)
2. **Identity & Security → Key Management & Secret Management → Vault** → Create Vault
3. Inside the Vault → create a **Master Encryption Key**
4. **Identity & Security → Key Management & Secret Management → Secrets → Create Secret**
   - Paste the **OCIR auth token** here, save the Secret OCID

**2b - Store the GitHub PAT:**
1. **GitHub → Settings → Developer Settings → Personal Access Tokens → Generate new token**
   - Scopes: `repo`, `admin:repo_hook`, copy immediately
2. **Identity & Security → Key Management & Secret Management → Secrets → Create Secret**
   - Paste the **GitHub PAT** here, save the Secret OCID

## Step 3 - Connect GitHub to OCI DevOps

1. DevOps Project → **External Connections → Create connection**
2. Name it, Type: **GitHub**
3. Under **Vault secret** → select your Vault, then select the secret containing the **GitHub PAT**
4. Click Create
5. DevOps Project → **Code Repositories → Mirror repository**
6. Select your External Connection and pick your GitHub repo
7. OCI will sync it automatically on each push

## Step 4 - Create `build_spec.yaml`

Create this file at the **root of your repo** and push it to GitHub. It defines every step the pipeline runs: installing dependencies, logging into OCIR, building and pushing the Docker image, and restarting the K8s pods. You need to fill in your own values for region, tenancy, image name, cluster OCID, compartment OCID, and the Vault secret OCID for the OCIR token.

## Step 5 - Create `k8s/deploy.yaml`

Create a `k8s/` folder at the repo root and add `deploy.yaml`. It has two parts:

- **Deployment** - tells K8s what image to run, how many replicas, environment variables, and secrets. Must have `imagePullPolicy: Always` or pods will never pick up new images.
- **Service** - exposes the app via an OCI Load Balancer. Setting `type: LoadBalancer` makes OCI automatically provision a real load balancer.

Once created, apply it manually once. Run this in **OCI Cloud Shell** (OCI Console → top right → Cloud Shell icon):

```bash
kubectl apply -f k8s/deploy.yaml -n <your-namespace>
```

Cloud Shell already has `kubectl` and OCI CLI configured for your cluster. After this first apply, the pipeline handles restarts - you never run this again unless you change the manifest.

## Step 6 - Add IAM Policies

**Identity & Security → Policies → Create policy** in your compartment. Add the following statements, replacing `<compartment>` with your compartment name and `<dynamic-group>` with the name found under **Identity & Security → Dynamic Groups**:

```
Allow any-user to manage devops-family in compartment <compartment>
Allow any-user to manage repos in compartment <compartment>
Allow any-user to read secret-bundle in compartment <compartment> where request.principal.type = 'devopsconnection'
Allow any-user to read secret-bundle in compartment <compartment> where request.principal.type = 'devopsbuildpipeline'
Allow any-user to manage all-resources in compartment <compartment> where request.principal.type = 'devopspipelinerun'
Allow dynamic-group <dynamic-group> to manage devops-family in compartment <compartment>
Allow dynamic-group <dynamic-group> to read secret-family in compartment <compartment>
Allow dynamic-group <dynamic-group> to manage repos in compartment <compartment>
Allow dynamic-group <dynamic-group> to use ons-topics in compartment <compartment>
Allow dynamic-group <dynamic-group> to use adm-knowledge-bases in compartment <compartment>
Allow dynamic-group <dynamic-group> to manage cluster-family in compartment <compartment>
```

## Step 7 - Create the Deployment Pipeline

1. DevOps Project → **Deployment Pipelines → Create pipeline**, give it a name
2. Inside the pipeline → click **+** → **Add stage**
3. Select **Apply manifest to your Kubernetes cluster**
4. Select your OKE cluster and namespace
5. Under **Select Kubernetes manifest** → select your `deploy.yaml` artifact (you need to first add it as an **Artifact** in the DevOps Project → Artifacts section, pointing to your `k8s/deploy.yaml` in the repo)
6. Click Add

## Step 8 - Create the Build Pipeline

1. DevOps Project → **Build Pipelines → Create build pipeline**, give it a name
2. Inside the pipeline → click **+** → **Add stage → Managed Build**
3. Select your **mirrored GitHub repository**
4. Build spec path: `build_spec.yaml`
5. Click Add
6. After the Managed Build stage → click **+** again → **Add stage → Trigger deployment**
7. Select the Deployment Pipeline created in Step 7
8. Click Add

## Step 9 - Create the Trigger + GitHub Webhook

**8a - Create the trigger in OCI:**
1. DevOps Project → **Triggers → Create trigger**
2. Source: **GitHub**, select your External Connection and repo
3. Event: **Push** to branch `main`
4. Action: select your Build Pipeline (from Step 7)
5. Click Create → **copy the webhook URL** OCI gives you

**8b - Add the webhook in GitHub:**
1. **GitHub repo → Settings → Webhooks → Add webhook**
2. Paste the **OCI trigger URL** into Payload URL
3. Content type: `application/json`
4. Event: **Just the push event**
5. Click **Add webhook**

## Step 10 - Test It End to End

1. Make a visible change in your code
2. Push to GitHub:

```bash
git push origin main
```

3. OCI Console → Build Pipelines → **Build History** → watch **In Progress → Succeeded** (~5–8 min)
4. Open your app URL - the change is live