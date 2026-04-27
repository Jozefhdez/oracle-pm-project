export const oidcConfig = {
  authority: process.env.REACT_APP_OIDC_AUTHORITY,
  client_id: process.env.REACT_APP_OIDC_CLIENT_ID,
  client_secret: process.env.REACT_APP_OIDC_CLIENT_SECRET,
  redirect_uri: `${window.location.origin}/callback`,
  response_type: 'token id_token',
  scope: 'openid profile email',
  automaticSilentRenew: false,
  loadUserInfo: true,
  prompt: 'login',
};
