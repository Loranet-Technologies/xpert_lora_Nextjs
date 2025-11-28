#!/bin/bash
set -e

# Create Keycloak database and user
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname="$POSTGRES_DB" <<-EOSQL
    CREATE USER keycloak WITH PASSWORD 'keycloak';
    CREATE DATABASE keycloak OWNER keycloak;
    GRANT ALL PRIVILEGES ON DATABASE keycloak TO keycloak;
EOSQL
