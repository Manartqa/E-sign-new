export const ROUTES = {
  login: "/login",
  reports: "/reports",
  applications: "/applications",
  applicationsPending: "/applications/pending",
  applicationDetail: (id: string) => `/applications/${id}`,
  profile: "/profile",
  settings: "/settings",
  signingWorkflows: "/settings/signing-workflows",
  signers: "/settings/signers",
  roles: "/settings/roles",
  users: "/settings/users",
} as const;
