/**
 * The single account the mock backend accepts. Anything else is rejected, so
 * the login form's error state is reachable without a real backend.
 * There is no role gating anywhere in the app yet, so this account reaches
 * every screen and action.
 */
export const MOCK_CREDENTIALS = {
  username: "manart.pa@smartalliance.co.th",
  pwd: "P@ssw0rd",
} as const;
