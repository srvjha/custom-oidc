import jose from "node-jose";
import { PUBLIC_KEY } from "./utils/certs.js";

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
