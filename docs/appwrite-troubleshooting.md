# Appwrite Connection Troubleshooting Guide

This document provides solutions for common issues when connecting to Appwrite from your Recipe Planner application.

## Common Connection Issues

### 1. CORS (Cross-Origin Resource Sharing) Errors

**Symptoms:**
- Console errors containing "CORS" or "Cross-Origin"
- Failed requests to Appwrite endpoints
- Error message: "Access to fetch at 'https://fra.cloud.appwrite.io/v1/...' from origin 'http://127.0.0.1:5500' has been blocked by CORS policy"

**Solutions:**
1. Add your development domain to Appwrite platforms:
   - Go to the Appwrite Console > Project > Settings > Platforms
   - Click "Add Platform" > "Web App"
   - Enter your development URL (e.g., `http://127.0.0.1:5500` or `http://localhost:5500`)
   - Make sure to include the correct port number
   - Save the platform settings

2. If you're using multiple development URLs, add each one as a separate platform.

### 2. Authentication Errors

**Symptoms:**
- 401 Unauthorized errors
- "User unauthorized" messages
- Session creation failures

**Solutions:**
1. Check that your Project ID is correct in `appwrite.js`
2. Ensure you're using the correct Appwrite endpoint
3. Verify that email/password authentication is enabled in your Appwrite project
4. Check for typos in email/password during login attempts
5. Ensure cookies are enabled in your browser

### 3. Network Connectivity Issues

**Symptoms:**
- Timeout errors
- "Failed to fetch" errors
- Network-related error messages

**Solutions:**
1. Check your internet connection
2. Verify that the Appwrite endpoint is accessible (try opening it in a browser)
3. Check if there are any Appwrite service outages
4. Disable any VPNs or proxies that might be interfering with the connection

### 4. SDK Version Compatibility

**Symptoms:**
- Unexpected errors when calling Appwrite methods
- Methods not found or undefined
- TypeScript errors

**Solutions:**
1. Make sure you're using a compatible version of the Appwrite SDK
2. Check the [Appwrite SDK documentation](https://appwrite.io/docs/sdks) for the correct usage
3. Update your SDK to the latest version if needed

## Testing Your Connection

You can use the built-in connection test in our application:

1. Open the browser console (F12 or right-click > Inspect > Console)
2. Navigate to the homepage or API test page
3. Check for any error messages related to Appwrite
4. Look for the connection status toast notification

## Appwrite Response Codes

Here are some common Appwrite response codes and their meanings:

- **200-299**: Success
- **400**: Bad request (check your parameters)
- **401**: Unauthorized (authentication required)
- **403**: Forbidden (insufficient permissions)
- **404**: Not found (resource doesn't exist)
- **409**: Conflict (e.g., email already exists)
- **429**: Too many requests (rate limit exceeded)
- **500-599**: Server errors (contact Appwrite support)

## Additional Resources

- [Appwrite Documentation](https://appwrite.io/docs)
- [Appwrite Discord Community](https://discord.gg/appwrite)
- [Appwrite GitHub Issues](https://github.com/appwrite/appwrite/issues) 