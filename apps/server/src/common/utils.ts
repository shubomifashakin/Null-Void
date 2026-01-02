export function makeBlacklistedKey(token: string): string {
  return `blacklist:${token}`;
}

export function makeOauthStateKey(token: string): string {
  return `oauth_state:${token}`;
}
