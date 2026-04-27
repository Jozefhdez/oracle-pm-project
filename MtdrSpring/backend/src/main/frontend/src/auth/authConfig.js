export const oidcConfig = {
  authority: process.env.REACT_APP_OIDC_AUTHORITY,
  client_id: process.env.REACT_APP_OIDC_CLIENT_ID,
  client_secret: process.env.REACT_APP_OIDC_CLIENT_SECRET,
  client_authentication: 'client_secret_post',
  redirect_uri: `${window.location.origin}/callback`,
  scope: 'openid profile email',
  automaticSilentRenew: true,
  loadUserInfo: true,
  prompt: 'login',
};
