/**
 * Central route paths (use in links, redirects, middleware checks).
 */
export const routes = {
  home: "/",
  login: "/login",
  signup: "/signup",
  forgotPassword: "/forgot-password",
  resetPassword: "/reset-password",
  dashboard: "/dashboard",
  campaigns: "/dashboard/campaigns",
  onboarding: "/onboarding",
  authCallback: "/auth/callback",
} as const;

/** Dynamic route helpers for parameterised paths. */
export const campaignDetailRoute = (id: string) =>
  `/dashboard/campaigns/${id}`;

export const newInfluencerRoute = (campaignId: string) =>
  `/dashboard/campaigns/${campaignId}/influencers/new`;

export const editInfluencerRoute = (campaignId: string, influencerId: string) =>
  `/dashboard/campaigns/${campaignId}/influencers/${influencerId}/edit`;

/** Pathnames where an authenticated user is redirected away to dashboard. */
export const authPaths: readonly string[] = [routes.login, routes.signup];
