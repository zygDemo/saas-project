# New API local deployment

This directory deploys New API inside the saas-project repository with an isolated PostgreSQL and Redis instance.

## Start

Run from deploy/new-api: docker compose up -d

## Access

- Web console: http://localhost:3008
- API Base URL: http://localhost:3008/v1

## Stop

Run from deploy/new-api: docker compose down

## Notes

- The service binds to 127.0.0.1:3008 by default.
- Secrets are stored in .env; commit .env.example only.
- PostgreSQL data is stored in Docker volume new_api_postgres_data.
- New API logs are written to deploy/new-api/logs/.
