/**
 * Central route paths (use in links, redirects, middleware checks).
 */
export const routes = {
  home: "/",
  login: "/login",
  signup: "/signup",
  dashboard: "/dashboard",
  onboarding: "/onboarding",
  authCallback: "/auth/callback",
} as const;

/** Pathnames where an authenticated user is redirected away to dashboard. */
export const authPaths: readonly string[] = [routes.login, routes.signup];
