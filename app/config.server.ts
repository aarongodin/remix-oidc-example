export const config = {
  sessionSecret: process.env.SESSION_SECRET || "",
  oidcIssuer: process.env.OIDC_ISSUER || "",
  oidcClientID: process.env.OIDC_CLIENT_ID || "",
  oidcClientSecret: process.env.OIDC_CLIENT_SECRET || "",
  oidcAudience: process.env.OIDC_AUDIENCE || "",
  oidcRedirectBase: process.env.OIDC_REDIRECT_BASE
}
