# Keycloak Authentication Setup

This frontend application is configured to work with Keycloak for authentication and role-based authorization.

## Keycloak Configuration

### Client Configuration

- **Client ID**: `lorawan-frontend`
- **Grant Type**: `client_credentials`
- **Client Secret**: `abj9b1dUHolJs5EXkwhLLxH1CvkCXMNn`
- **Client UUID**: `19e19ca1-b812-4480-ad5d-b1b18df32cc2`
- **Realm**: `lorawan`
- **Host**: `http://localhost:9090`

### Required Roles

The application expects the following roles in the JWT token:

- `user_role`: Basic user access (can see most tabs)
- `admin_role`: Admin access (can see all tabs including Admin and Admin Dashboard)

### Keycloak Setup Steps

1. **Start Keycloak Server**

   ```bash
   # Make sure Keycloak is running on http://localhost:9090
   ```

2. **Create Realm**

   - Create a new realm called `lorawan`

3. **Create Client**

   - Client ID: `lorawan-frontend`
   - Client Protocol: `openid-connect`
   - Access Type: `confidential`
   - Valid Redirect URIs: `http://localhost:3000/*`
   - Web Origins: `http://localhost:3000`

4. **Configure Client Credentials**

   - Go to the `lorawan-frontend` client
   - In the "Credentials" tab, set the client secret to: `abj9b1dUHolJs5EXkwhLLxH1CvkCXMNn`

5. **Create Roles**

   - In the realm, go to "Realm Roles"
   - Create roles: `user_role` and `admin_role`

6. **Create Users and Assign Roles**
   - Create test users
   - Assign appropriate roles to users

## Frontend Features

### Authentication Flow

1. User visits the application
2. If not authenticated, shows login page
3. Clicking "Login with Keycloak" redirects to Keycloak
4. After successful authentication, user is redirected back
5. JWT token is stored securely in cookies
6. Token is automatically included in all API requests

### Role-Based Access Control

- **User Role**: Can access Uplinks, Downlinks, Devices, Applications, Create Device, and User Dashboard
- **Admin Role**: Can access all tabs including Admin and Admin Dashboard

### Token Management

- JWT tokens are automatically refreshed every 30 seconds
- Tokens are stored in secure HTTP-only cookies
- Automatic logout on token expiration
- Authorization header is automatically added to all API requests

## API Integration

All API calls automatically include the `Authorization: Bearer <token>` header. The API client handles:

- Token injection
- Automatic token refresh
- Error handling for 401 responses
- Request/response logging

## Development

### Running the Application

```bash
npm run dev
```

### Testing Authentication

1. Make sure Keycloak is running on `http://localhost:9090`
2. Start the frontend application
3. You should see the login page
4. Click "Login with Keycloak" to test the authentication flow

### Troubleshooting

**401 Unauthorized Errors**

- Check if Keycloak is running
- Verify client configuration
- Check if user has proper roles assigned
- Verify JWT token is valid and not expired

**Login Redirect Issues**

- Ensure redirect URIs are properly configured in Keycloak
- Check that the realm name matches (`lorawan`)
- Verify client ID matches (`lorawan-frontend`)

**Role-Based Access Issues**

- Check if user has the required roles assigned
- Verify roles are included in the JWT token
- Check the browser console for role-related logs
