# FLAME Hub Docker Compose

Clone the [Hub Deployment repository](https://github.com/privateaim/hub-deployment.git):
```bash
git clone https://github.com/privateaim/hub-deployment.git
```

## Note on Harbor
This setup does not include the Harbor service, you must either provide the credentials to an existing Harbor or [install Harbor separately](https://goharbor.io/docs/latest/install-config/).

## Configuration
Basic configuration occurs via environment variables in an `.env` file.
An example (`.env.example`) is located in the root of the repository.

| Variable        | Mandatory | Default | Use/Meaning                                                       |
|-----------------|:---------:|---------|-------------------------------------------------------------------|
| `HUB_IMAGE`     |     ❌     | `ghcr.io/privateaim/hub` | Used to override the default image for the `HUB` docker image     |
| `HUB_IMAGE_TAG` |     ❌     | `latest` | Used to override the default image tag for the `HUB` docker image |
| `SUBNET`        |     ❌     | `172.40.1.0/24` | Used to change the default docker subnet.                         |

To provide credentials to Harbor (either local or external), use the following Variable:
> ⚠️ Important: Harbor must be accessible via https (plain http will fail). This is a limitation of Harbor.

| Variable        | Mandatory | Use/Meaning                                                       |
|-----------------|:---------:|-------------------------------------------------------------------|
| `HARBOR_URL`    |     ✅     | Construct using `<username>:<passwd>@<harbor_host>` (no `https://` ) |

## Run

Run using:
```bash
docker compose up -d
```
