# OneStep Home Services

A starter three-tier home-services booking application for a realistic DevOps delivery exercise.

## Features in this starter
- Customer registration and login (JWT)
- Browse service categories
- Create and view service requests
- Provider/admin-ready role field in the user model
- Health and readiness endpoints
- PostgreSQL + Prisma
- React/Vite frontend
- Docker multi-stage backend and Nginx frontend images
- Jenkins pipeline, Kubernetes Deployments, Services, ConfigMaps, Secret template,
  ServiceAccount, RBAC, HPA, PDB and Ingress

> This is a learning/starter implementation, not a fully audited production product.
> Payment processing, SMS/email delivery, provider assignment workflows, audit trails,
> advanced admin screens, backups, TLS certificates and observability integrations
> must be completed and tested before a real customer launch.

## Architecture
Browser -> Ingress -> frontend Service -> Nginx/React
Browser -> `/api` via frontend Nginx reverse proxy -> backend Service -> Express -> PostgreSQL

## Repository layout
- `frontend/` React application
- `backend/` Express API and Prisma schema
- `k8s/` Kubernetes resources
- `Jenkinsfile` CI/CD pipeline
- `docker-compose.yml` local development stack

## Prerequisites
- Node.js 22+
- Docker + Docker Compose plugin
- Kubernetes cluster with metrics-server for HPA
- kubectl, Helm (optional)
- Jenkins with Docker, AWS CLI, kubectl and Node.js available on its build agent
- AWS ECR repository and IAM permissions if deploying to AWS

## Run locally
1. Copy environment template:
   `cp .env.example .env`
2. Start:
   `docker compose up --build`
3. Open `http://localhost:8080`
4. API health: `http://localhost:8080/api/health`

The backend container runs Prisma migrations on startup. For local development, Docker Compose
uses the PostgreSQL service declared in `docker-compose.yml`.

## Demo workflow
1. Register a customer account.
2. Log in.
3. Browse available categories.
4. Submit a service request with address, preferred date and notes.
5. View your requests in the dashboard.

## Important environment variables
Backend:
- `PORT` default 5000
- `DATABASE_URL`
- `JWT_SECRET` (use a long random value; never commit a real secret)
- `CORS_ORIGIN` (frontend origin; use `*` only for local experiments)

Frontend:
- `VITE_API_BASE_URL` is `/api` in the container because Nginx proxies `/api` to backend.

## Build images
From repository root:
```bash
docker build -t onestep-backend:local ./backend
docker build -t onestep-frontend:local ./frontend
```

## Kubernetes deployment
1. Create namespace:
   `kubectl apply -f k8s/namespace.yaml`
2. Create a real Secret (do not use the example value in production):
```bash
kubectl -n onestep create secret generic onestep-secret \
  --from-literal=DATABASE_URL='postgresql://onestep:REPLACE_ME@postgres:5432/onestep?schema=public' \
  --from-literal=JWT_SECRET='REPLACE_WITH_LONG_RANDOM_SECRET'
```
3. Build and push images to your registry. Update image references in:
   - `k8s/backend-deployment.yaml`
   - `k8s/frontend-deployment.yaml`
4. Deploy:
```bash
kubectl apply -f k8s/
kubectl -n onestep get pods,svc,hpa,pdb
```
5. Ensure your cluster has an Ingress controller and metrics-server.
6. For production, use managed PostgreSQL (for example Amazon RDS) rather than the demo
   in-cluster PostgreSQL manifest. The included PostgreSQL StatefulSet is for lab use.

## Jenkins setup
Configure these Jenkins credentials:
- `aws-access-key-id` (AWS access key ID, if not using an instance role)
- `aws-secret-access-key` (AWS secret access key, if not using an instance role)
- `kubeconfig-onestep` (Secret file containing kubeconfig)
- `ecr-registry` (Secret text: `<account-id>.dkr.ecr.<region>.amazonaws.com`)
- `aws-region` (Secret text, e.g. `ap-south-1`)

Set Jenkins job parameters/environment:
- `AWS_REGION`
- `ECR_REGISTRY`
- `ECR_BACKEND_REPOSITORY` (e.g. `onestep-backend`)
- `ECR_FRONTEND_REPOSITORY` (e.g. `onestep-frontend`)
- `K8S_NAMESPACE` (default `onestep`)

The Jenkins agent needs Docker daemon access, AWS CLI, kubectl, Node.js/npm and permission
to deploy to the target namespace. Prefer an EC2 instance profile / workload identity over
long-lived AWS keys. The pipeline runs tests, builds images, pushes to ECR and applies manifests.

## Production hardening checklist
- Use RDS PostgreSQL with private networking, encryption, automated backups and tested restore.
- Store secrets in AWS Secrets Manager/External Secrets, not Git.
- Use TLS at Ingress; restrict CORS and network access.
- Add database migrations as a controlled release job, not concurrently in every replica.
- Add readiness/liveness probes, resource requests/limits and autoscaling policies.
- Add Pod anti-affinity / topology spread constraints across zones.
- Add image scanning (Trivy), SBOM, signed images and admission policies.
- Add structured logs, metrics, traces, alerting and dashboards.
- Add rate limits, authorization tests, audit logs and security review.
- Use rolling/blue-green/canary deployment strategy and tested rollback.
