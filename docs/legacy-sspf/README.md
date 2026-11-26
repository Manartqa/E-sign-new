# Legacy SSPF (old E-sign system) — frontend conditions

Purpose: capture every frontend rule of the legacy signer web app so the new Next.js design can be checked
against it — what to keep, what to change on purpose, and which legacy bugs must not be ported.

- Legacy source: `D:\AI\E-sign\Old source code\did-spf\` (ASP.NET MVC 5 + Razor + Kendo UI 2014 + jQuery, Oracle).
- Read-only analysis of source code; the legacy app was **not run**. Rules marked "inferred" in the part files need a
  browser check before being relied on.
- Every rule in the part files cites `path:line` relative to the legacy root. Thai UI strings are quoted verbatim.

## Document map

| Part | File | Covers |
|---|---|---|
| 1 | [01-signing-approval.md](01-signing-approval.md) | Signer inbox, single/bulk sign popups, status popup, decision rules, USB token / server certificate, signing chain & turn order, permissions, after-decision effects |
| 2 | [02-request-detail-documents.md](02-request-detail-documents.md) | Request types & statuses, request list, how a signer opens a request, read-only e-sign detail page (`RequestInfo`), attachments/file preview, signing-method popup, Inbox/Outbox (ebXML), per-type PDFs |
| 3 | [03-admin-settings.md](03-admin-settings.md) | Approval process (signing workflow) + steps, authorized signers, roles & program permissions, users, lookups |
| 4 | [04-auth-shell-navigation.md](04-auth-shell-navigation.md) | SSO login, dormant password/MFA, change password, session/timeout, unauthorized handling, layout/header/menu, Buddhist-year dates, localization, audit/event logs |
| 5 | [05-reports.md](05-reports.md) | `รายงานสรุปการตรวจสอบและลงนาม` (full spec), 17 unlinked legacy reports, dead `.aspx` reports |

---

## 1. The system at a glance

| Fact | Detail |
|---|---|
| Two apps | **SSPF** = staff/signer side (this document). **ISPF** = trader (ผู้ประกอบการ) side; it has no approval/e-sign controllers. |
| Live menu has only 3 items | `คำขอใบอนุญาต/หนังสืออนุญาต สำหรับผู้บังคับบัญชา` → `RequestApproval/Index`; `รายงาน › รายงานสรุปการตรวจสอบและลงนาม`; `เปลี่ยนรหัสผ่าน` (`SSPF/Menu.th-TH.sitemap:4-8`). |
| Everything else is URL-only | User, Role, ApprovalProcess, AuthorizePerson, logs, Request list, RequestInfo, Inbox/Outbox are not in the menu. |
| Admin screens are effectively broken | Create/Edit forms have no Save button (shared button commented out), list delete icons have no handler, no UI for signer certificate / sign method / signature image / user↔signer link. Part 3 §0. |
| Landing page | After login → `RequestApproval/IndexWeb`, which renders an **empty** page. |
| Login | SSO only (citizen ID → `T_S_USER.ID_CARD_NO`). Password login returns `ปิดการเข้าสู่ระบบด้วยรหัสผ่านแล้ว กรุณาเข้าสู่ระบบด้วย SSO`. MFA exists but is unreachable. |
| Session | 5 min sliding idle timeout, 480 min absolute; no client warning; deep links lost after login. |
| Language | Thai only in practice (language switch never rendered). Dates shown in พ.ศ. (`YearOffset = 543`). |

The real day-to-day flow of a signer in the legacy app:

1. SSO login → empty landing page → menu → signer inbox (`RequestApproval/Index`).
2. Tick one row (single popup) or several rows (bulk popup) → `ตรวจสอบ/ลงนาม`.
3. Choose `อนุมัติ` (default) / `ไม่อนุมัติ`, optional remark (required for reject) → `บันทึกข้อมูล`.
4. Level-20 signer (`ผู้ตรวจสอบและลงนาม`) also signs digitally: USB token (IE + ActiveX) or server-stored certificate.
5. Page reloads; no success message.
   Optional: `แสดงคำขอ` opens the per-type data-entry page, which also has a `ตรวจสอบ/ลงนาม` button.

---

## 2. Old → new screen mapping

New = this repo (`src/app/(admin)/…`). Status: **Covered** = equivalent exists; **Changed** = exists but behaves
differently on purpose or by design; **Gap** = legacy has it, new does not (decide); **New** = no legacy equivalent.

| Legacy screen / function | Legacy route | New screen | Status | Notes |
|---|---|---|---|---|
| Signer inbox (pending) | `RequestApproval/Index` | `/applications/pending`, `/applications` | Changed | New adds stat cards, status filter, date range, urgency filter, sort. See §3.1. |
| Signer inbox "ดูคำขอที่ลงนาม" (history mode, filter อนุมัติ/ไม่อนุมัติ) | same page, checkbox | `/applications` with status filter | Changed | Legacy history is per-signer ("rows I decided"); new status is request-level. Confirm semantics. |
| Single sign popup | `_ReviewSignRequest` | Application detail → `SignatureModal` / `TokenSignPanel` | Changed | New decides from the detail page, not from a grid popup. |
| Bulk sign popup | `_ReviewSignRequestList` | `ApplicationBulkBar` + `BulkConfirmModal` | Covered | Keep: one decision + one remark for all rows; server checks every row. |
| Approval status / history popup (`ดูสถานะ`, `ครั้งที่` revision) | `_ReviewApprovalStatus` | Detail tab `ประวัติการดำเนินการ` (timeline) | Gap (partial) | Legacy shows history **per revision** (`ครั้งที่`); new timeline has no revision selector. |
| Request detail (per-type Entry pages; `RequestInfo` tabs) | `Request/ViewRequest` → `<Type>/Entry`; `Request/RequestInfo` | `/applications/[id]` (8 tabs) | Changed | Closest legacy design is `RequestInfo` (tabs รายละเอียดคำขอ / ผลการตรวจสอบ / ตรวจสอบการลงนาม), which was unfinished. |
| Licence preview PDF (Stimulsoft, signer stamped when level 20 approved & `SignatureType = 1`) | `<Type>/ReportRpt*` | `PDFViewer` (`licensePreviewUrl`) | Covered | Keep the rule for when the signer's image appears on the licence. |
| Attachment preview/download | `AttachFile/*`, `RequestEsig/PreviewPdf` | `DocumentTable` + `PDFViewer` | Covered | Keep: inline only for PDF/JPEG/PNG/GIF (by magic bytes), messages `ไม่พบไฟล์เอกสาร` / `ไม่มีสิทธิ์ดูไฟล์นี้`. |
| Return for edit (`ส่งคืนเพื่อแก้ไข`) | — | `ReturnForEditModal` | **New** | Legacy has only approve/reject. Needs a backend status and a reason list. |
| Approval process + steps | `ApprovalProcess/*`, `ApprovalProcessDtl/*` | `/settings/signing-workflows` | Changed | Field mapping in §3.4. |
| Authorized signers | `AuthorizePerson/*` | merged into `/settings/users` | Changed | New design merges signer into user (approval level, signing method, certificate, signature image). |
| Roles & permissions | `Role/*` (program-code tree) | `/settings/roles` (MODULE:ACTION matrix) | Changed | See §3.5. |
| Users | `User/*` | `/settings/users` | Changed | See §3.5. |
| Login | `Account/LogOn`, `Auth/Login` (SSO) | `/login` (SSO + password) | Changed | Legacy disabled password login on purpose. Confirm whether new password login is allowed. |
| MFA enroll / verify | `Account/MfaEnroll`, `LogOnMfa` | — | Gap (dormant in legacy) | Unreachable in legacy; decide whether needed. |
| Change password | `Account/ChangePassword` | Profile → `ChangePasswordModal` | Covered | Server rules in §3.6. |
| Signature verification report | `Report/ReportSignatureVerification` | — | **Gap** | The only live legacy report. New `/reports` is a dashboard (monthly volume, by licence type, fiscal year) and does not replace it. |
| 17 legacy Stimulsoft reports | `Report/*` (URL-only) | — | Gap (likely drop) | Unlinked in legacy. Business to confirm. |
| Audit log / logon log / event log | `AuditLog`, `AuditLogon`, `EventLog` | — | Gap | URL-only in legacy. |
| Inbox / Outbox | `Inbox`, `Outbox` | Notification bell | Not equivalent | Legacy Inbox/Outbox = ebXML message-exchange logs, **not** a user inbox. |
| Unread notifications | — | Header bell | **New** | Legacy sends only an e-mail to `Email_E_Signature` after a level-20 decision; no in-app notification, no mail to the next signer. |
| Profile | — (header shows USER_ID only) | `/profile` | **New** | |

---

## 3. Key frontend conditions by area

Short form of the rules the new design must match or consciously change. Details and citations are in the part files.

### 3.1 Signer inbox / application list (Part 1 §2)

| Rule | Legacy behaviour | New design today |
|---|---|---|
| Whose rows | Rows of the logged-in user's `AuthorizePersonId`, picked by stored procedure `P_REQUEST_APPROVAL_LS` (**not in repo**). User not linked to a signer → empty list. | Backend-decided; confirm the same scoping. |
| Pending mode | Only requests with status `20` (`นำเรียน`). | `PENDING_APPROVAL` |
| Sort | Pending: `FAST_TRACK_PRIORITY DESC, REQUEST_ID` (urgent first, then oldest). History: `DOCUMENT_DATE DESC`. No column sorting. | Urgent pinned on top (matches); user-sortable columns (new). |
| Urgent | Whole row text red when `FastTrackPriority == 1 && Status == 20`. `FastTrackRemark` exists but never shown. | `isUrgent` flag + filter `เฉพาะรายการด่วน`. Consider showing the remark. |
| Filters | `ข้อมูลจากวันที่`/`ถึงวันที่` (on DocumentDate), `ประเภทคำขอ` (default `ทุกประเภท`), `ค้นหาโดย` = `ผู้ประกอบการ` / `เลขที่คำขอ` / `เลขรับเรื่อง` + text (contains). Grid reloads only on `ค้นหา`. | Keyword, type, status, urgency, received-date range. |
| Columns | ☐, `ประเภทคำขอ`, `เลขรับเรื่อง`, `วันที่คำขอ`, `ผู้ประกอบการ`, `ส่งไปยัง/ขายให้กับ`, `สถานะ` (icon), `เจ้าหน้าที่รับเรื่อง`, `เลขที่คำขอ`, `วันที่รับเรื่อง`, buttons. | New lacks `ส่งไปยัง/ขายให้กับ` (buyer) and `วันที่คำขอ`. Decide. |
| Row buttons | `แสดงคำขอ` (always); `ดูสถานะ` (history mode only). | Row action → detail page. |
| Selection | Survives paging. 0 selected → `กรุณาเลือกรายการที่ต้องการ`; 1 → single popup; 2+ → bulk popup. No client check of "my turn". | Bulk bar. Keep "selection survives paging" only if intended. |
| Empty grid text | `ไม่มีข้อมูล`; page size 10, server cap 100. | |
| Request types in filter | 2 `คำขอรับใบอนุญาตประกอบกิจการโรงงานฯ (อ.1, อ.3, อ.20)`, 3 `…ขนย้าย… (อ.9)`, 4 `…สั่งหรือนำเข้ามาฯ (อ.4)`, 5 `…ในราชอาณาจักร (อ.15)`, 6 `…นอกราชอาณาจักร (อ.14)`. | Check the new type list matches; fix the legacy typo `ส่งอก` → `ส่งออก`. |
| Number labels | Grid: `RegisterNo` = `เลขที่คำขอ`, `DocumentNo` = `เลขรับเรื่อง`. Sign popup labels `RegisterNo` as `เลขรับเรื่อง` (legacy inconsistency). | New uses `เลขที่คำขอ` / `เลขรับเรื่อง` / `เลขที่นำเรียน`. Fix one meaning per label with the business. |

### 3.2 Decision and signing (Part 1 §3–4, §8)

| Rule | Legacy behaviour |
|---|---|
| Decisions | `อนุมัติ` (1, **pre-selected**) or `ไม่อนุมัติ` (2). No "return for edit". |
| Remark | Optional on approve; **required on reject** (`กรุณากรอกหมายเหตุ กรณีไม่ผ่านการอนุมัติ!!`) — client-only check. Max 512. |
| Confirmation / feedback | No confirm dialog; no success message; page reloads. |
| Who signs digitally | Only level `20` (`ผู้ตรวจสอบและลงนาม`). Levels 1–19 (`ผู้ตรวจสอบ n`) approve/reject with a button. Matches the new `isFinalSigner` idea. |
| Sign method (per signer) | `SIGN_OPTION 0` = USB token in browser (ActiveX, IE only; certificate found **by the signer's e-mail**; PIN prompt from token middleware). `SIGN_OPTION 1` = server-stored PFX + encrypted PIN; server signs. Other → fails. |
| Token error messages | `กรุณา Install Active-X`, `กรุณาเสียบ Token USB`, `ลงนามไม่สำเร็จ/ยกเลิกการลงนาม/ไม่ได้มีการเสียบ Token USB`, `กรุณาติดตั้ง ActiveX Plugin เพื่อใช้ลงนามเอกสารอิเล็กทรอนิกส์`, `กรุณาใช้ Internet Explorer`. New signing-agent states (`missing`/`notRunning`/`outdated`/`noDriver`) replace these. |
| Server checks on save, in order | 1. decision ∈ {1,2} else `ผลการพิจารณาไม่ถูกต้อง`. 2. logged-in user is the row's signer (client id ignored) else `ผู้ใช้นี้ไม่ใช่ผู้ลงนามของรายการนี้`. 3. row undecided and all earlier steps approved else `รายการนี้ลงนามแล้ว หรือยังไม่ถึงลำดับการลงนาม`. 4. approve: signer exists else `ไม่พบข้อมูล ผู้ลงนามในข้อมูลอ้างอิง`. 5. level 20: signature valid (XmlDsig, cert valid & trusted, content equals server XML) else `ลายมือชื่อดิจิทัลไม่ถูกต้อง (<reason>)`; server cert: `ไม่พบ Certificate File`, `PIN หรือไฟล์ใบรับรองไม่ถูกต้อง`. Missing signature → `ไม่พบลายมือชื่อดิจิทัลของรายการที่ต้องลงนาม (ระดับ 20) — ไม่บันทึกทั้งชุด`. |
| Reject | Any signer's reject ends the request immediately (status 30, checking `R`); token signature for a reject is discarded. |
| Final approve | Last level-20 signer: licence number allocated, licence status 30, signer's signature image stamped on the licence. Validity: PlantEst/Import 1 year − 1 day; Move/SaleInt/SaleDom today + 179 days (SaleDom capped by the P3/P5 document expiry). |
| Notification | Level-20 decision → e-mail to configured mailbox `Email_E_Signature` (subject `การแจ้งผลการลงนามหนังสืออนุญาต <type> เลขรับเรื่องที่ … - เลขคำขอที่ …`). Nothing else. |
| Bulk | One decision + one remark for every row. Server validates every row before saving; level-20 rows need one signature each; save is **not atomic** (partial commit on later errors). |
| Certificate ↔ signer | Not bound (only "chains to a trusted root"). New design checks token e-mail = signed-in user — keep that. |

### 3.3 Signing chain and turn order (Part 1 §9, Part 3 §2.3)

- A chain (a **revision**) is created when staff pick an approval process for a request; steps are copied ordered by
  `AUTHORIZE_LEVEL, ITEM_NO` (so on-screen step order is not what runs). A rejection ends the revision; resubmission
  creates a new revision; history is browsable by `ครั้งที่`.
- Server turn rule: a step may sign only if all steps with a smaller `ApprovalSeq` are approved.
- **Legacy bug:** `ApprovalSeq` is always 1 (`BL/Transaction/BLRequest.cs:814,824`), so the turn rule never blocks.
  In practice signing is parallel and a level-20 signer can issue the licence before reviewers sign. The real
  "whose turn" filter lives in the missing stored procedure.
- **Decision needed:** sequential vs parallel, and whether level 20 must wait for all reviewers.

### 3.4 Signing workflow setup (Part 3 §2)

| Legacy field (`ApprovalProcess`) | Legacy rule | New field (`SigningWorkflow`) |
|---|---|---|
| `ชื่อกระบวนการอนุมัติ*` | required, max 150, no uniqueness | `name` |
| `ใบอนุญาต/หนังสืออนุญาต*` | `เลือกทั้งหมด` (0) or LicenseForm `FORM_ID IN (2,8,10,16,17)`; **not used** when choosing a process for a request | `licenseType` |
| `ต่ออายุ` | `""` ใช้กับคำขอใหม่และต่ออายุ / `N` ใหม่เท่านั้น / `R` ต่ออายุเท่านั้น | `requestUsage` |
| `แทนใบอนุญาต` | `""` ใช้กับคำขอปกติและใบแทน / (`S` intended; legacy shows the wrong list and queries a non-existent column) | `replacementUsage` |
| `ProductTypeCode` | exists in DB, **not on form** | `weaponCategory` |
| `ใช้งาน*` | default checked; **not applied** when picking a process | — (consider adding `isActive`) |
| `หมายเหตุ` | max 512 | — |
| Steps grid | columns `ระดับการลงนาม`, `ชื่อ`, `ตำแหน่ง`; buttons `เพิ่ม` / `ลบ` / `เลื่อนขึ้น` / `เลื่อนลง`; add requires saved header (`กรุณาบันทึกคำขอก่อนเพิ่มรายการ`); no edit, no confirm on delete; no duplicate-signer or "exactly one level 20" check | `steps` (signer, position, approval level), seeded by level, user can reorder |

Rules the new design should add on purpose (legacy lacks them): exactly one final (level-20) signer per workflow, no
duplicate signer, only active users with an approval level selectable, delete blocked when a workflow is in use,
filter by `isActive` and licence type when a workflow is chosen for a request.

### 3.5 Users, signers, roles (Part 3 §3–5)

- Legacy keeps **signer** (`AuthorizePerson`: prefix/name/position, `AUTHORIZE_LEVEL`, `SIGN_OPTION`, cert path/PIN,
  signature image, `PERSON_TYPE`) separate from **user** (`T_S_USER`, linked by `AUTHORIZE_PERSON_ID`). The new design
  merges them; the signer fields that had no legacy UI (sign method, certificate, signature image, user link) now need
  real forms and validation.
- Approval level labels: `ผู้ตรวจสอบ n` for 1–19, `ผู้ตรวจสอบและลงนาม` for 20 (new `REVIEW_AND_SIGN`).
- Permissions: user → roles → `(ProgramCode, ActionCode)`; allow if any role grants it; no deny. Actions `ACCE/INST/UPDA/DELE/EXPO/IMPO/PRIN/SEND`.
  Key codes: `RQ01` inbox & save (ACCE/UPDA), `MA14` signers **and** workflows (shared), `MA14 ACCE` also needed for
  the history grid inside the sign popup, `SC01` users, `SC02` roles, report access by login list `Sspf_Admin_Group`.
  New `MODULE:ACTION` matrix maps roughly: APPLICATIONS↔RQ01, SIGNING_WORKFLOWS↔MA14, USERS↔SC01, ROLES↔SC02,
  REPORTS↔RP01 / admin group.
- Legacy UI never hides controls by permission and never shows the "no permission" texts (always bare 401 → login).
  The new design should hide/disable by permission and show a real 403 message.
- Dangerous legacy defaults not to copy: new role starts with **all** permissions ticked; new user starts with every
  role any user holds.
- Server validation is weak in legacy (no `ModelState` checks, no uniqueness, no referential checks on delete). Do
  these server-side in the new backend.

### 3.6 Login, session, shell (Part 4)

| Rule | Legacy |
|---|---|
| SSO | Matches 13-digit citizen ID to `T_S_USER.ID_CARD_NO`; 12 distinct Thai failure messages (Part 4 §D.2.1). |
| Password rules (change password) | length ≥ max(8, config `PasswordMinLength`) and ≤ 128, not all one character, not a common password, must not contain the user name, must differ from old; 3 wrong old passwords lock the account. Strength meter in legacy does not match these rules. |
| Session | 5 min sliding idle, 480 min absolute; expired during sign shows login HTML in an alert. New design should warn before expiry and keep the return URL. |
| Back/forward cache | Page restored from bfcache is force-reloaded so a logged-out session can't be viewed. |
| Header | System name (3 lines), `Version: …` (also shown on the anonymous login page), USER_ID (not the person's name). |
| Dates | พ.ศ. everywhere (`dd/MM/yyyy`, `dd/MM/yyyy HH:mm:ss`); legacy DateTimePicker shows ค.ศ. (inconsistent). |

### 3.7 Reports (Part 5)

`รายงานสรุปการตรวจสอบและลงนาม` — the only live report:

- Access: users listed in `T_S_OPTIONS` under `Sspf_Admin_Group` only.
- Filters: date range of the decision (default today–today; `กรุณาเลือกวันที่ตรวจสอบลงนามให้ครบ`,
  `วันที่ตรวจสอบลงนามเริ่มต้นต้องไม่มากกว่าวันที่สิ้นสุด`), request type (default ทั้งหมด), officer (required,
  `กรุณาเลือกเจ้าหน้าที่ตรวจสอบ/ลงนาม`).
- Data: approval rows with status approve/reject (pending excluded) from `V_REQUEST_APPROVAL`.
- Output: grid + PDF (A4 landscape, grouped by day, per-day and grand totals of ผ่าน/ไม่ผ่าน). Grid and PDF columns differ.

The new `/reports` dashboard does not cover this. Decide whether to add it.

---

## 4. Decisions to make before finalising the new frontend

1. Turn order: sequential by step vs parallel; must the final signer wait for all reviewers? (Legacy is accidentally parallel.)
2. Return for edit (`ส่งคืนเพื่อแก้ไข`) is new — backend status, reason list, and what the trader side sees.
3. History: keep per-signer "what I decided" view and per-revision (`ครั้งที่`) history?
4. Inbox columns: keep `ส่งไปยัง/ขายให้กับ` and `วันที่คำขอ`? One agreed meaning for `เลขที่คำขอ` vs `เลขรับเรื่อง`.
5. Confirmation dialog and success feedback after a decision (legacy has neither).
6. Bulk save atomic (all-or-nothing) vs per-row result list.
7. Password login + MFA: allowed or SSO only (legacy chose SSO only)?
8. Signature verification report: rebuild, and who can see it?
9. Audit/logon/event logs: needed in the new UI?
10. Notifications: who is notified (next signer, trader, mailbox) — legacy only mails one mailbox.
11. Workflow selection rules: apply `isActive`, licence type, renew/replacement usage, weapon category.

## 5. Legacy unknowns (not in the repo)

- Stored procedure `P_REQUEST_APPROVAL_LS` — the real "is it my turn" rule for the inbox.
- DB view `V_REQUEST_APPROVAL` (`STATUS`, `CHECKING`, `FAST_TRACK_PRIORITY`).
- External backend behind `SpfBackendApiUrl` (feeds `RequestInfo`) and where approval chains are created for most request types.
- ActiveX control `Security.XmlDsig.ActiveX.cab`.

## 6. Legacy bugs not to port (top items)

Full numbered lists: Part 1 §13 (30), Part 2 §12 (25), Part 3 §8 (38), Part 4 §D.14 (21), Part 5 §E.8 (24).

1. `ApprovalSeq` never incremented → turn order not enforced.
2. "Select all" untick leaves hidden selections that then get signed.
3. Duplicate click handlers → bulk popup opens for one row.
4. Save button stays disabled after a validation error.
5. Popups share element IDs → one popup reads another's remark / close button.
6. Server-certificate date errors returned under the wrong JSON key → never shown.
7. Unknown approval id returns success silently.
8. Bulk save partially commits.
9. Denied users get a bare 401 → login, never a message; controls never hidden by permission.
10. Admin forms cannot be saved; delete icons dead; step delete doesn't renumber so move up/down silently fails.
11. Request list POST search always adds `REQUEST_TYPE='0'`; search text concatenated into SQL.
12. Report filters: Buddhist years shown but Gregorian sent; several "required" checks never fire.
