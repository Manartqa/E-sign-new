export const ROUTES = {
  login: "/login",
  /** the รายงาน sidebar group; the bare path redirects to the overview */
  reports: "/reports",
  reportsOverview: "/reports/overview",
  signatureReport: "/reports/signature-verification",
  logonLogs: "/settings/logs/logon",
  changeLogs: "/settings/logs/changes",
  applications: "/applications",
  applicationsPending: "/applications/pending",
  applicationDetail: (id: string) => `/applications/${id}`,
  profile: "/profile",
  settings: "/settings",
  signingWorkflows: "/settings/signing-workflows",
  roles: "/settings/roles",
  users: "/settings/users",
} as const;
