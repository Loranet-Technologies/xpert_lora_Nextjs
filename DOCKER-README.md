# LoRaWAN ChirpStack Unified Docker Setup

This setup runs all components (ChirpStack, Backend API, Frontend) in a unified Docker environment.

## Services Included

### ChirpStack Services

- **chirpstack**: Main ChirpStack server (port 8080)
- **chirpstack-gateway-bridge**: UDP Gateway Bridge (port 1700)
- **chirpstack-gateway-bridge-basicstation**: BasicStation Gateway Bridge (port 3001)
- **chirpstack-rest-api**: REST API (port 8090)

### Database Services

- **postgres**: PostgreSQL database for ChirpStack
- **mongodb**: MongoDB database for Backend API (port 27017)
- **redis**: Redis cache (internal)

### Message Broker

- **mosquitto**: MQTT broker (port 1883)

### Application Services

- **backend**: NestJS Backend API (port 3000)
- **frontend**: Next.js Frontend (port 3002)

## Quick Start

1. **Start all services:**

   ```bash
   docker-compose up -d
   ```

2. **View logs:**

   ```bash
   docker-compose logs -f
   ```

3. **Stop all services:**
   ```bash
   docker-compose down
   ```

## Access Points

- **ChirpStack UI**: http://localhost:8080
- **ChirpStack REST API**: http://localhost:8090
- **Backend API**: http://localhost:3000
- **Frontend**: http://localhost:3002
- **MongoDB**: localhost:27017 (admin/password)
- **MQTT Broker**: localhost:1883

## Development Mode

For development with hot reload:

```bash
# Start only infrastructure services
docker-compose up -d postgres mongodb redis mosquitto chirpstack chirpstack-gateway-bridge chirpstack-gateway-bridge-basicstation chirpstack-rest-api

# Run Backend locally
cd Backend
npm run start:dev

# Run Frontend locally
cd frontend
npm run dev
```

## Environment Variables

The Backend service uses these environment variables:

- `MONGODB_URL`: MongoDB connection string
- `MQTT_BROKER_URL`: MQTT broker connection string
- `PORT`: Backend API port (3000)

## Data Persistence

All data is persisted in Docker volumes:

- `postgresqldata`: PostgreSQL data
- `mongodbdata`: MongoDB data
- `redisdata`: Redis data

## Troubleshooting

1. **Check service status:**

   ```bash
   docker-compose ps
   ```

2. **View specific service logs:**

   ```bash
   docker-compose logs backend
   docker-compose logs frontend
   ```

3. **Rebuild services:**
   ```bash
   docker-compose build --no-cache
   docker-compose up -d
   ```
