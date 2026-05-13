export const oidcConfig = {
  authority: 'https://idcs-a333fea8b68e4aff8867ff6094453a03.identity.oraclecloud.com',
  client_id: '7809ed300a374eafa7bb9403f8f1ff01',
  client_secret: 'd1ca0425-b462-45b6-ac8f-3f4445c19f09',
  client_authentication: 'client_secret_post',
  redirect_uri: `${window.location.origin}/callback`,
  scope: 'openid profile email',
  automaticSilentRenew: true,
  loadUserInfo: true,
  prompt: 'login',
};
