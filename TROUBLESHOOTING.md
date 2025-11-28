# Troubleshooting Guide - 401 Authentication Error

## Problem
After cloning the project and running `docker-compose up -d`, you get a 401 error when accessing the frontend:
```
Failed to load data: HTTP error! status: 401
```

## Root Cause
The 401 error occurs because:
1. Keycloak authentication server is not configured with the required realm, clients, and users
2. The frontend cannot authenticate without a valid Keycloak setup
3. API calls fail because no authentication token is available

## Solution

### Step 1: Verify Services Are Running

```bash
# Check all services are up
docker-compose ps

# Check Keycloak logs to ensure it started successfully
docker-compose logs keycloak

# Wait for Keycloak to be fully ready (may take 30-60 seconds)
```

### Step 2: Configure Keycloak

1. **Access Keycloak Admin Console**
   - Open browser: http://localhost:9090
   - Login with:
     - Username: `admin`
     - Password: `admin`

2. **Create the `lorawan` Realm**
   - Click dropdown next to "Master" (top-left)
   - Click "Create Realm"
   - Enter realm name: `lorawan`
   - Click "Create"

3. **Create Frontend Client**
   - In the `lorawan` realm, go to "Clients"
   - Click "Create client"
   - Client ID: `lorawan-frontend`
   - Client type: `OpenID Connect`
   - Click "Next"
   - Configure capabilities:
     - Client authentication: `OFF` (public client)
     - Authorization: `OFF`
     - Authentication flow: Enable "Standard flow"
     - Click "Next"
   - Login settings:
     - Valid redirect URIs: `http://localhost:3000/*`
     - Web origins: `http://localhost:3000`
     - Click "Save"

4. **Create Backend Client**
   - Go to "Clients" → "Create client"
   - Client ID: `lorawan-backend`
   - Client type: `OpenID Connect`
   - Click "Next"
   - Configure capabilities:
     - Client authentication: `ON`
     - Authorization: `OFF`
     - Authentication flow: Enable "Standard flow" and "Direct access grants"
     - Click "Next"
   - Login settings:
     - Valid redirect URIs: `http://localhost:3000/*`
     - Web origins: `http://localhost:3000`
     - Click "Save"
   - Go to "Credentials" tab
   - Copy the "Client secret"
   - Update `docker-compose.yml` backend service environment variable:
     ```yaml
     KEYCLOAK_CLIENT_SECRET=your-copied-secret-here
     ```

5. **Create Roles**
   - Go to "Realm roles"
   - Click "Create role"
   - Create role: `user_role`
   - Click "Create role" again
   - Create role: `admin_role`

6. **Create Test User**
   - Go to "Users" → "Create new user"
   - Username: `testuser`
   - Email: `test@example.com`
   - First name: `Test`
   - Last name: `User`
   - Click "Create"
   - Go to "Credentials" tab
   - Click "Set password"
   - Enter password (e.g., `password123`)
   - Set "Temporary" to `OFF`
   - Click "Save"
   - Go to "Role mapping" tab
   - Click "Assign role"
   - Select `user_role` and `admin_role`
   - Click "Assign"

### Step 3: Restart Services

```bash
# Restart backend to pick up new Keycloak client secret (if updated)
docker-compose restart backend

# Restart frontend to ensure it picks up environment variables
docker-compose restart frontend
```

### Step 4: Test Authentication

1. **Access Frontend**
   - Open browser: http://localhost:3000
   - You should see a login page

2. **Login with Keycloak**
   - Click "Login with Keycloak" or similar button
   - You'll be redirected to Keycloak login page
   - Login with the test user credentials created above
   - You'll be redirected back to the frontend

3. **Verify API Calls Work**
   - After successful login, API calls should work
   - Check browser console for any errors
   - The 401 error should be resolved

## Alternative: Development Mode (Bypass Keycloak)

If you want to test without Keycloak setup, you can enable development mode:

1. **Update Frontend Environment**
   - In `docker-compose.yml`, add to frontend environment:
     ```yaml
     - NODE_ENV=development
     - NEXT_PUBLIC_DEV_MODE=true
     ```

2. **Restart Frontend**
   ```bash
   docker-compose restart frontend
   ```

3. **Note**: This bypasses authentication and should only be used for development/testing.

## Common Issues

### Issue: Keycloak not accessible
**Solution**: 
- Check Keycloak is running: `docker-compose ps keycloak`
- Check logs: `docker-compose logs keycloak`
- Ensure port 9090 is not blocked by firewall

### Issue: Redirect URI mismatch
**Solution**: 
- Ensure the redirect URI in Keycloak client matches exactly: `http://localhost:3000/*`
- Check Web Origins includes: `http://localhost:3000`

### Issue: CORS errors
**Solution**: 
- Verify Web Origins in Keycloak client settings
- Check backend CORS configuration allows frontend origin

### Issue: Token not being sent
**Solution**: 
- Check browser console for authentication errors
- Verify Keycloak is accessible from browser (not just from Docker network)
- Clear browser cookies and try again

## Verification Checklist

- [ ] Keycloak is running and accessible at http://localhost:9090
- [ ] `lorawan` realm is created
- [ ] `lorawan-frontend` client is created and configured
- [ ] `lorawan-backend` client is created with secret configured
- [ ] Roles (`user_role`, `admin_role`) are created
- [ ] Test user is created with password set
- [ ] User has roles assigned
- [ ] Frontend environment variables are set correctly
- [ ] Backend environment variables include Keycloak client secret
- [ ] Services are restarted after configuration changes

## Still Having Issues?

1. Check all service logs:
   ```bash
   docker-compose logs frontend
   docker-compose logs backend
   docker-compose logs keycloak
   ```

2. Verify environment variables:
   ```bash
   docker-compose exec frontend env | grep NEXT_PUBLIC
   docker-compose exec backend env | grep KEYCLOAK
   ```

3. Check network connectivity:
   ```bash
   # From frontend container
   docker-compose exec frontend curl http://backend:5555/health
   
   # From browser console (F12)
   # Try: fetch('http://localhost:9090')
   ```

4. Review the detailed setup guide: `Backend/AUTH-SETUP.md`

