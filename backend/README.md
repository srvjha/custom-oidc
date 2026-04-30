# OIDC Authentication Service

A production-ready OpenID Connect (OIDC) and OAuth 2.0 server implementation built with Node.js, Express, TypeScript, and PostgreSQL. This service acts as an Identity Provider (IdP) that allows third-party applications to securely authenticate users and obtain delegated access tokens.

---

## Table of Contents

1. [Overview](#overview)
2. [OIDC and OAuth 2.0 Workflow](#oidc-and-oauth-20-workflow)
3. [First-Party Authentication Endpoints](#first-party-authentication-endpoints)
4. [OAuth Client Management Endpoints](#oauth-client-management-endpoints)
5. [OIDC and OAuth 2.0 Protocol Endpoints](#oidc-and-oauth-20-protocol-endpoints)
6. [Security Features](#security-features)
7. [Setup and Configuration](#setup-and-configuration)

---

## Overview

OpenID Connect (OIDC) is an authentication protocol built on top of OAuth 2.0. While OAuth 2.0 provides delegated authorization (issuing Access Tokens to access protected APIs), OIDC adds identity verification (issuing ID Tokens containing user profile claims).

### Core Capabilities
- **First-Party Auth:** Standard user registration, login, and session management.
- **Client Application Management:** Developers can register their applications to get a `client_id` and `client_secret`.
- **Authorization Code Flow:** Securely authenticates users and issues tokens to third-party applications without exposing user credentials.
- **Token Management:** Issues JWT-based Access Tokens, ID Tokens, and long-lived Refresh Tokens.
- **Standard Discovery:** Hosts standard `.well-known` discovery and JWKS public key endpoints.

---

## OIDC and OAuth 2.0 Workflow

This server supports the standard **Authorization Code Flow**, designed for server-side applications capable of securely storing a client secret.

### Step 1: Authorization Request
A third-party client application redirects the user's browser to the Authorization Endpoint (`/o/authorize`).
The client includes its `client_id`, requested `scope`, `response_type=code`, and `redirect_uri`.

### Step 2: User Authentication and Consent
If the user is not currently logged in, the server prompts them to authenticate (redirects to the login page).
Once authenticated, the server checks if the user has previously granted consent to the client for the requested scopes. If not, the server presents a consent screen.

### Step 3: Authorization Code Issuance
Once the user grants consent, the server generates a short-lived, single-use Authorization Code and redirects the user's browser back to the client's `redirect_uri` with this code attached as a query parameter.

### Step 4: Token Exchange
The client application's backend server sends a direct HTTP POST request to the Token Endpoint (`/o/token`), providing the Authorization Code, its `client_id`, and its `client_secret`.
The server validates the code and credentials. Upon success, it issues an Access Token, an ID Token, and a Refresh Token.

### Step 5: Resource Access
The client application uses the Access Token to make requests to protected APIs (such as the `/o/userinfo` endpoint) on behalf of the user.

---

## First-Party Authentication Endpoints

These endpoints manage user accounts and first-party sessions.

### POST /auth/sign-up
Registers a new user.

**Request Body:**
```json
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "SecurePassword123",
  "fullname": "John Doe",
  "dateofbirth": "1990-01-01",
  "gender": "male"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "User created successfully",
  "data": "uuid-of-new-user"
}
```

### POST /auth/sign-in
Authenticates a user and sets HTTP-only cookies (`accesstoken`, `refreshtoken`).

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "SecurePassword123"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "User signed in successfully",
  "data": {
    "accessToken": "jwt-access-token",
    "refreshToken": "jwt-refresh-token"
  }
}
```

### POST /auth/sign-out
Clears the authentication cookies.

**Response (200 OK):**
```json
{
  "success": true,
  "message": "User signed out successfully"
}
```

### GET /auth/me
Returns the profile of the currently authenticated user. Requires the `accesstoken` cookie or `Authorization: Bearer <token>` header.

**Response (200 OK):**
```json
{
  "success": true,
  "message": "User fetched successfully",
  "data": {
    "id": "user-uuid",
    "username": "johndoe",
    "fullname": "John Doe",
    "email": "john@example.com",
    "emailVerified": false,
    "gender": "male",
    "dateofbirth": "1990-01-01",
    "createdAt": "2026-04-30T00:00:00Z",
    "updatedAt": null
  }
}
```

---

## OAuth Client Management Endpoints

These endpoints allow authenticated users to manage their registered third-party OAuth applications. All routes require first-party authentication.

### POST /oauth/clients
Registers a new client application.

**Request Body:**
```json
{
  "appName": "My Third Party App",
  "websiteUrl": "https://myapp.com",
  "redirectUris": ["https://myapp.com/callback"]
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "OAuth client created successfully. Save the client_secret — it won't be shown again.",
  "data": {
    "id": "client-uuid",
    "appName": "My Third Party App",
    "clientId": "hex-client-id",
    "clientSecret": "hex-client-secret",
    "websiteUrl": "https://myapp.com",
    "redirectUris": ["https://myapp.com/callback"],
    "createdAt": "2026-04-30T00:00:00Z"
  }
}
```

### GET /oauth/clients
Lists all clients registered by the authenticated user.

**Response (200 OK):** Array of client objects (excluding `clientSecret`).

### GET /oauth/clients/:id
Retrieves details of a specific client.

### DELETE /oauth/clients/:id
Deletes a specific client.

---

## OIDC and OAuth 2.0 Protocol Endpoints

### GET /.well-known/openid-configuration
Standard OIDC Discovery endpoint. Returns a JSON document outlining supported protocols, endpoints, scopes, and claims.

### GET /auth/certs
JSON Web Key Set (JWKS) endpoint. Exposes the RSA public keys used by clients to verify the signatures of the JWT Access Tokens and ID Tokens issued by the server.

### GET /o/authorize
The Authorization Endpoint. Requires browser interaction.

**Query Parameters:**
- `client_id`: The ID of the client application.
- `redirect_uri`: Where to redirect the user after authorization.
- `response_type`: Must be `code`.
- `scope`: Space-separated string of scopes (must include `openid`).
- `state`: (Optional) Opaque value used by the client to maintain state.

**Behavior:**
- If not logged in, returns a JSON response indicating `login_required` with redirect URLs.
- If consent is needed, returns a JSON response indicating `consent_required` with application details.
- If logged in and consented, redirects the browser to `redirect_uri?code=auth_code&state=xyz`.

### POST /o/consent
Internal endpoint used by the consent screen UI to submit the user's decision. Requires first-party authentication.

**Request Body:**
```json
{
  "client_id": "hex-client-id",
  "redirect_uri": "https://myapp.com/callback",
  "scope": "openid profile email",
  "state": "xyz",
  "approved": true
}
```

**Response (200 OK):**
```json
{
  "redirect_url": "https://myapp.com/callback?code=auth_code&state=xyz"
}
```

### POST /o/token
The Token Endpoint. Used by clients to exchange an authorization code or refresh token for new access tokens.

**Request Body (Authorization Code Grant):**
```json
{
  "grant_type": "authorization_code",
  "code": "auth_code_received",
  "redirect_uri": "https://myapp.com/callback",
  "client_id": "hex-client-id",
  "client_secret": "hex-client-secret"
}
```

**Request Body (Refresh Token Grant):**
```json
{
  "grant_type": "refresh_token",
  "refresh_token": "refresh-token-string",
  "client_id": "hex-client-id",
  "client_secret": "hex-client-secret"
}
```

**Response (200 OK):**
```json
{
  "access_token": "jwt-access-token",
  "token_type": "Bearer",
  "expires_in": 600,
  "refresh_token": "new-refresh-token",
  "id_token": "jwt-id-token",
  "scope": "openid profile email"
}
```

### GET /o/userinfo
Returns identity claims about the authenticated user based on the scopes granted.

**Headers:**
`Authorization: Bearer <access_token>`

**Response (200 OK):**
```json
{
  "sub": "user-uuid",
  "name": "John Doe",
  "given_name": "John",
  "family_name": "Doe",
  "gender": "male",
  "birthdate": "1990-01-01",
  "email": "john@example.com",
  "email_verified": false
}
```

---

## Security Features

1. **Password Protection:** Uses SHA-256 HMAC with randomly generated salts.
2. **Client Secrets:** Stored securely as SHA-256 hashes in the database. Raw secrets are only displayed once upon creation.
3. **Token Cryptography:** JWTs (Access and ID tokens) are signed using RS256 (RSA 2048-bit keys).
4. **Refresh Token Rotation:** Every time a refresh token is used, it is revoked and replaced with a new one. Reuse of a revoked token will be blocked.
5. **Strict Validation:** Input validation using Zod guarantees type safety across all endpoints.

---

## Setup and Configuration

### Prerequisites
- Node.js 18+
- PostgreSQL
- pnpm

### Installation

1. Install dependencies:
```bash
pnpm install
```

2. Configure environment variables (`.env`):
```env
DATABASE_URL=postgresql://user:password@localhost:5432/oidc_db
ISSUER=http://localhost:8000
PORT=8000
AUTHORIZE_URL=http://localhost:3000
```

3. Generate RSA Key Pair for JWT signing:
```bash
bash key-gen.sh
```

4. Apply database migrations:
```bash
pnpm db:generate
pnpm db:push
```

5. Start the server:
```bash
pnpm dev
```
