# Kubernetes deployment notes

Apply the namespace first. Create `onestep-secret` manually from a secret manager or
`kubectl create secret`; do not apply `secret.example.yaml` with its placeholders.

For the optional lab database:
```bash
kubectl -n onestep create secret generic postgres-lab-secret --from-literal=POSTGRES_PASSWORD='CHANGE_ME'
kubectl apply -f k8s/postgres-lab-only.yaml
```
If using that lab database, set DATABASE_URL to:
`postgresql://onestep:CHANGE_ME@postgres:5432/onestep?schema=public`

For production, use managed PostgreSQL and keep the database endpoint private.
The API container currently executes `prisma migrate deploy` on container start. For
multiple replicas, change this to a dedicated one-off migration Job / release stage
before scaling the new Deployment, to avoid concurrent migration execution.
