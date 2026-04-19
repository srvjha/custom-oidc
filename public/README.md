# OIDC Frontend

Minimal frontend for the OIDC Authentication Service built with vanilla HTML, CSS, and JavaScript.

## Files

- `index.html` - Main page with login/register forms and dashboard
- `styles.css` - Styling with responsive design
- `app.js` - JavaScript logic for authentication and token management

## Features

- Login form
- Registration form
- Tab switching between login and register
- JWT token decoding (no external libraries)
- Display user information from ID token
- Display tokens (partial, for security)
- Fetch and display user info from API using access token
- Logout functionality
- Automatic dashboard loading if user already logged in
- Responsive design for mobile devices

## How It Works

### 1. Registration
1. User fills in: Full Name, Email, Password, Username (optional)
2. Clicks "Register"
3. Frontend sends POST request to `/auth/register`
4. Server returns: `access_token`, `id_token`, and sets `refreshToken` in httpOnly cookie
5. Frontend decodes `id_token` and displays user info
6. Dashboard shows user information and tokens

### 2. Login
1. User fills in: Email and Password
2. Clicks "Login"
3. Frontend sends POST request to `/auth/token`
4. Server returns: `access_token`, `id_token`, and sets `refreshToken` in httpOnly cookie
5. Frontend decodes `id_token` and displays user info
6. Dashboard shows user information and tokens

### 3. Token Usage
- `access_token`: Used for API requests (Authorization header)
- `id_token`: Decoded to show user info (no API call needed)
- `refreshToken`: Stored in httpOnly cookie (automatic, browser handles it)

### 4. Fetch User Info
- Click "Fetch User Info" button
- Frontend uses `access_token` to call `/auth/userinfo`
- Display API response with full user information

### 5. Logout
- Click "Logout" button
- Clear all tokens from browser
- Clear user info
- Return to login/register forms

## Token Storage

- **Access Token**: Stored in `sessionStorage`
- **ID Token**: Stored in `sessionStorage` (also decoded immediately)
- **Refresh Token**: Stored in httpOnly cookie (automatic by browser)
- **User Info**: Decoded from ID token and displayed (NOT stored)

## Security Notes

- ID token is decoded in browser (safe - it's signed)
- Access token is shown partially (first 50 chars) to protect against accidental exposure
- Refresh token is in httpOnly cookie (can't be stolen by JavaScript)
- All tokens are cleared on logout
- Uses `credentials: 'include'` in fetch to send cookies

## Testing

1. Open `http://localhost:8000` in browser
2. Register a new account
3. Dashboard will display user information
4. Try fetching user info via API
5. Logout and login again
6. If refresh token works, dashboard loads immediately after token refresh

## Browser Compatibility

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Requires ES6+ JavaScript support
- Uses Fetch API
- Uses sessionStorage

## Limitations

- No password reset functionality
- No email verification
- Frontend validation only (server also validates)
- JWT decode is basic (doesn't validate signature)
- No refresh token auto-refresh (needs manual implementation)
