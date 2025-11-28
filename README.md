# LoRaWAN ChirpStack Native Setup Guide

This guide explains how to run the LoRaWAN ChirpStack project without using Docker containers. This setup runs all components natively on your system.

## Project Overview

This project consists of several components:

- **ChirpStack**: LoRaWAN Network Server
- **Backend API**: NestJS-based API for handling uplink messages
- **Frontend**: Next.js web application
- **Databases**: PostgreSQL (for ChirpStack), MongoDB (for Backend), Redis (for caching)
- **MQTT Broker**: Mosquitto for message handling
- **Authentication**: Keycloak for user management

## Prerequisites

### System Requirements

- **Operating System**: Linux (Ubuntu 20.04+ recommended), macOS, or Windows with WSL2
- **RAM**: Minimum 8GB (16GB recommended)
- **Storage**: At least 10GB free space
- **Network**: Ports 8080, 8090, 3000, 3002, 5432, 27017, 1883, 9090 available

### Required Software

- **Node.js**: Version 18+ (for Backend and Frontend)
- **PostgreSQL**: Version 14+ (for ChirpStack and Keycloak)
- **MongoDB**: Version 6+ (for Backend API)
- **Redis**: Version 7+ (for caching)
- **Mosquitto**: MQTT broker
- **Go**: Version 1.19+ (for ChirpStack)
- **Keycloak**: Version 23+ (for authentication)

## Installation Steps

### 1. Install System Dependencies

#### Ubuntu/Debian:

```bash
# Update package list
sudo apt update

# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Install MongoDB
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt update
sudo apt install -y mongodb-org

# Install Redis
sudo apt install -y redis-server

# Install Mosquitto MQTT broker
sudo apt install -y mosquitto mosquitto-clients

# Install Go
wget https://go.dev/dl/go1.21.5.linux-amd64.tar.gz
sudo tar -C /usr/local -xzf go1.21.5.linux-amd64.tar.gz
echo 'export PATH=$PATH:/usr/local/go/bin' >> ~/.bashrc
source ~/.bashrc

# Install Keycloak
wget https://github.com/keycloak/keycloak/releases/download/23.0.0/keycloak-23.0.0.zip
unzip keycloak-23.0.0.zip
sudo mv keycloak-23.0.0 /opt/keycloak
```

#### macOS (using Homebrew):

```bash
# Install Homebrew if not already installed
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install dependencies
brew install node postgresql mongodb/brew/mongodb-community redis mosquitto go
brew services start postgresql
brew services start mongodb/brew/mongodb-community
brew services start redis
brew services start mosquitto

# Download and setup Keycloak
brew install keycloak
```

#### Windows (using Chocolatey):

```powershell
# Install Chocolatey if not already installed
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

# Install dependencies
choco install nodejs postgresql mongodb redis mosquitto golang keycloak
```

### 2. Database Setup

#### PostgreSQL Setup:

```bash
# Start PostgreSQL service
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create databases and users
sudo -u postgres psql -c "CREATE USER chirpstack WITH PASSWORD 'chirpstack';"
sudo -u postgres psql -c "CREATE DATABASE chirpstack OWNER chirpstack;"
sudo -u postgres psql -c "CREATE USER keycloak WITH PASSWORD 'keycloak';"
sudo -u postgres psql -c "CREATE DATABASE keycloak OWNER keycloak;"

# Grant privileges
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE chirpstack TO chirpstack;"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE keycloak TO keycloak;"
```

#### MongoDB Setup:

```bash
# Start MongoDB service
sudo systemctl start mongod
sudo systemctl enable mongod

# Create admin user
mongosh --eval "
use admin;
db.createUser({
  user: 'admin',
  pwd: 'password',
  roles: [{ role: 'userAdminAnyDatabase', db: 'admin' }]
});
"

# Create application database
mongosh --eval "
use chirpstack_backend;
db.createUser({
  user: 'backend_user',
  pwd: 'backend_password',
  roles: [{ role: 'readWrite', db: 'chirpstack_backend' }]
});
"
```

### 3. ChirpStack Installation

```bash
# Clone ChirpStack repository
git clone https://github.com/chirpstack/chirpstack.git
cd chirpstack

# Build ChirpStack
make build

# Create configuration directory
sudo mkdir -p /etc/chirpstack
sudo cp -r configuration/chirpstack/* /etc/chirpstack/

# Update configuration files
sudo sed -i 's/\$POSTGRESQL_HOST/localhost/g' /etc/chirpstack/chirpstack.toml
sudo sed -i 's/\$REDIS_HOST/localhost/g' /etc/chirpstack/chirpstack.toml
sudo sed -i 's/\$MQTT_BROKER_HOST/localhost/g' /etc/chirpstack/chirpstack.toml

# Generate secret key
sudo sed -i 's/you-must-replace-this/$(openssl rand -base64 32)/g' /etc/chirpstack/chirpstack.toml
```

### 4. ChirpStack Gateway Bridge Setup

```bash
# Build Gateway Bridge
cd ../chirpstack-gateway-bridge
make build

# Create configuration directory
sudo mkdir -p /etc/chirpstack-gateway-bridge
sudo cp -r configuration/chirpstack-gateway-bridge/* /etc/chirpstack-gateway-bridge/

# Update configuration
sudo sed -i 's/\$MQTT_BROKER_HOST/localhost/g' /etc/chirpstack-gateway-bridge/chirpstack-gateway-bridge-eu868.toml
```

### 5. ChirpStack REST API Setup

```bash
# Build REST API
cd ../chirpstack-rest-api
make build
```

### 6. Backend API Setup

```bash
# Navigate to Backend directory
cd Backend

# Install dependencies
npm install

# Create environment file
cat > .env << EOF
NODE_ENV=development
PORT=3000
MONGODB_URL=mongodb://admin:password@localhost:27017/chirpstack_backend?authSource=admin
MQTT_BROKER_URL=mqtt://localhost:1883
CHIRPSTACK_SERVER=localhost:8080
CHIRPSTACK_API_TOKEN=dev-token-12345
KEYCLOAK_AUTH_SERVER_URL=http://localhost:9090
KEYCLOAK_REALM=lorawan
KEYCLOAK_CLIENT_ID=lorawan-backend
KEYCLOAK_CLIENT_SECRET=
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=24h
EOF

# Build the application
npm run build
```

### 7. Frontend Setup

```bash
# Navigate to Frontend directory
cd ../frontend

# Install dependencies
npm install

# Create environment file
cat > .env.local << EOF
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_KEYCLOAK_URL=http://localhost:9090
NEXT_PUBLIC_KEYCLOAK_REALM=lorawan
NEXT_PUBLIC_KEYCLOAK_CLIENT_ID=lorawan-frontend
EOF

# Build the application
npm run build
```

### 8. Keycloak Setup

```bash
# Create Keycloak user
sudo /opt/keycloak/bin/add-user-keycloak.sh -u admin -p admin

# Start Keycloak
sudo /opt/keycloak/bin/kc.sh start-dev --db-url=jdbc:postgresql://localhost:5432/keycloak --db-username=keycloak --db-password=keycloak
```

## Running the Application

### 1. Start Infrastructure Services

Create a startup script to start all services:

```bash
# Create startup script
cat > start-services.sh << 'EOF'
#!/bin/bash

echo "Starting infrastructure services..."

# Start PostgreSQL
sudo systemctl start postgresql

# Start MongoDB
sudo systemctl start mongod

# Start Redis
sudo systemctl start redis

# Start Mosquitto
sudo systemctl start mosquitto

# Start Keycloak
sudo /opt/keycloak/bin/kc.sh start-dev --db-url=jdbc:postgresql://localhost:5432/keycloak --db-username=keycloak --db-password=keycloak &

echo "Infrastructure services started!"
EOF

chmod +x start-services.sh
./start-services.sh
```

### 2. Start ChirpStack Services

```bash
# Create ChirpStack startup script
cat > start-chirpstack.sh << 'EOF'
#!/bin/bash

echo "Starting ChirpStack services..."

# Start ChirpStack
cd /path/to/chirpstack
./chirpstack -c /etc/chirpstack &

# Start Gateway Bridge
cd /path/to/chirpstack-gateway-bridge
./chirpstack-gateway-bridge -c /etc/chirpstack-gateway-bridge/chirpstack-gateway-bridge-eu868.toml &

# Start REST API
cd /path/to/chirpstack-rest-api
./chirpstack-rest-api --server localhost:8080 --bind 0.0.0.0:8090 --insecure &

echo "ChirpStack services started!"
EOF

chmod +x start-chirpstack.sh
./start-chirpstack.sh
```

### 3. Start Backend API

```bash
# Navigate to Backend directory
cd Backend

# Start in development mode
npm run start:dev

# Or start in production mode
npm run start:prod
```

### 4. Start Frontend

```bash
# Navigate to Frontend directory
cd frontend

# Start in development mode
npm run dev

# Or start in production mode
npm run start
```

## Access Points

Once all services are running, you can access:

- **ChirpStack UI**: http://localhost:8080
- **ChirpStack REST API**: http://localhost:8090
- **Backend API**: http://localhost:3000
- **Frontend**: http://localhost:3002
- **Keycloak Admin**: http://localhost:9090 (admin/admin)

## Configuration Files

### ChirpStack Configuration

- Main config: `/etc/chirpstack/chirpstack.toml`
- Region configs: `/etc/chirpstack/region_*.toml`

### Gateway Bridge Configuration

- Config: `/etc/chirpstack-gateway-bridge/chirpstack-gateway-bridge-eu868.toml`

### Mosquitto Configuration

- Config: `/etc/mosquitto/mosquitto.conf`

### Backend Environment

- File: `Backend/.env`

### Frontend Environment

- File: `frontend/.env.local`

## Troubleshooting

### Common Issues

1. **Port Conflicts**: Ensure all required ports are available
2. **Database Connection**: Check database services are running and accessible
3. **MQTT Connection**: Verify Mosquitto is running and accessible
4. **Permission Issues**: Ensure proper file permissions for configuration files

### Logs Location

- **ChirpStack**: Check console output or redirect to log files
- **Backend**: Console output or use PM2 for production
- **Frontend**: Console output
- **PostgreSQL**: `/var/log/postgresql/`
- **MongoDB**: `/var/log/mongodb/`
- **Redis**: `/var/log/redis/`
- **Mosquitto**: `/var/log/mosquitto/`

### Performance Optimization

1. **Database Tuning**: Adjust PostgreSQL and MongoDB settings for your hardware
2. **Redis Configuration**: Optimize Redis settings for caching
3. **Node.js**: Use PM2 for process management in production
4. **System Resources**: Monitor CPU, memory, and disk usage

## Production Deployment

For production deployment:

1. **Use PM2** for Node.js process management
2. **Configure reverse proxy** (Nginx) for load balancing
3. **Set up SSL certificates** for HTTPS
4. **Configure firewall** rules
5. **Set up monitoring** and logging
6. **Backup strategies** for databases
7. **Environment-specific configurations**

## Development vs Production

### Development Mode

- Hot reload enabled
- Debug logging enabled
- Development databases
- Local authentication

### Production Mode

- Optimized builds
- Production databases
- SSL/TLS enabled
- Proper authentication
- Monitoring and logging

## Maintenance

### Regular Tasks

- **Database backups**: Daily automated backups
- **Log rotation**: Configure log rotation for all services
- **Security updates**: Keep all components updated
- **Performance monitoring**: Monitor system resources
- **Certificate renewal**: For SSL certificates

This guide provides a comprehensive setup for running the LoRaWAN ChirpStack project without Docker containers. Each component runs natively on your system, giving you full control over the configuration and deployment.
