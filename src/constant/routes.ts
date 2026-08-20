export const ROUTES = {
  login: "/login",
  reports: "/reports",
  applications: "/applications",
  applicationsPending: "/applications/pending",
  applicationDetail: (id: string) => `/applications/${id}`,
  profile: "/profile",
  settings: "/settings",
} as const;
