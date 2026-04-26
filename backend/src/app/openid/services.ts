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
