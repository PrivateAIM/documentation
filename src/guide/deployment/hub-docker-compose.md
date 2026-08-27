# FLAME Hub with Docker Compose

The Docker Compose setup is intended for development and evaluation. It uses fixed development
credentials, mounts the Docker socket for the core worker, and does not include Harbor. Use the
[Helm deployment](./hub-installation) for a production Hub.

## Get the configuration

Clone the repository and enter the Compose directory:

```bash
git clone https://github.com/PrivateAIM/hub-deployment.git
cd hub-deployment/docker-compose
cp .env.example .env
```

The executable configuration remains in the Hub Deployment repository:

- [`docker-compose.yml`](https://github.com/PrivateAIM/hub-deployment/blob/master/docker-compose/docker-compose.yml)
- [`nginx.conf`](https://github.com/PrivateAIM/hub-deployment/blob/master/docker-compose/nginx.conf)
- [`.env.example`](https://github.com/PrivateAIM/hub-deployment/blob/master/docker-compose/.env.example)

## Configure the environment

The example `.env` supports these basic overrides:

| Variable | Default | Purpose |
| --- | --- | --- |
| `HUB_IMAGE` | `ghcr.io/privateaim/hub` | Hub container image repository |
| `HUB_IMAGE_TAG` | `latest` | Hub image tag |
| `SUBNET` | `172.40.1.0/24` | Compose network subnet |

The Compose file also accepts service URL overrides such as `PUBLIC_URL`, `AUTHUP_PUBLIC_URL`,
`CORE_PUBLIC_URL`, and `STORAGE_PUBLIC_URL`. Review the current Compose file before changing them.

Analyses require a reachable Harbor registry. This setup does not deploy one, so either
[install Harbor separately](https://goharbor.io/docs/latest/install-config/) or use an existing
instance. Harbor must be reachable over HTTPS. Set `HARBOR_URL` without the scheme and include the
credentials:

```dotenv
HARBOR_URL=<username>:<password>@<harbor-host>
```

Do not commit the populated `.env` file.

## Start and inspect the stack

```bash
docker compose up -d
docker compose ps
docker compose logs -f
```

The bundled NGINX listens on `http://localhost:3000` and routes the Hub services by path. Stop the
stack with:

```bash
docker compose down
```

Named volumes retain database and object-store data. Use `docker compose down --volumes` only when
you intentionally want to delete that local data.
