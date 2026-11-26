# Frontend improvement plan — legacy parity + new features

Goal: the new Next.js frontend supports every legacy SSPF signer rule (see [README.md](README.md) and parts 01–05)
plus the new features already in the design. The plan is phased. Each task lists the files it touches and how it is
verified.

Ground rule: **anything marked ❓ is asked before it is implemented.** Tasks without ❓ follow either the legacy rule or
a decision already recorded below.

---

## 0. Decisions recorded (2026-11-25)

| # | Topic | Decision |
|---|---|---|
| D1 | Signing order | **Sequential by step.** Only the signer whose step is current can act. Everyone else sees why they can't act yet. |
| D2 | Final signer's signing method | **Driven by the user's `signingMethod`.** `USB_TOKEN` → token + PIN via the signing agent. `CERTIFICATE_FILE` → server signs with the stored certificate, no token. |
| D3 | Session | **1 hour idle** timeout (was 15 min; changed 2026-11-26) with a warning before expiry and a "ต่อเวลา" option. After expiry, return to the same page after login. |
| D4 | Login | **SSO + password + MFA** (password login must pass MFA). |
| D5 | Legacy features to add | Signature verification report; signing history per `ครั้งที่` (revision); "คำขอที่ฉันลงนามแล้ว" view; usage log screens. |
| D6 | Extra list columns | `ส่งไปยัง/ขายให้กับ`, `วันที่คำขอ`, urgent remark (`หมายเหตุด่วน`). |
| D7 | Remark on approve | Optional remark field when approving/signing (single and bulk). |
| D8 | Bulk reject / return | Reason required: one reason + detail applied to every selected row. |

---

## 1. Gap summary (current code vs legacy rules)

| # | Gap in the current frontend | Legacy rule | Where now |
|---|---|---|---|
| G1 | Actions are shown whenever the **request** is `PENDING_APPROVAL`. A reviewer who already approved, or whose turn hasn't come, still sees `อนุมัติ` / `ไม่อนุมัติ` / `ส่งคืน`. | Only the current step's signer may act (`รายการนี้ลงนามแล้ว หรือยังไม่ถึงลำดับการลงนาม`). | `ApplicationDetailSummary.tsx:40-42`, `ApplicationTable.tsx:155-165`, `ApplicationBulkBar.tsx` |
| G2 | The final signer always signs with the USB token. | Level 20 signs with token **or** the server certificate (D2). | `SignatureModal.tsx` (`useToken = isFinalSigner`) |
| G3 | No remark when approving (`notes: ""`). | Remark optional on approve (D7), shown in history. | `ApplicationDetailContent.tsx` `handleSign`, `useBulkApplicationActions.ts` |
| G4 | Bulk reject/return sends an empty reason. | Remark required on reject (D8). | `BulkConfirmModal.tsx`, `useBulkApplicationActions.ts` |
| G5 | Bulk result: only the first error is kept; no list of which rows failed and why. | Server checks every row; legacy aborted the whole batch with one message. | `useBulkApplicationActions.ts` |
| G6 | No revision (`ครั้งที่`) in the history timeline. | History browsable per revision (D5). | `TimelineEvent`, `DetailPanelView` |
| G7 | No "what I decided" view. | `ดูคำขอที่ลงนาม` + filter อนุมัติ/ไม่อนุมัติ (D5). | — |
| G8 | Missing list columns. | `ส่งไปยัง/ขายให้กับ`, `วันที่คำขอ`, urgent remark (D6). | `ApplicationList.config.ts` `TABLE_COLUMNS` |
| G9 | Workflow editor does not require exactly one final signer, nor keep the final signer last. | Level 20 is the final signer; licence issued on its approval. | `SigningWorkflowFormContent.tsx:131-141`, `SignerChainEditor.tsx` |
| G10 | Workflow has no `ใช้งาน` / `หมายเหตุ`. | Legacy process has both (inactive must not be picked for new requests). | `types/app/signingWorkflows` |
| G11 | Session cookie lives 30 days; no idle timeout, no warning. | Legacy 5 min idle (D3: 15 min + warning). | `lib/session-cookie.ts:40` |
| G12 | No MFA. | D4. | `components/partials/Login` |
| G13 | No bfcache reload after logout (a page restored with Back can show data). | Legacy forces reload on `pageshow` persisted. | `app/layout.tsx` |
| G14 | No signature verification report; `/reports` is a dashboard only. | D5. | `components/partials/Reports` |
| G15 | No log screens. | D5. | — |
| G16 | Change-password modal may not match the server password rules. | min `max(8, PasswordMinLength)`, max 128, not all same char, not common, not containing username, differs from old; 3 wrong old passwords lock. | `ChangePasswordModal.tsx` |

Already correct, keep as is: urgent pinned first; selection only on actionable rows; confirmation dialogs; success
toasts; token e-mail must equal signed-in user; permission-based hiding of buttons and menu; route permission guard
(`AdminLayout.config`); reject/return reason modal on the detail page.

---

## 2. Phases

Order matters: Phase 1 changes the data contract every later phase uses.

### Phase 1 — Data contract (types + mocks)

All behaviour below needs data the frontend does not have yet. Define it in `src/types` and the mocks first, so screens
can be built before the backend exists. Each item becomes a backend requirement (§4).

| Task | Change | Files |
|---|---|---|
| 1.1 | Per-signer state on each application: `myStep: { stepNo, status: "WAITING_PREVIOUS" \| "MY_TURN" \| "APPROVED" \| "REJECTED" \| "RETURNED", decidedAt?, remark? } \| null` and `canAct: boolean` (backend-computed). Replaces "status == PENDING" as the action condition. | `types/app/applications`, `types/api/main/application`, `mocks/applications.mock.ts`, `services/application.service.ts` |
| 1.2 | `signingMethod` of the signed-in user on the profile (needed to choose token vs server signing). | `types/app/profile`, `mocks/profile.mock.ts` |
| 1.3 | List row fields: `buyerName`, `documentDate`, `urgentRemark`. | `types/app/applications`, mocks, `toItem` |
| 1.4 | Timeline events carry `revisionNo`, `stepNo`, `approvalLevel`, `remark`; detail carries `revisions: number[]`. | `types/app/applications`, `mocks/applicationDetail.mock.ts` |
| 1.5 | Sign request carries `notes` (D7) and `method: "USB_TOKEN" \| "CERTIFICATE_FILE"`; server-sign has no signature payload. | `types/api/main/application` |
| 1.6 | Bulk endpoint contract returning per-row results `{ id, ok, message? }`. Until it exists, keep the fan-out. | `services/application.service.ts`, `hooks/applications/useBulkApplicationActions.ts` |
| 1.7 | New permission keys: `REPORTS:SIGNATURE_VERIFICATION` ❓(name), `LOGS:VIEW`. | `types/app/roles` |

Verify: `npm run lint`, `tsc`, existing vitest + e2e still pass; mocks cover each `myStep.status`.

**Status (2026-11-26): done.** Differences from the table above:
- 1.4: no separate `revisions` field — the timeline's `revisionNo` per event is enough; Phase 3.3 derives the ครั้งที่ list from it. Every fifth mock request is on round 2 (round 1 sent back at step 1).
- 1.5: `method` is `"CONFIRM" | "USB_TOKEN" | "CERTIFICATE_FILE"` — `CONFIRM` covers earlier signers who approve without a digital signature. Callers send `USB_TOKEN` when a token signed, else `CONFIRM`; `CERTIFICATE_FILE` arrives with Phase 2.3.
- 1.6: `BulkRowResult` type; `useBulkApplicationActions` now also returns `results` (one per row, with the failure message). No batch endpoint call yet.
- 1.7: per user decision — the signature verification report uses the existing `REPORTS:VIEW`; logs get two keys, modelled as two matrix rows so no new columns: `LOGON_LOGS:VIEW` (legacy SC05) and `CHANGE_LOGS:VIEW` (legacy SC04).
- Mock chain state lives in `mocks/signingChain.mock.ts`, shared by the list (`myStep`, `canAct`) and the detail history so they always agree. Screens still gate on request status — switching them to `canAct` is Phase 2.1–2.2.
- e2e: 46/49 pass. The 3 failures also fail with Phase 1 stashed: the list-sort test (pre-existing) and two sign-out tests (environment: `.env.local` `NEXTAUTH_URL` now points at `172.16.10.35`). The first password sign-in after a cold dev-server start can also fail the setup step; warm the server first.

### Phase 2 — Signing flow (highest priority)

| Task | Behaviour | Files |
|---|---|---|
| 2.1 | Action buttons on the detail page show only when `canAct`. Otherwise a notice: `WAITING_PREVIOUS` → "รอผู้ลงนามลำดับก่อนหน้า"; already decided → "คุณ{อนุมัติ/ไม่อนุมัติ/ส่งคืน}คำขอนี้แล้วเมื่อ …". | `ApplicationDetailSummary.tsx` |
| 2.2 | List checkboxes and row actions use `canAct`, not request status. `/applications/pending` = rows where `canAct` (my turn), urgent first. | `ApplicationTable.tsx`, `ApplicationList.config.ts` (`PENDING_FILTERS`), service mock filter |
| 2.3 | Signing method per D2: `USB_TOKEN` → existing `TokenSignPanel`; `CERTIFICATE_FILE` → confirm-only modal with the certificate name/expiry from the profile; server errors shown verbatim (`ไม่พบ Certificate File`, `PIN หรือไฟล์ใบรับรองไม่ถูกต้อง`, certificate not-yet-valid / expired). Reviewers (not final) keep the button confirm. | `SignatureModal.tsx`, `ApplicationDetailContent.tsx`, `useBulkApplicationActions.ts` |
| 2.4 | Optional `หมายเหตุ` textarea (max 512) in `SignatureModal`, single and bulk (D7). | `SignatureModal.tsx` |
| 2.5 | Bulk reject/return reuses `ReturnForEditModal` (reason + required detail) and applies it to all rows (D8). `BulkConfirmModal` remains only as the count confirmation inside it, or is removed. | `BulkConfirmModal.tsx`, `ReturnForEditModal.tsx`, `ApplicationListContent.tsx` |
| 2.6 | Bulk result dialog: "สำเร็จ n รายการ / ไม่สำเร็จ m รายการ" with each failed request number and the server message; failed rows stay selected. | new `BulkResultModal.tsx`, `useBulkApplicationActions.ts` |
| 2.7 | Map server decision errors to the legacy texts: `ผลการพิจารณาไม่ถูกต้อง`, `ผู้ใช้นี้ไม่ใช่ผู้ลงนามของรายการนี้`, `รายการนี้ลงนามแล้ว หรือยังไม่ถึงลำดับการลงนาม`, `ไม่พบข้อมูล ผู้ลงนามในข้อมูลอ้างอิง`, `ลายมือชื่อดิจิทัลไม่ถูกต้อง (…)`. On "not your turn / already signed" refresh the detail. | `lib/api/interceptor.ts` or a small error map in the service |
| 2.8 | Reject by the final signer never asks for the token (legacy bug 7). | `ApplicationDetailContent.tsx` (already true; keep a test) |

Verify: vitest for `canAct` gating and method selection; Playwright `signing.spec.ts` cases — reviewer waiting,
reviewer my-turn approve with remark, final signer token, final signer server certificate, bulk reject without reason
blocked, bulk partial failure listed.

**Status (2026-11-26): done.** Decision added: the รอการอนุมัติ menu, its sidebar badge and the รอการอนุมัติ stat
card count only requests waiting for the officer's decision now (`MY_TURN_FILTER` = `canAct`), as in legacy; the
other pending requests are under คำขอทั้งหมด, so the stat cards no longer add up to the total. Notes:
- One `approveApplication` service call (USB token → sign / server certificate / confirm) is used by the detail page,
  the table's quick action and bulk; `signMethodFor` picks the method. A token failure (`TokenSignError`) shows beside
  the PIN, any other failure is a toast with the backend's message, and detail/list/stats refetch after any outcome.
- A final signer whose วิธีลงลายเซ็นต์ is unset or `E_DOCUMENT` is told to contact the admin and cannot confirm. ❓
  what `E_DOCUMENT` should do is still open (§3).
- `BulkConfirmModal` is removed (bulk reject/return use `ReturnForEditModal` with a count line); `MOCK_CERTIFICATE`
  is removed (no stand-in signature is sent any more).
- Tests: `lib/sign-method.test.ts`, `stepNotice` tests; new `e2e/turn-order.spec.ts` (waiting / already-approved
  notices, approve remark, bulk reject reason); `applications.spec.ts` stat test updated. The server-certificate dialog
  was checked once with a temporary mock (sombat → `CERTIFICATE_FILE`), reverted; no permanent e2e for it, because
  both mock officers use the token. Bulk partial-failure listing has no e2e: the mock never fails a row.
- 2.7: no `{message}` → legacy text table in the frontend; the backend is expected to send the legacy texts as
  `message`, which are shown as-is.

### Phase 3 — List and detail parity

| Task | Behaviour | Files |
|---|---|---|
| 3.1 | Add columns `ส่งไปยัง/ขายให้กับ` (empty → "—"), `วันที่คำขอ` (พ.ศ.), urgent remark as tooltip on the ด่วน badge (D6). | `ApplicationList.config.ts`, `ApplicationTable.tsx` |
| 3.2 | "คำขอที่ฉันลงนามแล้ว" view (D5): a tab or route listing requests where `myStep` is decided, filter อนุมัติ / ไม่อนุมัติ / ส่งคืน / ทั้งหมด, default sort decision date newest first, default date window ❓. | new route `/applications/signed` ❓ or tab in `/applications`, `ROUTES`, Sidebar |
| 3.3 | History timeline with `ครั้งที่` selector (default latest), showing level label (`ผู้ตรวจสอบ n` / `ผู้ตรวจสอบและลงนาม`), decision, date-time พ.ศ., remark (D5). | `DetailPanelView.tsx` timeline panel |
| 3.4 | Request-type labels from master data; make sure the legacy types (อ.1/อ.3/อ.20, อ.9, อ.4, อ.15, อ.14) exist with correct spelling (`ส่งออก`). | `mocks/applications.mock.ts` |
| 3.5 | Keyword search also covers `buyerName`. | `application.service.ts` mock filter |
| 3.6 | **Done (2026-11-25):** a detail tab the backend sends no panel for is hidden instead of showing "ไม่มีข้อมูลในหัวข้อนี้"; the first visible tab opens by default; a request with no panels shows one empty state. | `ApplicationDetail.config.ts` (`visibleDetailTabs`), `ApplicationDetailContent.tsx` |
| 3.7 | Per-type sections as in legacy (README §3, Part 2 §4): `ข้อมูลอาคาร` only อ.1/อ.3; `รายการอาวุธ/วัตถุดิบ` only 1/3/4/5; `ข้อมูลโครงการ` only 1/3/5/6; a `ผลการตรวจสอบ` tab (factory check by officer 5/6, background check 1/3/7, site check 1/3/4, meeting results อ.1 only); type-specific panels for อ.9 / อ.4 / อ.15 / อ.14 (move from/to, buyer/export, linked อ.9/อ.10 licences). Mocks to omit panels per type. ❓ tab names and contents. | `types/app/applications` (`DETAIL_TABS`), `mocks/applicationDetail.mock.ts` |

Verify: `tables.spec.ts`, `filters.spec.ts` extended; vitest for timeline revision switching.

**Status (2026-11-26): done, 3.1–3.7.** Decisions taken at the start of the phase:
- 3.2 is a filter on คำขอทั้งหมด, not a menu: `ผลการพิจารณาของฉัน` (ทั้งหมด / ที่ฉันพิจารณาแล้ว / ฉันอนุมัติ /
  ฉันไม่อนุมัติ / ฉันส่งคืนเพื่อแก้ไข), param `myDecision`. Picking one with no date range fills ช่วงวันที่ with the
  last 2 months (legacy intent); a chosen range is kept. ช่วงวันที่ still filters วันที่รับเรื่อง. Not on the
  รอการอนุมัติ page (nothing there carries the officer's decision yet).
- 3.4: อ.4 is `import_permit` "คำขออนุญาตสั่งหรือนำเข้ามาฯ (อ.4)" (was `storage_permit` "ตั้งหรือมีคลังเก็บ").
- 3.7 done with legacy names: tab `checks` "ผลการตรวจสอบ" (sections by type as legacy RequestInfo: ตรวจโรงงานโดย
  เจ้าหน้าที่ควบคุม, ตรวจสอบประวัติ, ตรวจสถานที่ตั้งโรงงาน, ผลการประชุม ×3) and tab `transfer` whose label comes
  from the panel's new `tabLabel`: ข้อมูลการขนย้าย (อ.9), ข้อมูลการขายในราชอาณาจักร (อ.15), ข้อมูลการส่งออก (อ.14).
  The tab labels are ours — legacy had no tabs there, only section headings, which are used inside. อ.4 gets neither
  (legacy Import had no extra section).
Also: new columns วันที่คำขอ (after เลขที่คำขอ) and ส่งไปยัง/ขายให้กับ (after ผู้ประกอบการ); หมายเหตุด่วน is the ด่วน
badge's tooltip; timeline shows ลำดับที่ + ระดับ and หมายเหตุ per signing step; the sidebar and the back link put a
detail page under รอการอนุมัติ only when `canAct`. Tests: `ApplicationList.config.test.ts` (2-month window),
`revisionsOf` / `tabLabel` tests, mock tests per type, new `e2e/detail-sections.spec.ts`.
Open: one meaning for เลขที่คำขอ / เลขรับเรื่อง / เลขรับคำขอ (§3) is still unanswered.

### Phase 4 — Settings parity

| Task | Behaviour | Files |
|---|---|---|
| 4.1 | Workflow: exactly one final signer (`REVIEW_AND_SIGN`), placed last; error "ต้องมีผู้ตรวจสอบและลงนาม 1 คน และอยู่ลำดับสุดท้าย" ❓(wording). Reviewers may be reordered freely above it. | `SigningWorkflowFormContent.tsx`, `SignerChainEditor.tsx` |
| 4.2 | Workflow `ใช้งาน` toggle and `หมายเหตุ` (max 512) (G10). Inactive workflows are labelled in the list. | `types/app/signingWorkflows`, form, list |
| 4.3 | Signer picker already lists only active users (`activeOnly`) and disables users without a level. Add: flag steps in an existing workflow whose user became inactive. | `SignerChainEditor.tsx` |
| 4.4 | Delete workflow blocked when used by an in-progress request: show the backend message. | `SigningWorkflowListContent.tsx` |
| 4.5 | User with level `REVIEW_AND_SIGN` must have a signing method; `CERTIFICATE_FILE` needs a verified certificate (exists); signature image required ❓ (legacy stamps it on the licence). | `UserFormContent.tsx` |
| 4.6 | Add the new keys from 1.7 to the permission matrix. (A new role already starts with no permissions — `RoleFormContent.tsx:58-60` — unlike legacy's "all ticked"; keep it.) | `types/app/roles` |

Verify: `users.spec.ts`, `permissions.spec.ts` extended; vitest for workflow validation.

**Status (2026-11-26): done.** Decisions taken at the start of the phase:
- 4.1: a chain needs exactly one ผู้ตรวจสอบและลงนาม, in last place — `chainError`, message
  "ต้องมีผู้ตรวจสอบและลงนาม 1 คน และต้องอยู่ลำดับสุดท้าย". Every mock workflow now ends with the mock final
  signer (ปล.กห.), so the seed passes its own rule; the detail history of sombat's requests now runs on SW-001.
- 4.3: a signer switched off is a warning only (step badge + list flag); the workflow still saves.
  Steps carry a read-only `signerActive`.
- 4.5: a ผู้ตรวจสอบและลงนาม must have a รูปลายเซ็นต์ and may not use E-Document ("ผู้ตรวจสอบและลงนามต้องลงนามด้วย
  USB Token หรือ Certificate File") — closes the E_DOCUMENT question for final signers; what E-Document does for
  other levels is still unknown. Mock final signers get `/mock/signature-sample.svg`.
Also: 4.2 `isActive` (default on) and `note` (max 512) on workflows, "ปิดใช้งาน" badge in the list; 4.4 deleting a
workflow with pending requests throws `WorkflowInUseError` (409 from the backend, message passed through; the mock
checks the pending mock requests). 4.6 was done in Phase 1. Not done: filtering workflows by `isActive` / licence type
when one is chosen for a request — that choice happens in the backend/originating system, not in this app.
Tests: `SigningWorkflow.config.test.ts`, new `e2e/settings-rules.spec.ts`, `applications.spec.ts` workflow name.

### Phase 5 — Auth and session

| Task | Behaviour | Files |
|---|---|---|
| 5.1 | Idle timeout 15 min (D3): track activity, warn at 13 min with countdown + "ต่อเวลา" / "ออกจากระบบ"; on expiry sign out and go to `/login?callbackUrl=<current>`. Absolute cap ❓ (legacy 8 h). | new `hooks/auth/useIdleTimeout.ts`, `AdminLayout.tsx`, `lib/session-cookie.ts`, `lib/auth.ts` |
| 5.2 | MFA for password login (D4): enrolment (QR + first code) and verify step after password; SSO skips MFA ❓. Lockout after repeated wrong codes (legacy 5 attempts). | `components/partials/Login/*`, new MFA step components, `lib/auth.ts` |
| 5.3 | Reload pages restored from bfcache (G13). | `app/layout.tsx` (small inline script or client effect) |
| 5.4 | Change-password rules shown and checked client-side exactly as the server (G16); messages for lockout. | `ChangePasswordModal.tsx` |
| 5.5 | 403 page with a clear message when a route permission is missing (legacy never showed one). | `AdminLayout.tsx` (`getRequiredPermission` path) |

Verify: `auth.spec.ts` extended (idle warning with fake timers, callback return, MFA happy path + wrong code).

**Status (2026-11-26): done.** Decisions taken at the start of the phase (D4 refined):
- Absolute limit **8 hours** from sign-in (`SESSION_ABSOLUTE_MS`): the jwt callback marks the token
  `SessionExpired`, the proxy checks `signedInAt` itself, the cookie's `maxAge` is 8 h.
- Idle **1 hour** (`IDLE_TIMEOUT_MS`; first built as 15 min, changed by the user the same day), warning 2 min before (`IdleTimeoutDialog`: ต่อเวลาใช้งาน / ออกจากระบบ). Activity is shared
  across tabs through localStorage; while the warning is up only the button (or another tab) keeps the session.
- An idle or 8-hour sign-out ends **this app's session only — SSO is left alone** (user's call, changed mid-phase).
  The logout route takes `scope=app` for that: no token revoke, no end-session. The ออกจากระบบ button still ends
  both. The page is remembered in sessionStorage and opened again after the next sign-in; the login page shows why
  the session ended (info banner, not an error).
- MFA = **one-time code by e-mail** for password sign-in only; SSO skips it. Flow and backend contract in
  `lib/auth.ts` (202 + maskedEmail → `MfaRequired`, 401 `MFA_INVALID`, 423 locked after 5 wrong codes). Mock code
  `123456`, no mail sent. e2e `signInOnPage` now enters it.
- 5.3 `BfcacheReload` in the root layout. 5.4 password rules now include legacy's (8–128 chars, not one repeated
  character, not a common password, no user name; must differ from current) on top of the existing complexity
  rules; the mock answers the legacy 3-wrong-current-passwords lock. 5.5 was already in place
  ("ไม่มีสิทธิ์เข้าถึงหน้านี้").
- Not done: a server-side idle limit. The session poll (every 2 min, and on focus) refreshes the JWT, so idling is
  enforced in the browser; a closed tab's session lives until the 8-hour limit.
- Local env note: with `.env.local`'s `NEXT_BASE_URL` on a LAN address, logout lands on that origin and the
  remembered page (sessionStorage) is lost; run e2e with `NEXTAUTH_URL` and `NEXT_BASE_URL` set to localhost.

### Phase 6 — Reports and logs

| Task | Behaviour | Files |
|---|---|---|
| 6.1 | `รายงานสรุปการตรวจสอบและลงนาม` page: filters `วันที่ตรวจสอบลงนาม` from–to (default today–today), `ประเภทคำขอ` (default ทั้งหมด), `เจ้าหน้าที่ตรวจสอบ/ลงนาม` (required); messages `กรุณาเลือกวันที่ตรวจสอบลงนามให้ครบ`, `วันที่ตรวจสอบลงนามเริ่มต้นต้องไม่มากกว่าวันที่สิ้นสุด`, `กรุณาเลือกเจ้าหน้าที่ตรวจสอบ/ลงนาม`; grid grouped by day with ผ่าน/ไม่ผ่าน totals; PDF export (A4 landscape). One column set for grid and PDF ❓. | new `/reports/signature-verification`, `components/partials/Reports/*`, `services/report.service.ts` |
| 6.2 | Log screens under ตั้งค่าระบบ: `ประวัติการเข้าใช้งานระบบ` (logon) and `ประวัติการเปลี่ยนแปลงข้อมูล` (data change) with date range, user, action filters; date range actually applied (legacy bug). Export ❓. | new `/settings/logs/*`, types, services, mocks |

Verify: `reports.spec.ts` extended; new `logs.spec.ts`.

**Status (2026-11-26): done.** Decisions taken at the start of the phase:
- Menu: รายงาน is now a group — รายงานภาพรวม (`/reports/overview`; bare `/reports` redirects there) and
  สรุปการตรวจสอบและลงนาม (`/reports/signature-verification`), both `REPORTS:VIEW`. Logs sit under ตั้งค่าระบบ:
  `/settings/logs/logon` (`LOGON_LOGS:VIEW`) and `/settings/logs/changes` (`CHANGE_LOGS:VIEW`).
- PDF = the browser's print of the report page (A4 landscape `@page`, sidebar/header/filters hidden in print).
- ส่งคืนเพื่อแก้ไข is a third count beside ผ่าน / ไม่ผ่าน (day totals and grand total).
- Logs export the filtered rows as CSV (UTF-8 BOM for Excel).
Also: one column set for screen and print (ลำดับ, วันที่ตรวจสอบ/ลงนาม, ประเภทคำขอ, เลขที่คำขอ, เลขรับเรื่อง,
วันที่รับเรื่อง, ผู้ประกอบการ, ผลการพิจารณา, หมายเหตุ); legacy validation texts verbatim; officer list = users with an
approval level, inactive included (as legacy). Log date ranges are applied (legacy ignored them). Backend contracts:
`GET /api/reports/signature-verification`, `GET /api/logs/logon`, `GET /api/logs/changes` (`limit=0` = all, for CSV).
Mock: report rows come from the mock officers' own decisions (`myStep`); logs are invented. The existing
`/reports` "ส่งออก Excel" placeholder is unchanged. Tests: `SignatureReport.config.test.ts`, `lib/csv.test.ts`, new
`e2e/reports-logs.spec.ts`; `filters`, `permissions` and `auth` specs follow the new menu and route.
Idle timeout changed from 15 min to **1 hour** during this phase (user's call) — see Phase 5 / D3.

---

## 3. Open questions (asked before the related task starts)

| Task | Question |
|---|---|
| ~~1.7, 6.1~~ | ~~Who may open the signature verification report?~~ Answered 2026-11-26: `REPORTS:VIEW`. Logs: two keys (`LOGON_LOGS:VIEW`, `CHANGE_LOGS:VIEW`). |
| 3.2 | "คำขอที่ฉันลงนามแล้ว": separate menu item or a tab on `/applications`? Default date window? |
| 3.x | One meaning for `เลขที่คำขอ` vs `เลขรับเรื่อง` vs `เลขรับคำขอ` (legacy mixed them; the detail summary uses `เลขรับคำขอ`). |
| 4.1 | Exact error wording for the final-signer rule. |
| 4.5 | Is a signature image required for `REVIEW_AND_SIGN` users? What does `E_DOCUMENT` signing mean for the sign flow? |
| 5.1 | Absolute session cap (legacy 8 h)? |
| 5.2 | Does SSO login also need MFA, or only password login? MFA type: authenticator app (TOTP, as legacy) or e-mail/SMS OTP? |
| 6.1 | Grid and PDF columns (legacy differ); which request types appear in the filter. |
| 6.2 | Which events must be logged and who may see logs; export to Excel needed? |
| — | Notifications: who is notified after each decision (next signer, applicant, mailbox `Email_E_Signature`)? |

---

## 4. Backend requirements surfaced by this plan

1. `canAct` / `myStep` computed per user with sequential turn order (D1); reject the action server-side with the
   legacy messages otherwise.
2. Sign endpoint accepts `method` and optional `notes`; server-certificate signing for `CERTIFICATE_FILE`.
3. Bulk decision endpoint with per-row results.
4. Revision number on every approval step; detail returns all revisions.
5. List fields `buyerName`, `documentDate`, `urgentRemark`; "my decided" list query.
6. Workflow `isActive`, `note`; one-final-signer validation; delete-in-use check.
7. Session idle/absolute limits, MFA enrol/verify, password policy endpoint or shared rules.
8. Signature verification report data + PDF; logon and data-change logs.

## 5. Definition of done (per phase)

- `npm run lint`, type check, `vitest` and the Playwright suite pass.
- Every legacy rule touched by the phase is either implemented or listed in §3 / changed by a recorded decision.
- Thai UI strings follow the legacy text where the rule came from legacy.
