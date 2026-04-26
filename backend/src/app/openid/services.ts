import jose from "node-jose";
import { PUBLIC_KEY } from "./utils/certs.js";
import type { AuthorizeRequestModel } from "./models.js";

export const handleOpenIdConfig = async () => {
  const wellKnownConfig = {
    issuer: process.env.ISSUER_URL,
    authorization_endpoint: `${process.env.ISSUER_URL}/o/authorize`,
    token_endpoint: `${process.env.ISSUER_URL}/auth/token`,
    userinfo_endpoint: `${process.env.ISSUER_URL}/auth/userinfo`,
    jwks_uri: `${process.env.ISSUER_URL}/auth/certs`,
  };
  return wellKnownConfig;
};

export const handleJwks = async () => {
  const key = await jose.JWK.asKey(PUBLIC_KEY, "pem");
  return key;
};

export const handleAuthorize = async (data: AuthorizeRequestModel) => {
  const { client_id, redirect_uri, response_type, scope, state } = data;
  const authUrl = new URL(`${process.env.ISSUER_URL}/o/authorize`);
  authUrl.searchParams.set("client_id", client_id);
  authUrl.searchParams.set("redirect_uri", redirect_uri);
  authUrl.searchParams.set("response_type", response_type);
  authUrl.searchParams.set("scope", scope);
  state && authUrl.searchParams.set("state", state);
  return authUrl.toString();
};
