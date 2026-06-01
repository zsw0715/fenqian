let accessToken: string | null = null;

const REFRESH_TOKEN_KEY = "refresh_token";
const USER_IDENTITY_KEY = "user_identity";

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

export function setUserIdentity(identity: string) {
    localStorage.setItem(USER_IDENTITY_KEY, identity);
}

export function getUserIdentity(): string | null {
    return localStorage.getItem(USER_IDENTITY_KEY);
}

export function clearAuth() {
    accessToken = null;
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_IDENTITY_KEY);
}
