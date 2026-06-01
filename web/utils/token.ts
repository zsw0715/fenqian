let accessToken: string | null = null;

const REFRESH_TOKEN_KEY = "refresh_token";

export function setAccessToken(token: string) {
  accessToken = token;
}

export function getAccessToken(): string | null {
  return accessToken;
}

export function setRefreshToken(token: string) {
  localStorage.setItem(REFRESH_TOKEN_KEY, token);
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function clearAuth() {
  accessToken = null;
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}
