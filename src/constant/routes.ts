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
  roleNew: "/settings/roles/new",
  roleEdit: (id: string) => `/settings/roles/${id}`,
} as const;
