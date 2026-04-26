# OIDC Authentication Service

A production-ready **OpenID Connect (OIDC)** server implementation built with Node.js, Express, TypeScript, and PostgreSQL. This service provides secure user authentication using industry-standard JWT-based tokens.

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Workflow & Complete User Journey](#workflow--complete-user-journey)
4. [API Endpoints](#api-endpoints)
5. [Token Management](#token-management)
6. [Database Schema](#database-schema)
7. [Security Features](#security-features)
8. [Setup & Configuration](#setup--configuration)
9. [Usage Examples](#usage-examples)
10. [Error Handling](#error-handling)

---

## Overview

### What is OIDC?

OpenID Connect (OIDC) is an authentication protocol built on top of OAuth 2.0 that allows applications to:
- Verify user identity
- Obtain user information
- Maintain secure sessions via tokens

### What This Service Provides

This OIDC server handles:
- User registration with email/password
- User login with token generation
- Token refresh to maintain sessions
- Access token verification for protected resources
- User information retrieval
- OIDC discovery endpoint for standard compliance
- JWKS (JSON Web Key Set) endpoint for public key distribution
- RSA-2048 digital signatures on all tokens

---

## Architecture

### Core Components

```
┌─────────────────────────────────────────────────────────────┐
│                    OIDC Authentication Service              │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────┐        ┌──────────────────────────┐   │
│  │  Express Routes  │        │  Database (PostgreSQL)   │   │
│  │  - /register     │        │  - users                 │   │
│  │  - /token        │───────▶│  - refresh_tokens        │   │
│  │  - /userinfo     │        │                          │   │
│  │  - /certs        │        │                          │   │
│  └──────────────────┘        └──────────────────────────┘   │
│           │                                                   │
│           │                                                   │
│  ┌────────▼──────────────────────────────────────────────┐   │
│  │           JWT & Cryptography Layer                    │   │
│  │  - RSA-2048 Key Pair (private.pem, public.pem)       │   │
│  │  - JWT Signing (Access, ID, Refresh tokens)          │   │
│  │  - JWT Verification                                  │   │
│  └─────────────────────────────────────────────────────┘   │
│           ▲                                                   │
│           │                                                   │
│  ┌────────┴──────────────────────────────────────────────┐   │
│  │           Security & Middleware                       │   │
│  │  - Authentication (Bearer token validation)          │   │
│  │  - Password hashing (Scrypt + salt)                  │   │
│  │  - Error handling                                    │   │
│  │  - Input validation (Zod schemas)                    │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### Technology Stack

| Layer | Technology |
|-------|-----------|
| **Runtime** | Node.js (TypeScript) |
| **Web Framework** | Express.js 5.x |
| **Database** | PostgreSQL |
| **ORM** | Drizzle ORM |
| **JWT** | jose (JWT creation & verification) |
| **Crypto** | Node.js built-in `crypto` module |
| **Validation** | Zod |
| **Dev Tools** | tsc-watch, drizzle-kit |

---

## Workflow & Complete User Journey

### 1. **Complete Registration & Login Flow**

```
┌──────────────┐
│   New User   │
└──────┬───────┘
       │
       ▼
   POST /register
   ├─ Email
   ├─ Password (8+ chars)
   ├─ Full Name
   └─ Username (optional)
       │
       ▼
   ┌─ Validate Input (Zod Schema)
   ├─ Check if email already exists
   ├─ Generate salt (32 bytes random)
   ├─ Hash password using Scrypt(password, salt)
   ├─ Insert user into database
   └─ Generate 3 tokens (Access, ID, Refresh)
       │
       ▼
   Returns:
   {
     user: { id, email, fullname },
     access_token: "eyJhbGc...",
     id_token: "eyJhbGc...",
     refresh_token: "eyJhbGc...",
     token_type: "Bearer",
     expires_in: 900
   }
```

### 2. **Login Process (Resource Owner Password Flow)**

```
┌──────────────┐
│  Registered  │
│     User     │
└──────┬───────┘
       │
       ▼
   POST /token
   {
     grant_type: "password",
     email: "user@example.com",
     password: "password123"
   }
       │
       ▼
   ┌─ Validate input
   ├─ Find user by email
   ├─ Verify password:
   │  └─ Hash attempt with stored salt
   │  └─ Compare with stored hash
   ├─ Password matches? YES → Generate tokens
   └─ Password mismatch? NO → Return 401 Unauthorized
       │
       ▼
   Returns 3 tokens (same as registration)
```

### 3. **Access Protected Resources**

```
┌──────────────────────┐
│  Client Application  │
└──────────┬───────────┘
           │
           ▼
   GET /userinfo
   Headers: {
     Authorization: "Bearer <access_token>"
   }
           │
           ▼
   ┌─ Extract token from Authorization header
   ├─ Verify JWT signature (using public key)
   ├─ Check:
   │  ├─ Issuer matches
   │  ├─ Audience matches
   │  ├─ Token not expired
   │  ├─ Token type is "access" (not refresh)
   │  └─ All claims valid
   ├─ Attach decoded claims to request.user
   └─ Call next middleware
           │
           ▼
   Get user info from database
           │
           ▼
   Returns: { sub, name, email, email_verified, ... }
```

### 4. **Token Refresh Flow**

```
┌──────────────────┐
│  Access Expired  │
└──────┬───────────┘
       │
       ▼
   POST /token
   {
     grant_type: "refresh_token",
     refresh_token: "eyJhbGc..."
   }
       │
       ▼
   ┌─ Verify refresh token JWT
   ├─ Extract jti (token ID) from claims
   ├─ Check database:
   │  ├─ Token exists
   │  ├─ Token not revoked
   │  └─ Token not expired
   ├─ Mark old refresh token as revoked
   ├─ Fetch user details
   └─ Generate new token set
       │
       ▼
   Returns new tokens with updated expiry
```

---

## API Endpoints

### 1. **POST /auth/register** - User Registration

**Purpose:** Register a new user account

**Request:**
```http
POST http://localhost:8000/auth/register
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "SecurePass123",
  "fullname": "John Doe",
  "username": "johndoe"
}
```

**Required Fields:**
- `email` (string): Valid email address, must be unique
- `password` (string): Minimum 8 characters
- `fullname` (string): User's full name, max 25 characters
- `username` (string, optional): Unique username, 3-20 characters

**Response (201 Created):**
```json
{
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "john@example.com",
      "fullname": "John Doe"
    },
    "access_token": "eyJhbGciOiJSUzI1NiIsImtpZCI6ImY1YTcyNWNiZDI2ZjEyOTkiLCJ0eXAiOiJKV1QifQ...",
    "id_token": "eyJhbGciOiJSUzI1NiIsImtpZCI6ImY1YTcyNWNiZDI2ZjEyOTkiLCJ0eXAiOiJKV1QifQ...",
    "refresh_token": "eyJhbGciOiJSUzI1NiIsImtpZCI6ImY1YTcyNWNiZDI2ZjEyOTkiLCJ0eXAiOiJKV1QifQ...",
    "token_type": "Bearer",
    "expires_in": 900
  }
}
```

**Error Responses:**
- `400 Bad Request`: Invalid email format, password too short
- `409 Conflict`: Email already exists

---

### 2. **POST /auth/token** - Token Endpoint (Login & Refresh)

#### A. Login with Credentials (password grant)

**Purpose:** Authenticate user and obtain tokens

**Request:**
```http
POST http://localhost:8000/auth/token
Content-Type: application/json

{
  "grant_type": "password",
  "email": "john@example.com",
  "password": "SecurePass123"
}
```

**Alternative with username:**
```http
{
  "grant_type": "password",
  "username": "johndoe",
  "password": "SecurePass123"
}
```

**Required Fields:**
- `grant_type` (string): Must be `"password"`
- `email` or `username` (string): User identifier
- `password` (string): User's password

**Response (200 OK):**
```json
{
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "john@example.com",
    "fullname": "John Doe"
  },
  "access_token": "eyJhbGciOiJSUzI1NiIsImtpZCI6ImY1YTcyNWNiZDI2ZjEyOTkiLCJ0eXAiOiJKV1QifQ...",
  "id_token": "eyJhbGciOiJSUzI1NiIsImtpZCI6ImY1YTcyNWNiZDI2ZjEyOTkiLCJ0eXAiOiJKV1QifQ...",
  "refresh_token": "eyJhbGciOiJSUzI1NiIsImtpZCI6ImY1YTcyNWNiZDI2ZjEyOTkiLCJ0eXAiOiJKV1QifQ...",
  "token_type": "Bearer",
  "expires_in": 900
}
```

**Error Responses:**
- `401 Unauthorized`: Invalid email/password

---

#### B. Refresh Access Token (refresh_token grant)

**Purpose:** Obtain new access token using refresh token

**Request:**
```http
POST http://localhost:8000/auth/token
Content-Type: application/json

{
  "grant_type": "refresh_token",
  "refresh_token": "eyJhbGciOiJSUzI1NiIsImtpZCI6ImY1YTcyNWNiZDI2ZjEyOTkiLCJ0eXAiOiJKV1QifQ..."
}
```

**Required Fields:**
- `grant_type` (string): Must be `"refresh_token"`
- `refresh_token` (string): Valid, non-revoked refresh token

**Response (200 OK):**
```json
{
  "access_token": "eyJhbGciOiJSUzI1NiIsImtpZCI6ImY1YTcyNWNiZDI2ZjEyOTkiLCJ0eXAiOiJKV1QifQ...",
  "id_token": "eyJhbGciOiJSUzI1NiIsImtpZCI6ImY1YTcyNWNiZDI2ZjEyOTkiLCJ0eXAiOiJKV1QifQ...",
  "refresh_token": "eyJhbGciOiJSUzI1NiIsImtpZCI6ImY1YTcyNWNiZDI2ZjEyOTkiLCJ0eXAiOiJKV1QifQ...",
  "token_type": "Bearer",
  "expires_in": 900
}
```

**Error Responses:**
- `400 Bad Request`: Invalid grant_type or missing refresh_token
- `401 Unauthorized`: Token invalid, expired, or revoked

---

### 3. **GET /auth/userinfo** - Get User Information

**Purpose:** Retrieve authenticated user's profile information

**Request:**
```http
GET http://localhost:8000/auth/userinfo
Authorization: Bearer eyJhbGciOiJSUzI1NiIsImtpZCI6ImY1YTcyNWNiZDI2ZjEyOTkiLCJ0eXAiOiJKV1QifQ...
```

**Requirements:**
- Must send valid access token in `Authorization` header
- Token must not be expired
- Token type must be `"access"` (not refresh)
- Token signature must be valid (RSA-2048)

**Response (200 OK):**
```json
{
  "sub": "550e8400-e29b-41d4-a716-446655440000",
  "name": "John Doe",
  "username": "johndoe",
  "email": "john@example.com",
  "email_verified": false,
  "picture": null,
  "gender": null,
  "created_at": "2026-04-19T10:30:00.000Z",
  "updated_at": "2026-04-19T10:30:00.000Z"
}
```

**Error Responses:**
- `401 Unauthorized`: Missing/invalid/expired token
- `404 Not Found`: User not found in database

---

### 4. **GET /auth/certs** - JSON Web Key Set (JWKS)

**Purpose:** Distribute public keys for token verification

**Request:**
```http
GET http://localhost:8000/auth/certs
```

**Requirements:**
- Public endpoint (no authentication required)
- Results are cached for 24 hours (Cache-Control header)

**Response (200 OK):**
```json
{
  "keys": [
    {
      "kty": "RSA",
      "use": "sig",
      "kid": "f5a725cbd26f1299",
      "alg": "RS256",
      "n": "xjlCRBqn2HgGaEnE...",
      "e": "AQAB"
    }
  ]
}
```

**What Each Field Means:**
- `kty`: Key type (RSA)
- `use`: Key usage (sig = signature verification)
- `kid`: Key ID (unique identifier for this key)
- `alg`: Algorithm (RS256 = RSA with SHA-256)
- `n`: RSA modulus (public key component)
- `e`: RSA exponent (public key component)

---

### 5. **GET /.well-known/openid-configuration** - OIDC Discovery

**Purpose:** Provide OIDC server metadata and endpoint locations

**Request:**
```http
GET http://localhost:8000/.well-known/openid-configuration
```

**Requirements:**
- Public endpoint (no authentication required)
- Standard OIDC discovery endpoint

**Response (200 OK):**
```json
{
  "issuer": "http://localhost:8000",
  "authorization_endpoint": "http://localhost:8000/auth/token",
  "token_endpoint": "http://localhost:8000/auth/token",
  "userinfo_endpoint": "http://localhost:8000/auth/userinfo",
  "jwks_uri": "http://localhost:8000/auth/certs"
}
```

**What Each Endpoint Does:**
- `issuer`: Server identity (must match in JWT `iss` claim)
- `authorization_endpoint`: Where to redirect for authorization
- `token_endpoint`: Where to exchange credentials for tokens
- `userinfo_endpoint`: Where to get user information
- `jwks_uri`: Where to fetch public keys for verification

---

## Token Management

### Token Types & Structure

This service generates and uses three types of JWT tokens:

#### 1. **Access Token** (15 minutes validity)

**Purpose:** Prove authentication for API requests

**Claims:**
```json
{
  "alg": "RS256",
  "kid": "f5a725cbd26f1299",
  "typ": "JWT"
}
{
  "sub": "550e8400-e29b-41d4-a716-446655440000",
  "email": "john@example.com",
  "name": "John Doe",
  "token_type": "access",
  "iss": "http://localhost:8000",
  "aud": "http://localhost:8000",
  "iat": 1713607800,
  "exp": 1713608700,
  "jti": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
}
```

**Used For:**
- Access protected endpoints
- Included in `Authorization: Bearer <token>` header

---

#### 2. **ID Token** (15 minutes validity)

**Purpose:** Contains user identity information (OpenID Connect standard)

**Claims:**
```json
{
  "sub": "550e8400-e29b-41d4-a716-446655440000",
  "email": "john@example.com",
  "name": "John Doe",
  "email_verified": false,
  "iss": "http://localhost:8000",
  "aud": "http://localhost:8000",
  "iat": 1713607800,
  "exp": 1713608700
}
```

**Used For:**
- Authentication proof to client applications
- Usually decoded by frontend to display user info

---

#### 3. **Refresh Token** (7 days validity)

**Purpose:** Obtain new access tokens without re-entering credentials

**Claims:**
```json
{
  "sub": "550e8400-e29b-41d4-a716-446655440000",
  "token_type": "refresh",
  "iss": "http://localhost:8000",
  "aud": "http://localhost:8000",
  "iat": 1713607800,
  "exp": 1714212600,
  "jti": "refresh-token-id-uuid"
}
```

**Features:**
- Stored in database with revocation status
- Marked as `revoked: true` when new tokens generated
- Can be invalidated server-side (logout)

---

### JWT Signing Process

```
1. Create claims object
   {
     sub: userId,
     email: userEmail,
     ...
   }

2. Add header
   {
     alg: "RS256",
     kid: "f5a725cbd26f1299",
     typ: "JWT"
   }

3. Sign with RSA-2048 private key
   signature = RSA_SIGN(header.payload, privateKey)

4. Combine: header.payload.signature
   eyJhbGc....[header].[payload].[signature]
```

### JWT Verification Process

```
1. Extract from Authorization header
   "Bearer eyJhbGc..."
   
2. Split by dots
   [header, payload, signature]

3. Verify signature
   ✓ Signature matches RSA public key
   ✓ Matches issuer, audience, expiry, etc.

4. Extract claims
   Attach to request.user for controller access
```

---

## Database Schema

### Users Table

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(20) UNIQUE,
  fullname VARCHAR(25) NOT NULL,
  password TEXT NOT NULL,           -- Hashed with Scrypt
  salt TEXT NOT NULL,               -- Random 32-byte hex string
  avatar TEXT,                      -- Profile picture URL
  gender ENUM('male', 'female', 'other'),
  email VARCHAR(255) NOT NULL UNIQUE,
  email_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP
);
```

**Key Details:**
- `id`: Unique user identifier (UUID)
- `password` + `salt`: Scrypt-hashed password (never store plaintext)
- `email_verified`: For future email verification flows
- `avatar`, `gender`: Optional user profile fields

---

### Refresh Tokens Table

```sql
CREATE TABLE refresh_tokens (
  id UUID PRIMARY KEY,              -- Token JTI (JWT ID)
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  revoked BOOLEAN DEFAULT false,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT now()
);
```

**Key Details:**
- `id`: Matches JWT `jti` claim (unique token identifier)
- `user_id`: Foreign key to users table
- `revoked`: Set to true when refreshed (one-time use)
- `expires_at`: When token becomes invalid

**Why Store Refresh Tokens?**
- Track token family (detect compromised tokens)
- Enable server-side revocation (logout)
- Prevent token reuse
- Audit trail of sessions

---

## Security Features

### 1. **Password Security**
```typescript
// Scrypt hashing with salt
const salt = crypto.randomBytes(32).toString('hex');
const hash = crypto.scrypt(password, salt, 64);
// Result: Secure against rainbow tables & brute force
```

### 2. **JWT Signing**
- RSA-2048 asymmetric encryption
- Private key signs tokens (server-only)
- Public key verifies tokens (shareable)
- Tamper-proof: signature verification fails if token modified

### 3. **Token Validation**
```typescript
// Verified checks:
- Signature valid (RSA public key)
- Not expired (iat + exp claims)
- Correct issuer (iss claim)
- Correct audience (aud claim)
- Correct token type (access vs refresh)
```

### 4. **Refresh Token Rotation**
- Old token revoked when refreshed (prevents token reuse)
- Each refresh generates completely new token set
- Stolen token can be invalidated server-side

### 5. **Input Validation**
```typescript
// Zod schema validation
const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  fullname: z.string().min(1).max(25),
  username: z.string().min(3).max(20).optional(),
});
```

---

## Setup & Configuration

### Prerequisites
- Node.js 18+ (TypeScript)
- PostgreSQL 12+
- pnpm package manager

### Installation

1. **Clone and install dependencies:**
```bash
cd oidc
pnpm install
```

2. **Configure environment variables:**
```bash
# Create .env file
cat > .env << EOF
DATABASE_URL="postgresql://user:password@localhost:5432/oidc_db"
PORT=8000
ISSUER="http://localhost:8000"
NODE_ENV="development"
EOF
```

3. **Generate/Push database schema:**
```bash
# Generate migration files
pnpm db:generate

# Push schema to database
pnpm db:push

# Or run migrations
pnpm db:migrate
```

4. **Start development server:**
```bash
pnpm dev
```

Server runs on `http://localhost:8000`

### Key Management

**First startup:**
```
[keys] Generating new RSA-2048 key pair…
[keys] Key pair persisted to keys/
[keys] Key ID (kid): f5a725cbd26f1299
```

**Subsequent startups:**
```
[keys] Loading existing RSA key pair from disk…
```

**Key Files:**
- `keys/private.pem` - Keep secret, never commit to git
- `keys/public.pem` - Safe to distribute
- Add `keys/` to `.gitignore`

---

## Usage Examples

### Example 1: Complete User Journey

```bash
# 1. Register new user
curl -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "alice@example.com",
    "password": "SecurePassword123",
    "fullname": "Alice Smith",
    "username": "alice_smith"
  }'

# Response includes access_token, id_token, refresh_token
# Save these tokens for next steps
```

**Save the tokens:**
```bash
ACCESS_TOKEN="<access_token_from_response>"
REFRESH_TOKEN="<refresh_token_from_response>"
```

### Example 2: Access Protected Endpoint

```bash
# Get user info using access token
curl -X GET http://localhost:8000/auth/userinfo \
  -H "Authorization: Bearer $ACCESS_TOKEN"

# Response:
# {
#   "sub": "550e8400-e29b-41d4-a716-446655440000",
#   "name": "Alice Smith",
#   "email": "alice@example.com",
#   ...
# }
```

### Example 3: Login with Credentials

```bash
# Login to get new tokens
curl -X POST http://localhost:8000/auth/token \
  -H "Content-Type: application/json" \
  -d '{
    "grant_type": "password",
    "email": "alice@example.com",
    "password": "SecurePassword123"
  }'

# Response: { access_token, id_token, refresh_token, ... }
```

### Example 4: Refresh Access Token

```bash
# When access token expires (15 min), refresh it
curl -X POST http://localhost:8000/auth/token \
  -H "Content-Type: application/json" \
  -d '{
    "grant_type": "refresh_token",
    "refresh_token": "'$REFRESH_TOKEN'"
  }'

# Response: New { access_token, id_token, refresh_token, ... }
```

### Example 5: Get OIDC Discovery Info

```bash
# Discover available endpoints
curl http://localhost:8000/.well-known/openid-configuration

# Response shows all endpoint URLs and capabilities
```

### Example 6: Get Public Keys

```bash
# Fetch public keys for token verification
curl http://localhost:8000/auth/certs

# Use the public key (JWK) to verify tokens in your application
```

---

## Error Handling

### Error Response Format

All errors follow this standard format:

```json
{
  "error": "error_code",
  "error_description": "Human readable message",
  "details": {}
}
```

### Common Error Codes

| HTTP | Code | Meaning | Solution |
|------|------|---------|----------|
| 400 | `invalid_request` | Bad input format | Check request body/params |
| 400 | `invalid_email` | Email format invalid | Use valid email |
| 400 | `weak_password` | Password < 8 chars | Use longer password |
| 401 | `invalid_grant` | Wrong credentials | Verify email/password |
| 401 | `invalid_token` | Token expired/invalid | Refresh token or re-login |
| 401 | `unauthorized` | Missing auth header | Add `Authorization: Bearer <token>` |
| 409 | `user_exists` | Email already registered | Use different email |
| 500 | `server_error` | Unexpected error | Check server logs |

### Example Error Response

```bash
# Missing password field
curl -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "fullname": "Test"}'

# Response (400):
{
  "error": "bad_request",
  "error_description": "Password must be at least 8 characters"
}
```

---

## Production Deployment Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Use strong `DATABASE_URL` with SSL
- [ ] Set `ISSUER` to your production domain
- [ ] Enable HTTPS (TLS/SSL)
- [ ] Rotate RSA keys periodically
- [ ] Backup `keys/` directory securely
- [ ] Monitor refresh token revocation
- [ ] Implement rate limiting on `/token` endpoint
- [ ] Add email verification flow
- [ ] Set up centralized logging
- [ ] Enable CORS for trusted origins only
- [ ] Add password complexity requirements

---

## Code Files Reference

- **Entry Point:** [src/index.ts](src/index.ts)
- **Express App:** [src/app/index.ts](src/app/index.ts)
- **Auth Routes:** [src/app/auth/routes.ts](src/app/auth/routes.ts)
- **Auth Controllers:** [src/app/auth/controllers.ts](src/app/auth/controllers.ts)
- **Auth Services:** [src/app/auth/services.ts](src/app/auth/services.ts)
- **Authentication Middleware:** [src/middleware/authenticate.ts](src/middleware/authenticate.ts)
- **Database Schema:** [src/db/schema.ts](src/db/schema.ts)
- **Key Management:** [src/config/keys.ts](src/config/keys.ts)
- **Input Validation:** [src/app/auth/validator.ts](src/app/auth/validator.ts)

---

## Troubleshooting

### "Port 8000 already in use"
```bash
# Change port in .env
PORT=8001

# Or kill existing process
kill -9 $(lsof -ti :8000)
```

### "Invalid token" errors
```bash
# Check token expiry (15 minutes for access tokens)
# Use refresh token to get new access token
# Verify Authorization header format: "Bearer <token>"
```

### "User not found" after refresh
```bash
# User may have been deleted from database
# Refresh tokens are tied to user IDs via foreign key
# Delete refresh tokens when deleting users
```

### Database connection errors
```bash
# Verify DATABASE_URL in .env
# Test connection: psql $DATABASE_URL
# Ensure PostgreSQL is running
```

---

## Summary

This OIDC server provides:
✅ **User Management**: Register and authenticate users securely
✅ **Token-Based Auth**: JWT tokens with RSA signatures
✅ **Token Refresh**: Long-lived sessions without re-authentication
✅ **User Info Endpoint**: Retrieve authenticated user details
✅ **OIDC Compliance**: Standard discovery and JWKS endpoints
✅ **Security**: Password hashing, token signing, revocation

**Workflow Overview:**
1. User registers or logs in → Get tokens
2. Client uses access token → Access protected resources
3. Access token expires (15 min) → Use refresh token
4. Get new tokens → Continue using service
5. Server can revoke tokens → Implement logout

---

**Version:** 1.0.0  
**Last Updated:** April 2026  
**License:** ISC
