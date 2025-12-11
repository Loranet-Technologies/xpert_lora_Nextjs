# Xpert LoRa

A Next.js TypeScript application for LoRaWAN network management built with ChirpStack integration, Keycloak authentication, and ERPNext connectivity.

## Prerequisites

- Node.js (18 or later, LTS version recommended)
- npm or yarn package manager
- Docker and Docker Compose (for production deployment)
- Keycloak server (for authentication)

## Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd xpert_lora_Nextjs
```

2. Navigate to the frontend directory and install dependencies:

```bash
cd frontend
npm install
```

## Environment Variables

Create environment files in the `frontend` directory. The application uses Next.js environment variable support.

### Development Environment

Create `.env.local` file in the `frontend` directory:

```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:5555

# Keycloak Configuration
NEXT_PUBLIC_KEYCLOAK_URL=http://localhost:9090
NEXT_PUBLIC_KEYCLOAK_REALM=lorawan
NEXT_PUBLIC_KEYCLOAK_CLIENT_ID=lorawan-frontend

# Node Environment
NODE_ENV=development
```

### Production Environment

Create `.env.production.local` file in the `frontend` directory:

```env
# API Configuration
NEXT_PUBLIC_API_URL=http://your-backend-api:5555

# Keycloak Configuration
NEXT_PUBLIC_KEYCLOAK_URL=http://your-keycloak-server:9090
NEXT_PUBLIC_KEYCLOAK_REALM=lorawan
NEXT_PUBLIC_KEYCLOAK_CLIENT_ID=lorawan-frontend

# Node Environment
NODE_ENV=production
```

**Note:** Replace the URLs with your actual service endpoints.

### Environment Variables Explained

- `NEXT_PUBLIC_API_URL`: Base URL for the backend API that handles LoRaWAN operations
- `NEXT_PUBLIC_KEYCLOAK_URL`: Keycloak server URL for authentication
- `NEXT_PUBLIC_KEYCLOAK_REALM`: Keycloak realm name (default: `lorawan`)
- `NEXT_PUBLIC_KEYCLOAK_CLIENT_ID`: Keycloak client ID (default: `lorawan-frontend`)

## Development Setup

### Running the Development Server

To start the development server:

```bash
cd frontend
npm run dev
```

The application will be available at `http://localhost:3000` (default Next.js port).

The development server includes:

- Hot module replacement (HMR) with Turbopack
- Fast refresh for React components
- TypeScript type checking
- ESLint for code quality

### Development Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production with Turbopack
- `npm start` - Start production server (after build)
- `npm run lint` - Run ESLint

## Keycloak Authentication Setup

This application uses Keycloak for authentication and role-based access control. See [KEYCLOAK-SETUP.md](frontend/KEYCLOAK-SETUP.md) for detailed setup instructions.

### Quick Keycloak Setup

1. **Start Keycloak Server** (via Docker Compose or standalone)
2. **Create Realm**: Create a new realm called `lorawan`
3. **Create Client**:
   - Client ID: `lorawan-frontend`
   - Client Protocol: `openid-connect`
   - Access Type: `confidential`
   - Valid Redirect URIs: `http://localhost:3000/*`
   - Web Origins: `http://localhost:3000`
4. **Create Roles**:
   - `user_role`: Basic user access
   - `admin_role`: Admin access (includes Admin Dashboard)
5. **Assign Roles**: Assign appropriate roles to users

## Production Setup

### Building for Production

Build the application:

```bash
cd frontend
npm run build
```

This creates an optimized production build in the `.next/` directory.

### Docker Deployment

The project includes Docker configuration for containerized deployment.

#### Using Docker Compose

1. **Start all services (including infrastructure):**

```bash
docker-compose up -d --build
```

This will start:

- PostgreSQL (for ChirpStack and Keycloak)
- MongoDB (for backend API)
- Redis (caching)
- Mosquitto (MQTT broker)
- Keycloak (authentication server)
- Frontend (Next.js application)

The frontend application will be available at `http://localhost:3000`

2. **View logs:**

```bash
docker-compose logs -f frontend
```

3. **Stop all services:**

```bash
docker-compose down
```

#### Manual Docker Build

```bash
cd frontend

# Build the Docker image
docker build -t xpert-lora-frontend .

# Run the container
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_API_URL=http://your-backend-api:5555 \
  -e NEXT_PUBLIC_KEYCLOAK_URL=http://your-keycloak:9090 \
  -e NEXT_PUBLIC_KEYCLOAK_REALM=lorawan \
  -e NEXT_PUBLIC_KEYCLOAK_CLIENT_ID=lorawan-frontend \
  xpert-lora-frontend
```

### Production Build Details

- Uses Next.js production optimizations
- Automatic code splitting
- Static page generation where possible
- Image optimization
- Built with Turbopack for faster builds

## Project Structure

```
xpert_lora_Nextjs/
├── frontend/                 # Next.js frontend application
│   ├── app/                  # Next.js App Router
│   │   ├── api/              # API routes (ERPNext proxy)
│   │   │   └── erpnext/      # ERPNext integration endpoints
│   │   ├── pages/            # Page components
│   │   │   ├── admin/        # Admin pages
│   │   │   ├── applications/ # Application management
│   │   │   ├── devices/      # Device management
│   │   │   └── ...           # Other pages
│   │   ├── layout.tsx        # Root layout
│   │   └── page.tsx          # Home page
│   ├── components/           # Reusable UI components
│   │   ├── ui/               # shadcn/ui components
│   │   └── LoginPage.tsx     # Login component
│   ├── lib/                  # Utility libraries
│   │   ├── api/              # API client and hooks
│   │   ├── auth/             # Authentication provider
│   │   └── utils.ts          # Utility functions
│   ├── public/               # Static assets
│   ├── Dockerfile            # Docker build configuration
│   ├── next.config.ts        # Next.js configuration
│   ├── package.json          # Dependencies and scripts
│   └── KEYCLOAK-SETUP.md     # Keycloak setup guide
├── docker-compose.yml        # Docker Compose configuration
├── DOCKER-README.md          # Docker setup documentation
└── README.md                 # This file
```

## Key Features

- **LoRaWAN Device Management**: Create, update, and manage LoRaWAN devices
- **Organization/Tenant Management**: Multi-tenant support with organization isolation
- **Application Management**: Organize devices by applications
- **Device Profile Management**: Configure device profiles for different device types
- **Gateway Management**: Monitor and manage LoRaWAN gateways
- **Uplinks/Downlinks Monitoring**: Real-time monitoring of device communications
- **User Dashboard**: User-specific dashboard with device statistics
- **Admin Dashboard**: Administrative dashboard with system-wide statistics
- **Role-Based Access Control**: Fine-grained access control via Keycloak roles
- **ERPNext Integration**: Integration with ERPNext for tenant and device data
- **Keycloak Authentication**: Secure authentication with automatic token refresh
- **Responsive Design**: Modern UI built with Tailwind CSS and shadcn/ui components

## API Integration

The application integrates with:

- **Backend API**: LoRaWAN backend service (default: `http://localhost:5555`)

  - Device management
  - Application management
  - Uplink/Downlink operations
  - Gateway management

- **ERPNext API**: ERPNext integration via Next.js API routes

  - Tenant/Organization data
  - Application data
  - Device data
  - Device profile data
  - Gateway data

- **Keycloak**: Authentication and authorization
  - User authentication
  - JWT token management
  - Role-based access control

## Technology Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **UI Library**: React 19
- **Styling**: Tailwind CSS 4
- **UI Components**: shadcn/ui (Radix UI)
- **State Management**: TanStack Query (React Query)
- **Authentication**: Keycloak JS
- **HTTP Client**: Fetch API with custom API client
- **Build Tool**: Turbopack

## Troubleshooting

### Port Already in Use

If port 3000 is already in use, Next.js will automatically use the next available port. Alternatively, set the PORT environment variable:

```bash
PORT=3001 npm run dev
```

### Environment Variables Not Loading

- Ensure `.env.local` or `.env.production.local` files exist in the `frontend` directory
- Verify environment variable names start with `NEXT_PUBLIC_` for client-side access
- Restart the development server after changing environment variables
- Clear `.next` cache: `rm -rf .next` (or `rmdir /s .next` on Windows)

### Keycloak Authentication Issues

- Ensure Keycloak is running and accessible
- Verify Keycloak realm and client configuration
- Check browser console for authentication errors
- Verify redirect URIs are properly configured in Keycloak
- See [KEYCLOAK-SETUP.md](frontend/KEYCLOAK-SETUP.md) for detailed troubleshooting

### Docker Build Issues

- Ensure Docker is running
- Check that all required environment variables are set in `docker-compose.yml`
- Review Docker logs: `docker-compose logs frontend`
- Rebuild without cache: `docker-compose build --no-cache frontend`

### API Connection Issues

- Verify `NEXT_PUBLIC_API_URL` is correct
- Check if backend API is running and accessible
- Review network requests in browser DevTools
- Check CORS configuration on backend API

## Development Workflow

1. **Start Infrastructure Services** (if using Docker):

```bash
docker-compose up -d postgres postgres-keycloak mongodb redis mosquitto keycloak
```

2. **Start Frontend Development Server**:

```bash
cd frontend
npm run dev
```

3. **Access the Application**:

- Frontend: `http://localhost:3000`
- Keycloak Admin: `http://localhost:9090` (admin/admin)

## License

[Add your license information here]

## Support

For issues and questions, please contact [support contact information]
