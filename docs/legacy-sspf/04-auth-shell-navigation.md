# D. Authentication, App Shell, Navigation, Global Behaviour, Logs (SSPF staff web)

Scope: `D:\AI\E-sign\Old source code\did-spf\SSPF` (ASP.NET MVC 5, Razor, Kendo UI 2014.3, jQuery 3.6, Bootstrap 3).
All paths below are relative to that folder. Paths starting with `../BC/` point to the shared business-components project next to it (`did-spf\BC`), which holds policy constants the UI depends on.
Thai UI strings are quoted verbatim. Secrets are not reproduced; only key names are given.

---

## D.1 Authentication at a glance

| Item | Current behaviour | Source |
|---|---|---|
| Active login method | **SSO only** (OIDC authorization-code flow against the ThaID-backed `sso-auth-server`). The password form is commented out. | `Views/Account/LogOn.cshtml:70-79`, `:82-90` |
| Password login | Endpoint kept but disabled: every `POST /Account/LogOn` clears ModelState and returns the error `ปิดการเข้าสู่ระบบด้วยรหัสผ่านแล้ว กรุณาเข้าสู่ระบบด้วย SSO`. The original logic is kept inside a comment block. | `Controllers/AccountController.cs:73-76`, `:78-181` |
| MFA (TOTP) | Implemented (`LogOnMfa`, `MfaEnroll`), but it can only be reached from the **disabled** password POST. The SSO callback never goes through MFA. **The MFA screens are dead in the current configuration.** | `Controllers/AccountController.cs:140-152` (inside comment), `Controllers/AuthController.cs:51-137` |
| User matching for SSO | The 13-digit citizen ID from the claim `Sso.CitizenIdClaimKey` (default `citizenId`) is matched to `T_S_USER.ID_CARD_NO`. | `Controllers/AuthController.cs:104-116`, `Security/SsoService.cs:110-121` |
| Session carrier | A Forms-auth cookie named `SSPF`: HTTPS-only, `SameSite=Lax`, HttpOnly, never persistent. The ticket name is `USER_ID`. | `Web.config:129`, `:132`; `Models/LoginModel.cs:193-226` |
| Default route | `/` resolves to `Account/Logon`, so the site root is the login page. | `App_Start/RouteConfig.cs:26-31` |
| SSO route aliases | `/sso/login`, `/sso/callback` and `/sso/logoutcallback` map to `AuthController`, in addition to `/Auth/...`. | `App_Start/RouteConfig.cs:18-24` |
| Global login requirement | A global `AuthorizeAttribute` makes every action require login unless it has `[AllowAnonymous]`. | `App_Start/FilterConfig.cs:16` |
| HTTPS | Any HTTP request is 302-redirected to `https://` + host + raw URL. All response cookies are forced `Secure`. | `Global.asax.cs:164-183`, `:153-158` |

### D.1.1 Anonymous (`[AllowAnonymous]`) endpoints

| Endpoint | Purpose | Source |
|---|---|---|
| `GET /Account/LogOn` | Login page. Also has `[HandleUnauthorizeResult]`: an **already-authenticated** user is redirected to `Home/Index`. | `Controllers/AccountController.cs:49-66`; `Attributes/HandleUnauthorizeResultAttribute.cs:10-18` |
| `POST /Account/LogOn` | Disabled (see above). | `Controllers/AccountController.cs:68-76` |
| `GET/POST /Account/LogOff` | Logout. Accepts any verb; the UI posts a form. | `Controllers/AccountController.cs:185-208` |
| `GET /Account/SessionEnd` | Returns JS `window.close();` and expires the auth cookie. **Not referenced anywhere** (legacy). | `Controllers/AccountController.cs:397-407` |
| `GET /Account/BackToIndex` | Returns JS that sets `window.top.location` to `Home/Index`. Unused. | `Controllers/AccountController.cs:414-418` |
| `GET /Account/Unauthorize` | "No permission" page. | `Controllers/AccountController.cs:429-436` |
| `POST /Account/BackToAuthorizePage` | The "Return to Previous" button on that page. | `Controllers/AccountController.cs:477-488` |
| `GET/POST /Account/LogOnMfa`, `/Account/MfaEnroll` | MFA steps (unreachable today). | `Controllers/AccountController.cs:704-807` |
| `/Auth/Login`, `/Auth/Callback`, `/Auth/LogoutCallback` | SSO. | `Controllers/AuthController.cs:34-145` |
| `/Home/Index`, `/Home/ErrorPage` | Post-logout landing page and the generic error page. | `Controllers/HomeController.cs:18-23`, `:61-65` |

---

## D.2 Login: SSO flow (the only live path)

| Step | Behaviour | Source |
|---|---|---|
| 1. Login page | If `Sso.Enabled` is `true`, a single button `เข้าสู่ระบบด้วย SSO` links to `/Auth/Login`. Otherwise the red text `ยังไม่เปิดการเข้าสู่ระบบด้วย SSO กรุณาติดต่อผู้ดูแลระบบ` is shown. | `Views/Account/LogOn.cshtml:11`, `:82-90`; `Web.config:76` |
| 2. `/Auth/Login` | If SSO is disabled, redirects to `Account/LogOn`. Otherwise it generates `state` and `nonce` (GUID "N"), stores both in Session, and 302s to the IdP authorize URL with `scope`, `response_type=code`, `client_id`, `redirect_uri`, `state` and `nonce`. | `Controllers/AuthController.cs:35-47`; `Security/SsoService.cs:32-44` |
| 3. Endpoint discovery | Endpoints are read from `Sso.DiscoveryUrl` and cached for `Sso.DiscoveryCacheTtlHours` (default 24). If discovery fails, the code falls back to `Sso.AuthorizeUrl`, `Sso.TokenUrl`, `Sso.UserInfoUrl` and `Sso.LogoutUrl`, and retries after 5 minutes. | `Security/SsoConfig.cs:26-75`, `:97-147` |
| 4. `/Auth/Callback` | `state` and `nonce` are single-use (removed from Session before checking). Checks run in order: state matches → `code` present → token exchange (HTTP Basic client authentication) → access token present → nonce in `id_token` matches (signature **not** verified) → userinfo → citizen ID is exactly 13 digits (dashes and spaces stripped) → exactly one user has that `ID_CARD_NO` → account is not locked or disabled → `PasswordEffectiveDate` is not in the future. | `Controllers/AuthController.cs:51-128`; `Security/SsoService.cs:50-137` |
| 5. Success | Records a successful logon audit row (IP taken from `HTTP_X_FORWARDED_FOR`, else `REMOTE_ADDR`), resets `RETRY_COUNT`, and stores the tokens in Session (`SsoAuthenticated`, `SsoAccessToken`, `SsoIdToken`). It then signs in with a ticket lifetime of min(forms idle timeout, token expiry) and redirects to **`/RequestApproval/IndexWeb`**. | `Controllers/AuthController.cs:130-136`, `:169-200`; `Security/SsoSession.cs:56-64`; `Security/SsoService.cs:142-168` |
| Failure | Every failure sets `TempData["SsoError"]` and redirects to `Account/LogOn`, which shows the message in the red validation summary. | `Controllers/AuthController.cs:147-152`; `Controllers/AccountController.cs:59-63`; `Views/Account/LogOn.cshtml:52-57` |

### D.2.1 SSO error messages (verbatim)

| Condition | Message | Source |
|---|---|---|
| State missing or mismatched | `การยืนยันตัวตนล้มเหลว (state ไม่ตรงกัน) กรุณาเข้าสู่ระบบใหม่` | `Controllers/AuthController.cs:63` |
| No code | `ไม่ได้รับ authorization code จาก SSO` | `:66` |
| Token exchange threw | `ไม่สามารถเชื่อมต่อกับ SSO ได้` | `:77` |
| No access token | `ไม่ได้รับ access token จาก SSO` | `:81` |
| Nonce mismatch | `การยืนยันตัวตนล้มเหลว (nonce ไม่ตรงกัน)` | `:86` |
| Userinfo failed or null | `ไม่สามารถดึงข้อมูลผู้ใช้จาก SSO ได้` | `:97`, `:101` |
| Bad or missing citizen ID | `SSO ไม่ได้ส่งเลขประจำตัวประชาชนที่ถูกต้อง` | `:106` |
| No matching user | `ไม่พบผู้ใช้งานที่ผูกกับเลขประจำตัวประชาชนนี้ในระบบ` | `:113` |
| More than one matching user | `พบผู้ใช้งานมากกว่า 1 บัญชีที่ผูกกับเลขประจำตัวประชาชนนี้ กรุณาติดต่อผู้ดูแลระบบ` | `:115` |
| User lookup threw | `ไม่สามารถค้นหาข้อมูลผู้ใช้ได้` | `:121` |
| Locked or disabled | `บัญชีผู้ใช้ถูกล็อกหรือถูกปิดใช้งาน กรุณาติดต่อผู้ดูแลระบบ` | `:125` |
| Not yet effective | `บัญชีผู้ใช้ยังไม่ถึงวันเริ่มใช้งาน` | `:128` |

### D.2.2 Other messages that appear on the login page

| Trigger | Message | Source |
|---|---|---|
| Password POST (disabled) | `ปิดการเข้าสู่ระบบด้วยรหัสผ่านแล้ว กรุณาเข้าสู่ระบบด้วย SSO` | `Controllers/AccountController.cs:75` |
| `TempData["LogOnMessage"]`: account locked from the change-password page, MFA restart, or concurrent login | e.g. `ผู้ใช้งานระบบนี้ไม่สามารถใช้งานได้ กรุณาติดต่อผู้ดูแลระบบ` (`IsDisableAccount`) | `Controllers/AccountController.cs:54-57`, `:251`; `App_GlobalResources/DisplayName.resx:843` |
| MFA restart | `การยืนยันตัวตนด้วยรหัส OTP หมดเวลาหรือผิดเกินจำนวนครั้ง กรุณาเข้าสู่ระบบใหม่` | `Controllers/AccountController.cs:503` |
| Throttle (dead password path / MFA) | `เข้าสู่ระบบไม่สำเร็จหลายครั้งเกินไป กรุณาติดต่อผู้ดูแลระบบ` | `App_GlobalResources/DisplayName.resx:849` |
| Invalid credentials (dead path) | `ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง หรือบัญชีถูกระงับจากการใส่รหัสผ่านผิดหลายครั้ง กรุณาตรวจสอบอีกครั้งหรือติดต่อผู้ดูแลระบบเพื่อปลดล็อก` | `App_GlobalResources/DisplayName.resx:846` |
| Not yet effective (dead path) | `ผู้ใช้นี้ยังไม่สามารถใช้งานได้ เริ่มใช้ได้จากวันที่กำหนดไว้เท่านั้น` | `App_GlobalResources/DisplayName.resx:537` |
| Concurrent login (dead; `CheckUserIsOnline` always returns false) | `ผู้ใช้ '{0}' นี้ ถูกใช้งานอยู่ที่อื่น` | `App_GlobalResources/DisplayName.resx:258`; `Models/LoginModel.cs:157-169` |

---

## D.3 Login: password and MFA (dormant; document only so the redesign can decide)

| Rule | Detail | Source |
|---|---|---|
| Order of checks (dormant) | 1. Throttle → HTTP 429 + TooManyAttempts. 2. User exists (else the generic Invalid message). 3. Not locked or disabled (same generic message). 4. Password verify; on failure: audit, throttle count, `RETRY_COUNT++`, lock at `UnsuccessCount`. 5. Effective date. 6. MFA decision. 7. Concurrent-login check. 8. Sign in. 9. Forced change-password redirect if expired or first logon. 10. Local `returnUrl`, else `/RequestApproval/IndexWeb`. | `Controllers/AccountController.cs:79-176` |
| MFA modes | `MfaMode` = `Off` / `Enrolled` (default; also used when the value is blank or invalid) / `Required`. Privileged programs: `SC01,SC02,SC03,MA14,RQ01`. `MfaEnforceFrom` blank means a privileged user who has not enrolled is **denied** (no self-enrolment window). | `Web.config:97-101`; `../BC/Security/MfaPolicy.cs:44`, `:47-75` |
| MFA deny message | Reuses `IsDisableAccount` (`ผู้ใช้งานระบบนี้ไม่สามารถใช้งานได้ กรุณาติดต่อผู้ดูแลระบบ`). | `Controllers/AccountController.cs:142-146` |
| MFA gate | Pending logon lives in Session key `SPF.MfaPendingLogon`. It allows **5** attempts and lives **5 minutes**. A wrong OTP also counts toward `RETRY_COUNT` and the throttle. The OTP is replay-protected through `LAST_USED_STEP`. | `../BC/Security/MfaLogonGate.cs:26-28`; `Controllers/AccountController.cs:641-658`, `:743-748` |
| `LogOnMfa` screen | Heading `ยืนยันตัวตนด้วยรหัส OTP`, then `ผู้ใช้: {user}`. Label `รหัส OTP 6 หลักจากแอป Authenticator`. Input is numeric, pattern `[0-9]{6}`, maxlength 6, `autocomplete=one-time-code`, autofocus, required. Buttons: `ยืนยัน` and link `ยกเลิก` → LogOn. Wrong code shows `รหัส OTP ไม่ถูกต้อง`. | `Views/Account/LogOnMfa.cshtml:15-28`; `Controllers/AccountController.cs:656` |
| `MfaEnroll` screen | Heading `ลงทะเบียนการยืนยันตัวตนสองขั้น (MFA)`, then `บัญชีของท่าน (@user) มีสิทธิ์ผู้ดูแลระบบ/ผู้อนุมัติ ต้องลงทะเบียนแอป Authenticator (เช่น Microsoft หรือ Google Authenticator) ก่อนเข้าใช้งาน`. Three steps: `ในแอป Authenticator เลือกเพิ่มบัญชีแบบใส่รหัสเอง (Enter a setup key)` / `ใส่รหัสลับ: <secret> (ชนิด Time based)` / `ใส่รหัส 6 หลักที่แอปแสดงด้านล่าง`. Shows the `otpauth:` URI as text (**no QR code**). Input labelled `รหัส OTP 6 หลัก`. Button `ยืนยันและเข้าสู่ระบบ`; link `ยกเลิก`. | `Views/Account/MfaEnroll.cshtml:15-34` |
| Issuer | `MfaIssuer` (default `DID SPF`). The secret key setting `MfaSecretKey` lives in the secrets file. If it is missing, every user who needs MFA is denied. | `Web.config:101-103`; `Controllers/AccountController.cs:500`, `:602-606` |

---

## D.4 Lockout, attempt limits, throttling

| Limit | Value | Applies to (today) | Source |
|---|---|---|---|
| `UnsuccessCount` | **3** failures lock the account (`LOCK_ACCOUNT`). | Wrong **old password on Change Password**; dormant password and MFA paths. | `Web.config:37`; `Controllers/AccountController.cs:241-253`, `:550-560` |
| Change-password lock effect | When the lock is reached: all of the user's sessions are revoked, the user is signed out, and redirected to LogOn with `IsDisableAccount`. | Change Password | `Controllers/AccountController.cs:246-252` |
| LogonThrottle | 20 failures per IP **or** 10 per user, in a 5-minute window. | Dormant password and MFA paths. **SSO has no throttle.** | `../BC/Security/LogonThrottle.cs:17-19` |
| Throttle IP source | Trusted-proxy header only (`TrustedProxyAddresses`, `ClientIpHeader`). `LogonThrottleExemptIps` is a test-only bypass. | — | `Web.config:112-116`; `Controllers/AccountController.cs:539-546` |
| Membership `maxInvalidPasswordAttempts=5`, `passwordAttemptWindow=10` | Configured but **not used** by the custom flow. | — | `Web.config:141-142`; `Security/CustomMembershipProvider.cs:159-162` |
| Mid-session revalidation | Every `AuthRecheckMinutes` (default 5, clamped to 1–30) per session, the user row is reloaded. If it is deleted, locked or disabled, the ticket is rejected and the user becomes anonymous. | All requests | `Security/AuthTicketGate.cs:38-45`, `:85-115`; `Security/UserSessionLoader.cs:13-33`; `../BC/Security/AuthSessionRevalidation.cs:35-37` |

---

## D.5 Change Password (`/Account/ChangePassword`, `[Authorize]`)

### D.5.1 Screen

| Element | Detail | Source |
|---|---|---|
| Layout | `_Layout` (full shell). The browser `<title>` is empty because the `titleContent` section is not set. | `Views/Account/ChangePassword.cshtml:4-7`; `Views/Shared/_Layout.cshtml:9` |
| Panel title | `ข้อมูลบัญชีผู้ใช้` (`Account_Information`) | `Views/Account/ChangePassword.cshtml:13-15`; `App_GlobalResources/DisplayName.resx:243` |
| Field: user | Label `ผู้ใช้งาน` (BC `User_UserId`). Disabled textbox showing **USER_ID**, maxlength 20. | `Views/Account/ChangePassword.cshtml:21-26`; `Models/LoginModel.cs:54`; `../BC/Resources/DisplayName.resx:333` |
| Field: old password | `รหัสผ่านปัจจุบัน`, required (label marked required) | `Views/Account/ChangePassword.cshtml:27-33`; `App_GlobalResources/DisplayName.resx:540` |
| Field: new password | `รหัสผ่านใหม่`, required, plus a live strength meter (below) | `Views/Account/ChangePassword.cshtml:34-39`; `App_GlobalResources/DisplayName.resx:543` |
| Field: confirm | `ยืนยันรหัสผ่าน`, required | `Views/Account/ChangePassword.cshtml:40-45`; `App_GlobalResources/DisplayName.resx:549` |
| Submit | `เปลี่ยนรหัสผ่าน ` (note the trailing space). On click, shows the modal `กรุณารอสักครู่...`. | `Views/Account/ChangePassword.cshtml:50`, `:56-60` |
| Cancel | `ยกเลิก ` with `class="backToIndex"`. **No JS handler exists anywhere, so the button does nothing.** | `Views/Account/ChangePassword.cshtml:51` |
| Client validation | Uses `Html.Password` (not `PasswordFor`), so no unobtrusive attributes are emitted and every check happens on the server. | `Views/Account/ChangePassword.cshtml:30,37,43` |
| Strength meter | Shown when `#NewPassword` exists. Keyup inserts `<div id='result'>` with English labels `Blank` / `Very Weak` / `Weak` / `Medium` / `Strong` / `Very Strong`. Score: +1 for length ≥ 8, +1 for ≥ 12, +1 for mixed case, +1 for letters and digits, +1 for a special character, +1 for two specials. **This does not match the server policy.** | `Scripts/cdss.js:29-51`, `:343-383` |
| Success page | `<h2>เปลี่ยนรหัสผ่าน</h2>` and `<p>เปลี่ยนรหัสผ่านเรียบร้อย</p>` | `Views/Account/ChangePasswordSuccess.cshtml:8-11`; `App_GlobalResources/DisplayName.resx:246`, `:252` |

### D.5.2 Rules (server)

| # | Rule | Message | Source |
|---|---|---|---|
| 1 | The user comes from the session, not from the posted UserId. | — | `Controllers/AccountController.cs:236-238` |
| 2 | Old password must verify. Each failure counts toward the lock (D.4). | `รหัสผ่านไม่ถูกต้อง` | `Controllers/AccountController.cs:239-257`; `App_GlobalResources/DisplayName.resx:228` |
| 3 | Required fields | `{0} ไม่สามารถว่างได้` (`RequiredValidation`) | `Attributes/CustomRequiredAttribute.cs:15-18`; `App_GlobalResources/DisplayName.resx:555` |
| 4 | New and confirm passwords: max 128 characters | `ความยาวรหัสผ่านไม่เกิน {1}` | `Models/LoginModel.cs:66`, `:71` |
| 5 | Confirm must equal new (ordinal comparison) | `รหัสผ่านไม่ตรงกัน` | `Controllers/AccountController.cs:345-349`; `App_GlobalResources/DisplayName.resx:546` |
| 6 | Minimum length = max(8, membership `minRequiredPasswordLength`=8), capped at 128 | `รหัสผ่านต้องยาวอย่างน้อย {n} ตัวอักษร` | `Web.config:141`; `../BC/Security/PasswordPolicy.cs:43-47`, `:85-88` |
| 7 | Not longer than 128 | `รหัสผ่านต้องยาวไม่เกิน 128 ตัวอักษร` | `../BC/Security/PasswordPolicy.cs:90-94` |
| 8 | Not a single repeated character | `รหัสผ่านต้องไม่เป็นตัวอักษรเดียวกันทั้งหมด` | `../BC/Security/PasswordPolicy.cs:96-99` |
| 9 | Not in the ~100-entry common-password list (case-insensitive; includes `thailand`, `sawasdee` and others) | `รหัสผ่านนี้เป็นรหัสที่ใช้กันทั่วไปและเดาได้ง่าย กรุณาตั้งรหัสอื่น` | `../BC/Security/PasswordPolicy.cs:25-40`, `:101-104` |
| 10 | Must not contain the user logon or user ID (only checked when that value is ≥ 3 characters) | `รหัสผ่านต้องไม่มีชื่อผู้ใช้อยู่ในรหัส` | `../BC/Security/PasswordPolicy.cs:106-109`, `:136-150` |
| 11 | New password must differ from the old one | `รหัสผ่านใหม่ต้องไม่ซ้ำกับรหัสผ่านเดิม` | `Controllers/AccountController.cs:266-271` |
| 12 | No composition rules (no uppercase, digit or symbol requirement) | — | `../BC/Security/PasswordPolicy.cs:11-14` |
| 13 | On success: `ChangePasswordFirstLogon=0`. `PasswordExpiryDate` is set to now + **30 days**, but only if it was already set. All other sessions are revoked, a new ticket is issued, then redirect to `ChangePasswordSuccess`. | — | `Controllers/AccountController.cs:273-305` |
| 14 | `PasswordExpire=100` in appSettings is **unused**. `ViewBag.PasswordLength` is computed but never shown, so users are not told the minimum length. | — | `Web.config:38`; `Controllers/AccountController.cs:219` |

### D.5.3 Forced password change

| Rule | Source |
|---|---|
| A global filter checks for `ChangePasswordFirstLogon = 1` or `PasswordExpiryDate <= now`. A DB error or missing user counts as "must change" (fail closed). The result is cached in Session key `SPF.PasswordChangeRequired`. | `Security/PasswordChangeRequiredFilter.cs:95-145`; `App_Start/FilterConfig.cs:20` |
| Allowed while blocked: `Account/ChangePassword`, `ChangePasswordSuccess`, `LogOff`, any `[AllowAnonymous]` action, and child actions. | `Security/PasswordChangeRequiredFilter.cs:37-46`, `:57-69` |
| Page requests redirect to `Account/ChangePassword`. AJAX requests get JSON `{ unauthorizeMessage: "กรุณาเปลี่ยนรหัสผ่าน" }`. | `Security/PasswordChangeRequiredFilter.cs:21`, `:76-91` |
| `CustomAuthorize` repeats the expiry check on actions that have a ProgramCode (same redirect or JSON). | `Attributes/CustomAuthorizeAttribute.cs:97-119` |
| **Caution:** SSO users who are flagged must type a *local* old password they may never have used. | inference from `Controllers/AuthController.cs:130-136` + `Security/PasswordChangeRequiredFilter.cs` |

---

## D.6 Logout

| Step | Behaviour | Source |
|---|---|---|
| UI trigger | Header link `[ออกจากระบบ] ` runs `javascript:document.getElementById('logoutForm').submit()`, which POSTs `Account/LogOff` with an anti-forgery token. | `Views/Shared/_login.cshtml:7-11` |
| Server | Reads the SSO state, then `SignOut`: puts the ticket's session ID on the deny-list, expires the `SSPF` and `ASP.NET_SessionId` cookies, clears and abandons Session, and sends `Clear-Site-Data: "cache"`. | `Controllers/AccountController.cs:189-194`; `Models/LoginModel.cs:232-290`; `Security/SecurityHeaders.cs:106-110` |
| SSO session | Redirects to the IdP end-session URL with `post_logout_redirect_uri` and `id_token_hint`. The IdP returns to `/Auth/LogoutCallback`, which clears again and redirects to **`Account/LogOn`**. | `Controllers/AccountController.cs:196-204`; `Security/SsoService.cs:174-186`; `Controllers/AuthController.cs:139-145`, `:154-163` |
| Non-SSO session, or no end-session URL | Redirects to **`Home/Index`**: a header-only page with a `เข้าสู่ระบบเพื่อการใช้งาน` link. | `Controllers/AccountController.cs:206`; `Views/Home/Index.cshtml` |
| CSP | The SSO origin is added to `form-action`, because the logout form POST is followed by a 302 to the IdP. | `Security/SecurityHeaders.cs:21-28`, `:52-65` |

---

## D.7 Session, timeout, back/forward cache

| Item | Value or behaviour | Source |
|---|---|---|
| Idle timeout | **5 minutes**, sliding (`<forms timeout="5" slidingExpiration="true">`). Clamped to 1–480 minutes. | `Web.config:129`; `../BC/Security/AuthSessionPolicy.cs:38-46` |
| Absolute cap | **480 minutes** from login, however many times the ticket is renewed. | `../BC/Security/AuthSessionPolicy.cs:27`, `:126-129` |
| SSO ticket | Lifetime = min(idle timeout, `id_token.exp`, else `expires_in`, else 480). | `Models/LoginModel.cs:211-216`; `Security/SsoService.cs:142-168` |
| ASP.NET Session | InProc with the default 20-minute timeout (the 5-minute line is commented out). | `Web.config:127`, `:133` |
| Session restart while authenticated | `Session_Start` treats this as a timeout. Page requests: `SignOut` and redirect to `~/Account/LogOn`. AJAX: only `Response.Redirect(LogOn, false)` (no SignOut). | `Global.asax.cs:74-95` |
| Ticket rejected | Logged out, deny-listed, revoked, past the absolute cap, or malformed: the cookie is cleared and the request continues as anonymous, which leads to a 302 to `LogOn?ReturnUrl=…`. | `Global.asax.cs:98-133` |
| ReturnUrl | **Dropped by SSO.** The login page does not pass `returnUrl` to `/Auth/Login`, and the callback always lands on `/RequestApproval/IndexWeb`, so deep links are lost after a timeout. | `Views/Account/LogOn.cshtml:85`; `Controllers/AuthController.cs:136` |
| Client-side timeout UX | **None**: no countdown, warning, keep-alive, or global `ajaxError`/401 handler. An AJAX call after timeout receives the login/landing HTML with status 200. | search of `Scripts/`, `Views/` (no `ajaxError`/`ajaxSetup`) |
| bfcache | Every `_Layout`/`_LayoutPopUp` page reloads itself on `pageshow` when `e.persisted` is true, which forces a server session check. | `Views/Shared/_Layout.cshtml:10-14`; `Views/Shared/_LayoutPopUp.cshtml:10-14` |
| HTTP cache | MVC and HTML responses get `Cache-Control: no-cache, no-store, must-revalidate`, `Pragma: no-cache`, `Expires: 0`. | `Security/SecurityHeaders.cs:147-157` |
| Other headers | `X-Content-Type-Options: nosniff`; HSTS `max-age=31536000`; baseline CSP (allows `unsafe-inline`/`unsafe-eval` for Kendo); redirect CSP `default-src 'none'`; `X-Frame-Options: SAMEORIGIN`. Login and Home/Index use a strict nonce CSP with no inline script allowed. | `Security/SecurityHeaders.cs:35-49`, `:95-99`, `:118-145`; `Web.config:181` |

---

## D.8 Authorization and unauthorized handling

### D.8.1 Permission model

| Concept | Detail | Source |
|---|---|---|
| Program codes | `CF01` config, `EV01` event log, `SC01` user, `SC02` role/role detail/program code, `SC03` user-role, `SC04` audit log, `SC05` audit logon, `MA14` authorize person + approval process, `RQ01` request + **request approval**, `RP01` report summary, and others. | `Constants/ProgramCode.cs:10-118` |
| Action codes | `ACCE`, `DELE`, `EXPO`, `IMPO`, `INST`, `PRIN`, `UPDA`, `SEND` | `Constants/ActionCode.cs:10-17` |
| Check | `CustomAuthorize(ProgramCode, ActionCode)` uses `BLUserRole.IsAuthorizeUser(user, program, action)` (role-detail table) and fails closed. | `Attributes/CustomAuthorizeAttribute.cs:180-196`; `Security/ProgramPermissionSeam.cs:16-31` |
| Option groups | `OptionUserGroup` (e.g. `Sspf_Admin_Group`): a comma-separated list of user IDs in `T_S_OPTIONS`, replacing the program check. | `Attributes/CustomAuthorizeAttribute.cs:24-25`, `:182-188`; `Constants/OptionCode.cs:10` |
| Upsert actions | Actions declared `INST` with `ActionKeyCheck` are treated as `UPDA` when the key is non-empty and non-zero. | `Attributes/CustomAuthorizeAttribute.cs:61-67`, `:132-178` |
| Any-of | `CustomAuthorizeAny(ProgramCodes[], ActionCodes[])` passes if any pair is granted. | `Attributes/CustomAuthorizeAnyAttribute.cs:22-63` |
| Role provider | `CustomUser.IsInRole` always returns `true`; `CustomRoleProvider` throws. **Role names are never used.** | `Security/CustomUser.cs:39-44`; `Security/CustomRoleProvider.cs` |

### D.8.2 What the user sees when access is denied

| Source | Result as written | Source |
|---|---|---|
| Not logged in | 302 to `Account/LogOn?ReturnUrl=…` | `Web.config:129` |
| `CustomAuthorize` denied | `ReturnUnAuthorizeAction` sets a redirect to `Unauthorize`, or JSON for INSERT/DELETE/IMPORT/PRINT and UPDATE POST. **Line 92 then always overwrites `Result` with `HttpUnauthorizedResult` (401).** Forms auth turns the 401 into a 302 to LogOn, and `[HandleUnauthorizeResult]` bounces an authenticated user to **`Home/Index`**. In practice the user lands on the blank header-only page with no message, and AJAX callers receive that HTML instead of `{unauthorizeMessage}`. | `Attributes/CustomAuthorizeAttribute.cs:75-93`; `Attributes/HandleUnauthorizeResultAttribute.cs:10-18` |
| `CustomAuthorizeAny` denied | AJAX: JSON `{ unauthorizeMessage: "ไม่มีสิทธิเข้าถึงข้อมูล" }`. Otherwise a redirect to `Account/Unauthorize`. | `Attributes/CustomAuthorizeAnyAttribute.cs:42-56` |
| Unauthorize page | `<h2>Unauthorize</h2>` (English), then a message that **must** be one of the `MessageDisplay.UnAuthorizeTo*` strings (otherwise the Access text is used, which prevents content spoofing). Button `Return to Previous` POSTs `BackToAuthorizePage` with `returnUrl` = `PortalUrl`. **`PortalUrl` is not configured**, so `Redirect(null)` throws and the user ends on the error page. | `Views/Account/Unauthorize.cshtml:6-15`; `Controllers/AccountController.cs:443-488` |
| Client handling | Many views check `if (data.unauthorizeMessage)` and show sweetalert texts such as `ผู้ใช้นี้ไม่มีสิทธิในการลบข้อมูล` / `Unauthorize`. | `Scripts/cdss.js:77-79`, `:282-284`; e.g. `Views/ApprovalProcess/Edit.cshtml:165` |
| CSRF | Global filter on every POST: Origin/Referer must be `https://HTTP_HOST` or listed in `Csrf:AllowedOrigins`; a token is validated if present. Rejection returns 403; AJAX gets JSON `{result:"fail", message:"CSRF"}`. jQuery adds header `RequestVerificationToken` from the first `__RequestVerificationToken` input on the page (the logout form supplies one on every authenticated page). | `Security/AntiForgeryRequestFilter.cs:26-51`, `:115-145`; `Scripts/cdss.csrf.js:17-26`; `Web.config:105-107` |
| Request-level access | `RequestAccessFilter` returns a bare 403 or 404 status (IIS error page, no custom UI). | `Attributes/RequestAccessFilter.cs:121-125`, `:149-174` |

Unauthorized message texts (both `MessageDisplay.resx` and `.th-TH.resx` hold the same text):

| Key | Thai | Source |
|---|---|---|
| UnAuthorizeToAccess | `ไม่มีสิทธิเข้าถึงข้อมูล` | `App_GlobalResources/MessageDisplay.resx:162` |
| UnAuthorizeToCreate | `ไม่มีสิทธิสร้างข้อมูล` | `:165` |
| UnAuthorizeToDelete | `ไม่มีสิทธิลบข้อมูล` | `:168` |
| UnAuthorizeToEdit | `ไม่มีสิทธิแก้ไขข้อมูล` | `:171` |
| UnAuthorizeToExport | `ไม่มีสิทธิ export ข้อมูล` | `:174` |
| UnAuthorizeToImport | `ไม่มีสิทธิ import ข้อมูล` | `:177` |
| UnAuthorizeToPrint | `ไม่มีสิทธิสั่งพิมพ์ข้อมูล` | `:180` |
| UnAuthorize_DialogTitle | `ไม่มีสิทธิ` | `:183` |

### D.8.3 Error pages

| Path | Shows | Source |
|---|---|---|
| Unhandled MVC exception with customErrors enabled (Release sets RemoteOnly) | `Shared/Error.cshtml` inside `_Layout`: `Error.` / `An error occurred while processing your request.` (English) | `App_Start/FilterConfig.cs:12`; `Views/Shared/Error.cshtml:7-10`; `Web.Release.config:19-20` |
| Anything that reaches `Application_Error` | Redirect to `~/Home/ErrorPage`, which shows `พบข้อผิดพลาดจากการเรียกใช้งาน` | `Global.asax.cs:140-151`; `Views/Home/ErrorPage.cshtml:12` |

---

## D.9 App shell

### D.9.1 Layouts

| Layout | Used by | Contents | Source |
|---|---|---|---|
| `_Layout.cshtml` | 232 views (default through `_ViewStart`) | Full header, Kendo menu, body, footer, hidden Kendo window `PopupWindow` | `Views/_ViewStart.cshtml:2`; `Views/Shared/_Layout.cshtml` |
| `_LayoutPopUp.cshtml` | 2 views (`NoFileExist`, `NoIdFileExist`) | Short header (logo, SystemName, department), empty navbar, footer with **another project's** copyright `© Copyright 2015 | Food and drug Administration | all right reserved.` plus Version. Loads only jquery, kendo and csrf; **does not define `_yearOffset`** (see bugs). The title link is root-absolute `/RequestApproval/IndexWeb`. | `Views/Shared/_LayoutPopUp.cshtml:32-77` |
| `Layout = null` pages | LogOn, LogOnMfa, MfaEnroll, Home/Index | Standalone HTML with a strict nonce CSP. LogOn and Home/Index have **no `<!DOCTYPE>`, no `<html>` and no `<title>`**. | `Views/Account/LogOn.cshtml:4-20`; `Views/Home/Index.cshtml:3-18` |

### D.9.2 Header (`_Layout`)

| Element | Detail | Source |
|---|---|---|
| Theme | `<html class="k-blueopal">`. Viewport `user-scalable=no`. | `Views/Shared/_Layout.cshtml:5-7` |
| Browser title | `@RenderSection("titleContent")`, empty when a view does not define it. | `Views/Shared/_Layout.cshtml:9` |
| Logo | `~/Content/images/logo.png` | `Views/Shared/_Layout.cshtml:50-52` |
| Title block (link to `~/RequestApproval/IndexWeb`, tooltip = SystemName) | Line 1 `SystemName` = `ระบบการลงนามอนุมัติด้วยลายมือชื่อดิจิทัล (E-Signature)`. Line 2 `SystemNameEng` = `กองควบคุมโรงงานผลิตอาวุธของเอกชน` (despite the key name, this is Thai). Line 3 `SystemDepartmentName` = `กรมการอุตสาหกรรมทหาร`. | `Views/Shared/_Layout.cshtml:53-59`; `App_GlobalResources/DisplayName.resx:468`, `:303`, `:441` |
| Version | `Version: 2.4.23.0` (assembly version, also shown on the anonymous login page) | `Views/Shared/_Layout.cshtml:63`; `Properties/AssemblyInfo.cs:34`; `Views/Account/LogOn.cshtml:41` |
| User | `ผู้ใช้ระบบ: ` + `userInfo.userName`. That value is the **USER_ID** (the ticket stores the user ID as the name), not the person's full name. | `Views/Shared/_login.cshtml:4`; `Models/LoginModel.cs:201-207`; `App_GlobalResources/DisplayName.resx:558` |
| Logout | `[ออกจากระบบ] ` (see D.6) | `Views/Shared/_login.cshtml:6-12` |
| Anonymous header | `_login` shows the link `เข้าสู่ระบบเพื่อการใช้งาน` → `Account/LogOn` | `Views/Shared/_login.cshtml:18-23`; `App_GlobalResources/DisplayName.resx:231` |
| `_LogOnDisplay` partial | Alternative header (`ออกจากระบบ` link + `ผู้ใช้ระบบ:` **bold** identity name). **Not rendered anywhere.** | `Views/Shared/_LogOnDisplay.cshtml:3-11` |

### D.9.3 Footer

| Element | Detail | Source |
|---|---|---|
| Text | `© Copyright 2016 | Factory Control Division | all right reserved.` (the Version line is commented out) | `Views/Shared/_Layout.cshtml:81-90` |
| Back to top | `~/Content/images/back-top.png` linking to `#header-wrap` | `Views/Shared/_Layout.cshtml:92` |
| Stray `>` | `            ></footer>` renders a literal `>` character in the footer | `Views/Shared/_Layout.cshtml:93` |

### D.9.4 Global page script (`_Layout` document-ready)

| Behaviour | Source |
|---|---|
| Bootstrap button `noConflict` (renamed to `$.fn.bootstrapBtn`) | `Views/Shared/_Layout.cshtml:106-107` |
| `kendo.culture("th-TH")`, hard-coded whatever the language cookie says | `Views/Shared/_Layout.cshtml:108` |
| Starts disabled on **every** page if present: `#updateRegisterButton`, `#saveButton`, `#prepareLicense`, `#saveLicenseInform`, `#saveLicense`, `#receiveLicensePayment`. Hidden: `#addRequestDtlButton`. | `Views/Shared/_Layout.cshtml:109-122` |
| `@RenderSection("Scripts")` is emitted *inside* a `<script>` tag, so view sections must be raw JS | `Views/Shared/_Layout.cshtml:137` |
| Script and style bundles: jquery (3.6.1 + bootstrap + migrate), jqueryui, jqueryval, kendo (2014.3 + custom BE date widgets + th-TH culture), bootstrap, **cdss** (`cdss.js`, `cdss.csrf.js`, `cdss.window.js`, `cdss.datetime.th.js`, `cdss.sweetalert.js`, `jquery.string.format.js`, `jquery.bootstrap.loading.js`). Optimizations are turned off, so files are served one by one. | `Views/Shared/_Layout.cshtml:27-38`; `App_Start/BundleConfig.cs:17-118`; `Global.asax.cs:42` |

### D.9.5 Landing pages

| Page | Content | Source |
|---|---|---|
| `/RequestApproval/IndexWeb` (post-login landing, `[Authorize]`) | **Empty body**: header, menu and footer only. | `Controllers/RequestApprovalController.cs:732-737`; `Views/RequestApproval/IndexWeb.cshtml:1-5` |
| `/Home/IndexWeb` (`[Authorize]`) | Unused duplicate. | `Controllers/HomeController.cs:25-30` |
| `/Home/Index` (anonymous; post-logout; where denied users end up) | Header (logo, titles, `_login`, Version), empty 650px body, footer. Strict CSP. | `Views/Home/Index.cshtml:19-62` |
| `Home/About`, `Home/Contact` | Visual Studio template leftovers (Microsoft address and phone). No controller action exists for them. | `Views/Home/About.cshtml`; `Views/Home/Contact.cshtml` |

### D.9.6 Login page (`/Account/LogOn`)

| Element | Detail | Source |
|---|---|---|
| Header | Same as the layout, but Version sits under `_login` | `Views/Account/LogOn.cshtml:23-46` |
| Card | 544px frame image `u0.png` (134px tall when SSO only), `login-logo.png`, then a blue band (#006699) with h3 `เข้าสู่ระบบเพื่อการใช้งาน` | `Views/Account/LogOn.cshtml:58-68`, `:173-185`, `:266-270` |
| Errors | Red `ValidationSummary`, rendered only when ModelState has entries | `Views/Account/LogOn.cshtml:52-57`, `:119-122` |
| SSO button | Full width 404×44px, #3fa9dd (hover #2b8fc4), white bold text, inline SVG key icon, text `เข้าสู่ระบบด้วย SSO` | `Views/Account/LogOn.cshtml:85`, `:329-354` |
| Hidden or commented | User/password inputs, `เข้าสู่ระบบ` submit, `หรือ` divider | `Views/Account/LogOn.cshtml:70-84` |
| Footer | Same copyright text, no back-to-top | `Views/Account/LogOn.cshtml:102-116` |

---

## D.10 Navigation menu

### D.10.1 Mechanism

| Item | Detail | Source |
|---|---|---|
| Registration | Kendo `SiteMapManager`: `Menu-en-US` = `~/Menu.sitemap`, `Menu-th-TH` = `~/Menu.th-TH.sitemap` | `Global.asax.cs:70-71` |
| Selection | `Menu-{language cookie or "th-TH"}` | `Views/Shared/_Menu.cshtml:7`; `Attributes/CustomLanguage.cs:32-36` |
| Widget | `Html.Kendo().Menu().Name("menu").BindTo(siteMap).OpenOnClick(true).SecurityTrimming(true)`, inside a Bootstrap navbar with a collapse toggle for mobile | `Views/Shared/_Menu.cshtml:10-25` |
| Security trimming | Kendo runs each target action's authorize filters (`CustomAuthorize`, `[Authorize]`) and hides items the user cannot open. Side effect: `CustomAuthorize` writes permission cache keys into Session while the menu renders. | `Views/Shared/_Menu.cshtml:23`; `Attributes/CustomAuthorizeAttribute.cs:69-73` |
| Empty-group pruning (client) | jQuery removes top-level items and sub-groups that contain a `span` (a group header) but no `ul`. If the whole menu ends up empty, `nav.navbar` is hidden. | `Views/Shared/_Menu.cshtml:28-46` |

### D.10.2 Live menu tree (identical in `Menu.sitemap` and `Menu.th-TH.sitemap`, Thai labels in both)

| # | Label (Thai, verbatim) | URL | Shown to | Source |
|---|---|---|---|---|
| 1 | `คำขอใบอนุญาต/หนังสืออนุญาต สำหรับผู้บังคับบัญชา` | `/RequestApproval/Index` | Users with `RQ01` + `ACCE` | `Menu.sitemap:4`; `Controllers/RequestApprovalController.cs:743` |
| 2 | `รายงาน` (group, no URL) | — | Only if its child stays visible (client pruning) | `Menu.sitemap:5` |
| 2.1 | `รายงานสรุปการตรวจสอบและลงนาม` | `/Report/ReportSignatureVerification` | Users listed in the `T_S_OPTIONS` option `Sspf_Admin_Group` (ActionCode `PRIN`) | `Menu.sitemap:6`; `Controllers/ReportController.cs:1598` |
| 3 | `เปลี่ยนรหัสผ่าน` | `/Account/ChangePassword` | Every authenticated user (`[Authorize]`) | `Menu.sitemap:8`; `Controllers/AccountController.cs:213` |

The two sitemap files are byte-for-byte the same list (`Menu.th-TH.sitemap:4-8`), so switching language changes nothing in the menu.

### D.10.3 Legacy `Mvc.sitemap` (not rendered; inventory only)

`MvcSiteMapProvider` is referenced (`UI.Web.csproj:103-107`, `:3277-3280`), but no view calls `Html.MvcSiteMap()`. Most targets do not exist in SSPF; it was copied from another system (NSW/OAP). The tree, for reference:

| Group | Items (controller/action) | Source |
|---|---|---|
| `เมนูหลัก` (root, Home/Index) | — | `Mvc.sitemap:6` |
| `ใบรับคำขออนุญาต` | `ใบรับคำขออนุญาต` LicenseReqRcv/Index; `ติดตามสถานะคำขอฯ` LicenseReqRcv/Detail | `Mvc.sitemap:7-10` |
| (top level) | `คำขออนุญาตส่งออก` ExReq; `ใบรับรองความปลอดภัย` PackCert; `ใบแจ้งข้อเท็จจริง` NswLicense | `Mvc.sitemap:11-13` |
| `ข้อมูลลงทะเบียน` (SignUp) | `อนุมัติการสมัครใช้บริการ` ServiceApp; `ผู้ประกอบการ` Profile | `Mvc.sitemap:14-17` |
| `ดูแลระบบ` → `ผู้ใช้งานระบบ` | `เจ้าหน้าที่` User/IndexOfficer; `ผู้ประกอบการ` User/IndexTrader; `กลุ่มผู้ใช้งาน` Role/Index (IndexOfficer and IndexTrader do not exist in `UserController`) | `Mvc.sitemap:19-25` |
| `แลกเปลี่ยนข้อมูล` | `กล่องส่ง` Outbox; `กล่องรับ` Inbox | `Mvc.sitemap:27-30` |
| `รายงาน` | `การเข้าใช้งานระบบ` Report/RptAuditLogon; `การทำงานของเซอร์วิส` EventLog/Index; `การเปลี่ยนแปลงข้อมูล` Report/RptAuditLog; `การสำรองข้อมูล` BackupLog; `สิทธิ์การใช้งานระบบ` Report/RptSecurityMatrix | `Mvc.sitemap:32-38` |
| `ข้อมูลอ้างอิง` | FormGroup `ประเภทคำขออนุญาต`, FormType `ประเภทแบบฟอร์ม`, ProgramStatus `ขั้นตอนการทำงาน/สถานะ`, Document `ประเภทเอกสาร`, DocumentChecklist `เอกสาร Checklist`, Element `ข้อมูลธาตุ`, Province `จังหวัด`, SubProvince `อำเภอ`, District `ตำบล`, NamePrefix `คำนำหน้า`, AgencyType `ประเภทหน่วยงาน`, Tariff `พิกัดศุลกากร` | `Mvc.sitemap:41-54` |
| `ข้อมูลกรมศุลกากร` | Unit `หน่วย`, Country `ประเทศ`, Area `สถานที่นำเข้า/ส่งออก` | `Mvc.sitemap:55-59` |
| `ตั้งค่าระบบ` | BoConfig `ตั้งค่าทั่วไป`, Config `ตั้งค่ารับ/ส่งข้อมูล`, AuditSetting `ตั้งค่าการเปลี่ยนแปลงข้อมูล`, ServiceManager `สถานะเซอร์วิส` | `Mvc.sitemap:60-65` |
| hidden | `เข้าสู่ระบบ` Account/LogOn; `เปลี่ยนรหัสผ่าน` Account/ChangePassword (`visibility="false"`) | `Mvc.sitemap:66-67` |

### D.10.4 Module inventory: e-sign-relevant screens that are **URL-only** (not in the live menu)

| Module | URL | Index permission | Title (Thai) | Source |
|---|---|---|---|---|
| User | `/User/Index` | SC01 ACCE | `ข้อมูลผู้ใช้งานระบบ` | `Controllers/UserController.generated.cs:51`; `App_GlobalResources/DisplayName.resx:381` |
| Role | `/Role/Index` | SC02 ACCE | `ข้อมูลกลุ่มผู้ใช้` | `Controllers/RoleController.cs:82`; `App_GlobalResources/DisplayName.resx:570` |
| RoleDtl | `/RoleDtl/Index` | SC02 ACCE | `RoleDtl` (untranslated) | `Controllers/RoleDtlController.generated.cs:53`; `App_GlobalResources/DisplayName.resx:606` |
| ProgramCode | `/ProgramCode/Index` | SC02 ACCE | — | `Controllers/ProgramCodeController.generated.cs:53` |
| ApprovalProcess | `/ApprovalProcess/Index` | MA14 ACCE | `ข้อมูลกระบวนการลงนาม` | `Controllers/ApprovalProcessController.cs:47`; `App_GlobalResources/DisplayName.resx:939` |
| ApprovalProcessDtl | `/ApprovalProcessDtl/Index` | `APPROVAL_PROCESS_DTL` (not defined in SSPF `Constants`; resolved from the BC constants namespace) | — | `Controllers/ApprovalProcessDtlController.generated.cs:53` |
| AuthorizePerson | `/AuthorizePerson/Index` | MA14 ACCE | `ข้อมูลผู้ตรวจสอบลงนาม` | `Controllers/AuthorizePersonController.cs:82`; `App_GlobalResources/DisplayName.resx:579` |
| AuditLog | `/AuditLog/Index` | SC04 ACCE | `ข้อมูลบันทึกการเปลี่ยนแปลงข้อมูล` | §D.13 |
| AuditLogon | `/AuditLogon/Index` | SC05 ACCE | `ข้อมูลบันทึกการเข้าใช้งานระบบ` | §D.13 |
| EventLog | `/EventLog/Index` | EV01 ACCE | `Event Log` | §D.13 |

About 90 further legacy SPF controllers (Trader\*, Request\*, License\*, Inform\*, Receipt, PaymentInform, master data) still compile and are reachable by URL only (`Controllers/`). The redesign should decide explicitly which of them survive.

---

## D.11 Global JS behaviour

### D.11.1 Dates and Buddhist Era

| Item | Detail | Source |
|---|---|---|
| Config | `YearType=BE` (comment: `AD= คศ,BE = พศ`); `YearOffset=543` (the comment `AD= 0,BE = -543` has the **wrong sign**; the code adds +543 for display and subtracts it on input) | `Web.config:48-51` |
| Exposure to JS | `_langType = 'th'` when BE; `_yearOffset = Application["YearOffset"]` (543); `$urlBase`. `IsThaiyear` is computed but unused. | `Views/Shared/_Layout.cshtml:16-25`; `Global.asax.cs:45` |
| `GetThaiDate(date)` | Returns `dd/MM/(yyyy+543)`, or `""` if the value is not a Date | `Scripts/cdss.datetime.th.js:25-36` |
| `GetThaiDateTime(date)` | Returns `dd/MM/(yyyy+543) HH:mm:ss` | `Scripts/cdss.datetime.th.js:38-48` |
| `GetStrDate("dd/MM/yyyy BE")` | Subtracts 543 and returns `dd/MM/yyyy` AD (the day is not zero-padded) | `Scripts/cdss.datetime.th.js:50-60` |
| jQuery validate `date` override | Expects `dd/mm/yyyy` in BE, subtracts the offset, checks the calendar date. Default message is English: `Please enter a date in the format dd/mm/yyyy` | `Scripts/cdss.datetime.th.js:1-23`, `:63-69` |
| Kendo DatePicker (custom 2024 build) | The text box shows BE: years ≤ 2500 are displayed +543, years > 2500 are kept. On open, a typed BE year is converted back to AD for the calendar. Default `min` and `max` are `1900+543` and `2099+543`. | `Scripts/kendo/2024/cdss.kendo.datepicker.2024.js` (UTF-16 file) `:168-176`, `:198-199`, `:300` |
| Kendo Calendar (custom) | Month header, footer, year view, decade view and day title show `year + _yearOffset` | `Scripts/kendo/2024/cdss.kendo.calendar.2024.js:425`, `:448`, `:467`, `:509`, `:562`, `:605` |
| Kendo DateTimePicker (custom) | **No** BE conversion, so it shows AD years (inconsistent with DatePicker) | `Scripts/kendo/2024/cdss.kendo.datetimepicker.2024.js:200-202` |
| Server inbound | Strings matching `dd/MM/yyyy` with year > 2500 have 543 subtracted. A `DateTime` property more than 300 years from now (when UI culture is th-TH) has 543 subtracted. | `Binder/CustomModelBinder.cs:24-31`, `:92-102` |
| Server culture | Per request, from the `language` cookie (default `th-TH`) with a **Gregorian** calendar, `/` and `:` separators, short and long date `dd/MM/yyyy`, time `HH:mm:ss`, full `dd/MM/yyyy HH:mm:ss` | `Attributes/CustomLanguage.cs:13-30`; `Global.asax.cs:135-138`; `../BC/Attributes/FieldDisplayNameAttribute.cs:114-128` |
| Server "TH" strings | Entity `*DateTH` properties use `new CultureInfo("th-TH")` (Buddhist calendar), so they come out as BE `dd/MM/yyyy`; controllers append `HH:mm:ss` | `../BC/Security/AuditLogon/AuditLogon.generated.cs:284`; `Controllers/AuditLogonController.cs:106` |

### D.11.2 Number and grid formats (from BC display attributes)

| Format | Pattern | Alignment | Source |
|---|---|---|---|
| Number | `#,##0.00#` | right | `../BC/Attributes/FieldDisplayNameAttribute.cs:120-122`, `:169-174` |
| Integer / page | `#,##0` | right / center | `:130-132` |
| 3 decimals | `#,##0.000` | right | `:134-135` |
| Rate | `#,##0.0000` | right | `:124-125` |
| Date / date-time / time | `dd/MM/yyyy` / `dd/MM/yyyy HH:mm:ss` / `HH:mm:ss` | center | `:114-128`, `:163-167` |

### D.11.3 Grid and helper conventions

| Helper | Behaviour (Thai text verbatim) | Source |
|---|---|---|
| Page size | appSetting `pageSize=10` is passed as Kendo **`ButtonCount`** (number of pager buttons), not page size. The server caps any requested page size at 100. | `Web.config:35`; `Views/AuditLog/Index.cshtml:114`; `Attributes/GridPagingFilter.cs:16-23` |
| Empty grid | `ไม่มีข้อมูล` (`Shared_NoRecord`) | `App_GlobalResources/DisplayName.resx:204` |
| whereClause | Every ViewData value named `*WhereClause` is replaced by a signed token on the way out and unwrapped on the way in. An invalid token becomes `(1=0)` (no rows). | `Attributes/WhereClauseTokenFilter.cs:23-62` |
| Search inputs | String properties of `SearchModel` have `'` doubled. `SearchBy` must be an identifier; code fields must be a code or null. **Every other model's string properties also have `'` doubled.** | `Binder/CustomModelBinder.cs:44-61`, `:75-90` |
| `deleteRecord` | Nothing checked: `กรุณาระบุข้อมูลที่ต้องการ`. Native confirm: `ต้องการลบข้อมูลนี้หรือไม่?`. Then `Success`/`Delete`, or `Delete not success, Error : …` | `Scripts/cdss.js:54-113` |
| `OpenDeleteDataDialog` / `deleteData` | swal `ต้องการลบใช่หรือไม่` with `ใช่` / `ไม่ใช่`. Results: `Ch` → `กรุณาลบคำขอที่หน้าคำขอขายหรือจำหน่ายฯ ใน/นอกราชอาณาจักร`; `Registering` → `ไม่สามารถลบข้อมูลได้ เนื่องจากรับเรื่องแล้ว` (title `คำเตือน`) | `Scripts/cdss.js:216-237`, `:268-336` |
| `CloseDataWindow(needConfirm, url)` | swal `ต้องการปิดหน้าจอนี้ใช่หรือไม่` (`ใช่`/`ไม่ใช่`), then navigates to `$urlBase + url` | `Scripts/cdss.js:239-265` |
| `CopyRecord` | `กรุณาระบุรายการที่ต้องการ Copy` | `Scripts/cdss.js:10-28` |
| `onGridBound` | `a.OpenAttachFile` opens `AttachFile/ReviewPDF?Id=` in a new window; `a.editGrid` shows the wait modal and then navigates | `Scripts/cdss.js:115-154` |
| `#checkAll` | Toggles all `.selectedRecords` | `Scripts/cdss.js:438-444` |
| `onGridComplete` | Collects server `errors` into one swal | `Scripts/cdss.js:642-652` |
| `messageDialog` | jQuery-UI modal with button `ตกลง` | `Scripts/cdss.js:576-604` |
| `enableControlByPanel` / `setElementData` | Generic read-only toggling and form fill (datepicker values are shown in BE through `GetThaiDate`) | `Scripts/cdss.js:867-942` |
| Search button (legacy) | Uses an undefined global `resourceProvider` and Telerik `tGrid`/`tComboBox`, so it is broken but harmless | `Scripts/cdss.js:389-436` |
| Wait modal | `waitingDialog.show('กรุณารอสักครู่...', {dialogSize:'sm', progressType:'warning'})`: Bootstrap modal with static backdrop and no keyboard dismissal | `Scripts/jquery.bootstrap.loading.js:1-55`; e.g. `Views/Shared/_BrowseControlPanel.cshtml:381-383` |
| Alerts | SweetAlert 1, bundled as `cdss.sweetalert.js` with Thai defaults `confirmButtonText: "ตกลง"` and `cancelButtonText: "ยกเลิก"` | `Scripts/cdss.sweetalert.js:19`, `:21` |
| `String.format` | `{0}`-style substitution | `Scripts/jquery.string.format.js:2-15` |

### D.11.4 Popup window helper (`cdss.window.js`)

| Function | Behaviour | Source |
|---|---|---|
| `openDetailWindow(controller, action, params, title, gridName, w='700px', h='600px')` | Uses `#PopupWindow` (modal Kendo window with Maximize and Close actions, declared in `_Layout`). Sets size and a close handler that empties the content, then titles, centers, opens and loads `$urlBase+controller/action` by AJAX with params. | `Scripts/cdss.window.js:13-62`; `Views/Shared/_Layout.cshtml:94-101` |
| `processContent` / `editProductRequest` | Re-parses unobtrusive validation and intercepts form submit with an AJAX POST to the same URL. A non-empty response re-renders the window; an empty response sets `closeWindowOnDataBound` and refreshes the grid, which then closes the window on `dataBound`. | `Scripts/cdss.window.js:238-278` |
| `onPopupCancel`, `onCloseWin` | Close; `onCloseWin` re-reads the grid | `Scripts/cdss.window.js:188-229` |
| Level-2 functions | Use Telerik `tWindow`/`tGrid`, so they are dead | `Scripts/cdss.window.js:280-351` |
| `GetDataProfile` | Contains the literal Razor text `'@Url.Action(...)'` inside a .js file, so it is broken | `Scripts/cdss.window.js:355-386` |

---

## D.12 Localization (TH/EN)

| Item | Finding | Source |
|---|---|---|
| Switch mechanism | Cookie `language` (`th-TH` or `en-US`, 1 year), set by `POST /Home/_languageThai` and `/Home/_languageEng`, followed by a reload. | `Controllers/HomeController.cs:32-60`; `Views/Shared/_LanguageMenu.cshtml:5-37` |
| Reality | `_LanguageMenu` is **not rendered** by any view, its icons (`icon_thai.png`, `icon_eng.png`) are missing from `Content/images`, and both endpoints require **CF01 ACCE**. `_languageThai` sets `HttpOnly=false` while its comment says "Not accessible by JS". **The app is effectively Thai-only.** | `Controllers/HomeController.cs:32-41`, `:52` |
| Default | No cookie means `th-TH` (`CustomLanguage`). `Web.config` globalization is `culture="en-US" uiCulture="th-TH"`, overridden on every request. | `Attributes/CustomLanguage.cs:16`, `:35`; `Web.config:172` |
| `DisplayName` resources | `DisplayName.resx` (neutral, Thai text) is an EmbeddedResource. **`DisplayName.th-TH.resx` is included only as `Content`, so it is never compiled or used**, and its values differ: its `SystemName` is `ระบบการจัดการฐานข้อมูลโรงงานผลิตอาวุธของเอกชน`, `SystemNameEng` is `Database Management System of Private Factory (SPF)`, and `SystemDepartmentName` is `กรมอุตสาหกรรมทหาร`. There is no `en-US` resx. | `UI.Web.csproj:3136-3142`, `:3190-3196`; `App_GlobalResources/DisplayName.th-TH.resx:474-480` |
| `MessageDisplay` resources | Neutral and `th-TH` are both embedded (namespace `CDSS.DID.SPF.UI.Web.App_GlobalResources`, without the extra "S") | `UI.Web.csproj:3172-3187`; `App_GlobalResources/MessageDisplay.designer.cs:11` |
| `Localization/*.xml` | Stimulsoft report-viewer UI language packs (ar … zh-CHT). **No Thai file.** Not referenced from code. | `Localization/en.xml:2`; `UI.Web.csproj:2276+` |
| `GridLocalization*.resx` | Legacy Telerik grid strings (EN neutral, TH `เพิ่มข้อมูล`, `ยกเลิก`, `ลบข้อมูล`, `ต้องการลบข้อมูลนี้ใช่หรือไม่` …). Generated into namespace `Resources`; no evidence of use by Kendo. | `App_GlobalResources/GridLocalization.th-TH.resx:120-132` |
| Kendo culture | Always `th-TH` in `_Layout`; never set in `_LayoutPopUp` | `Views/Shared/_Layout.cshtml:108` |

### D.12.1 Resource keys used by the e-sign screens (effective text from `DisplayName.resx` unless noted)

| Key | Thai | Used by | Line |
|---|---|---|---|
| SystemName | `ระบบการลงนามอนุมัติด้วยลายมือชื่อดิจิทัล (E-Signature)` | header, LogOn, MFA `<title>` | `DisplayName.resx:468` |
| SystemNameEng | `กองควบคุมโรงงานผลิตอาวุธของเอกชน` | header line 2 | `:303` |
| SystemDepartmentName | `กรมการอุตสาหกรรมทหาร` | header line 3 | `:441` |
| SystemNameTh | `ระบบการจัดการฐานข้อมูลโรงงานผลิตอาวุธของเอกชน` | (unused in shell) | `:306` |
| LogOn | `เข้าสู่ระบบเพื่อการใช้งาน` | login band, anonymous header link | `:231` |
| LogOff | `ออกจากระบบ` | `_LogOnDisplay` (unused) | `:516` |
| UserNameText | `ผู้ใช้ระบบ: ` | header | `:558` |
| UserLogOn | `ผู้ใช้ระบบ:` | `_LogOnDisplay` | `:234` |
| Account_Login_Title | `เข้าสู่ระบบ` | (commented submit) | `:126` |
| Account_Login_CurrentUser | `ผู้ใช้ขณะนี้` | — | `:123` |
| Account_Information | `ข้อมูลบัญชีผู้ใช้` | ChangePassword | `:243` |
| Account_ChangePassword | `เปลี่ยนรหัสผ่าน` | success page h2 | `:246` |
| Account_ChangePassword_ChangePassword_Title | `เปลี่ยนรหัสผ่าน` | — | `:120` |
| Account_ChangePassword_Message | `กรอกแบบฟอร์มด้านล่างเพื่อเปลี่ยนรหัสผ่าน` | (not shown) | `:249` |
| Account_ChangePassword_SuccessMessage | `เปลี่ยนรหัสผ่านเรียบร้อย` | success page | `:252` |
| Account_Unauthorize_Title | `ไม่มีสิทธิการใช้งาน` | (not used; page shows "Unauthorize") | `:129` |
| ChangePassword | `เปลี่ยนรหัสผ่าน` | submit button | `:240` |
| Cancel | `ยกเลิก` | cancel button | `:255` |
| CurrentPassword | `รหัสผ่านปัจจุบัน` | ChangePassword | `:540` |
| NewPassword | `รหัสผ่านใหม่` | ChangePassword | `:543` |
| User_ConfirmPassword | `ยืนยันรหัสผ่าน` | ChangePassword | `:549` |
| PasswordDoesNotMatch | `รหัสผ่านไม่ตรงกัน` | ChangePassword | `:546` |
| PasswordIsIncorrect | `รหัสผ่านไม่ถูกต้อง` | ChangePassword | `:228` |
| RequiredValidation | `{0} ไม่สามารถว่างได้` | all required fields | `:555` |
| IsDisableAccount | `ผู้ใช้งานระบบนี้ไม่สามารถใช้งานได้ กรุณาติดต่อผู้ดูแลระบบ` | lock / MFA deny | `:843` |
| User_LogOn_Invalid | (see D.2.2) | dormant | `:846` |
| User_LogOn_TooManyAttempts | `เข้าสู่ระบบไม่สำเร็จหลายครั้งเกินไป กรุณาติดต่อผู้ดูแลระบบ` | dormant / MFA | `:849` |
| User_LogOn_IsNotEffective | `ผู้ใช้นี้ยังไม่สามารถใช้งานได้ เริ่มใช้ได้จากวันที่กำหนดไว้เท่านั้น` | dormant | `:537` |
| User_LogOn_Userd | `ผู้ใช้ '{0}' นี้ ถูกใช้งานอยู่ที่อื่น` | dormant | `:258` |
| User_LogOn_UserIsNotFound | `ไม่พบผู้ใช้ '{0}' นี้ในระบบ` | — | `:384` |
| User_LogOn_IsNotActivaActive | `ผู้ใช้ '{0}' นี้ ยังไม่ถูกเปิดใช้งาน` | — | `:345` |
| User_Index_Title | `ข้อมูลผู้ใช้งานระบบ` | User | `:381` |
| User_AuditLogon_Title | `ข้อมูลการเข้าใช้งานระบบ` | — | `:222` |
| User_AuditLogon_UserId | `รหัสผู้ใช้` | — | `:225` |
| User_AuditLogon_LogonIp | `หมายเลขเครือข่าย` | — | `:219` |
| User_AuditLog_IsLogonSuccess | `สถานะเข้าสู่ระบบ` | — | `:507` |
| Role_Index_Title | `ข้อมูลกลุ่มผู้ใช้` | Role | `:570` |
| RoleDtl_Index_Title | `RoleDtl` | RoleDtl | `:606` |
| ApprovalProcess_Index_Title | `ข้อมูลกระบวนการลงนาม` | ApprovalProcess | `:939` |
| AuthorizePerson_Index_Title | `ข้อมูลผู้ตรวจสอบลงนาม` | AuthorizePerson | `:579` |
| AuthorizePersonName | `ชื่อผู้ตรวจสอบลงนาม` | AuthorizePerson | `:609` |
| RequestApproval_Index_Title | `ลงนามคำขอใบอนุญาต/หนังสืออนุญาต` | RequestApproval | `:942` |
| Shared_NoRecord | `ไม่มีข้อมูล` | all grids | `:204` |
| Shared_Create | `ข้อมูลใหม่` | Role/User/ApprovalProcess/AuthorizePerson | `:444` |
| Shared_Edit | `แก้ไข` | same | `:447` |
| Shared_AuditText | `{0} โดย {1}` | audit footer on entry screens | `:561` |
| Search_Defaultselect | `--กรุณาเลือก--` | AuthorizePerson | `:600` |
| Search_DefaultSearch | `-- เลือกทั้งหมด --` | EventLog status list | `:486` |
| AuditLog_Index_Title | `ข้อมูลบันทึกการเปลี่ยนแปลงข้อมูล` | AuditLog | `:735` |
| AuditLogon_Index_Title | `ข้อมูลบันทึกการเข้าใช้งานระบบ` | AuditLogon | `:732` |
| EventLog_Index_Title | `Event Log` | EventLog | `:471` |
| User_UserId / User_UserName / User_Password (BC) | `ผู้ใช้งาน` / `ชื่อ-นามสกุล` / `รหัสผ่าน` | ChangePassword, LogOn model | `../BC/Resources/DisplayName.resx:333`, `:339`, `:345` |

---

## D.13 Log screens

All three use `_Layout`, the shared `_BrowseControlPanel` search strip (grey background `#8080804d`, a `ค้นหา` submit that shows the wait modal), a Kendo AJAX grid with single-row selection and resizable columns, and the empty text `ไม่มีข้อมูล`. **None of them appears in the live menu.** Column titles come from BC resource keys `AuditLog_*`, `AuditLogon_*` and `EventLog_*`.

### D.13.1 AuditLog: data change log (`/AuditLog/Index`, SC04)

| Aspect | Detail | Source |
|---|---|---|
| Permission | Index, search and grid: SC04 ACCE. `ExportToExcel`: SC04 EXPO (exists but no button in the view). | `Controllers/AuditLogController.cs:46`, `:65`, `:89`; `Controllers/AuditLogController.generated.cs:55` |
| Panel title | h3 `ข้อมูลบันทึกการเปลี่ยนแปลงข้อมูล` (ViewMode 6 = Audit) | `Controllers/AuditLogController.cs:55-58`; `Views/Shared/_BrowseControlPanel.cshtml:25-29`; `Enumerates/ControlViewMode.cs:16` |
| Filters shown | `ข้อมูลจากวันที่` / `ถึงวันที่` (DatePickers, max 31/12/5000). `ค้นหาโดย` dropdown (Id, ActionCode, ProgramCode, SourceName, PkField, PkValue, FieldName, OldValue, NewValue, Remark, CreateDate, CreateUser, CreateHost, CreateIp). Free-text value. | `Views/Shared/_BrowseControlPanel.cshtml:141-147`, `:256-261`; `Controllers/AuditLogController.generated.cs:191-212` |
| Filter semantics | Text fields use `LIKE '%v%'`; `Id` uses `=`; `CreateDate` uses `>= TO_DATE(v,'yyyy/MM/dd HH24:MI')`, so the user must type an **AD** year in `yyyy/MM/dd HH:mm`. **Start and end dates are ignored.** A blank value with an `=` field produces invalid SQL. | `Controllers/AuditLogController.generated.cs:152-188` |
| Columns (order) | Id `Id`; ActionCode `รหัสประเภทการทำงาน`; ProgramCode `รหัสโปรแกรม`; SourceName `ชื่อแหล่งกำเนิด`; PkField `ชื่อคีย์หลัก`; PkValue `ค่าของคีย์หลัก`; FieldName `ชื่อฟิล์ด`; OldValue `ค่าเก่า`; NewValue `ค่าใหม่`; Remark `หมายเหตุ`; CreateDateTH `วันที่สร้างข้อมูล` (BE date + `HH:mm:ss`); CreateUser `ผู้สร้าง`; CreateHost `เครื่องที่สร้างข้อมูล`; CreateIp `IP Address ที่เข้าใช้งานระบบ` | `Views/AuditLog/Index.cshtml:41-113`; `Controllers/AuditLogController.cs:99-117`; `../BC/Resources/DisplayName.resx:2919-2958` |
| Sort | None (empty order) | `Controllers/AuditLogController.cs:95` |

### D.13.2 AuditLogon: logon log (`/AuditLogon/Index`, SC05)

| Aspect | Detail | Source |
|---|---|---|
| Permission | SC05 ACCE; export SC05 EXPO (no button) | `Controllers/AuditLogonController.cs:48`, `:67`, `:90`; `Controllers/AuditLogonController.generated.cs:58` |
| Panel title | `ข้อมูลบันทึกการเข้าใช้งานระบบ` | `Controllers/AuditLogonController.cs:60` |
| Filters | Date range: `LOGON_DATE >= start` and `< end + 1 day`. `ค้นหาโดย`: Id, UserId, LogonCount, LogonComputer, IsLogonSuccess. UserId and Computer use LIKE; Id and LogonCount use `=`; for IsLogonSuccess the value must be the Thai word `ใช่`, and anything else means 0. Applied only when the value is non-empty. | `Controllers/AuditLogonController.cs:129-186` |
| Columns | Id `ลำดับ`; UserId `ไอดีของผู้ใช้งาน`; LogonDateTH `วันที่เข้าใช้โปรแกรม` (BE `dd/MM/yyyy HH:mm:ss`); LogonCount `เข้าระบบไม่สำเร็จ (ครั้ง)` (the RETRY_COUNT value before the attempt); LogonComputer `เครื่องที่ใช้เข้าสู่ระบบ` (IP); IsLogonSuccess `เข้าสู่ระบบสำเร็จ` rendered `ใช่`/`ไม่ใช่`. The IsLockAccount column (`ถูกล๊อกเข้าใช้งานระบบหรือไม่`) is commented out. | `Views/AuditLogon/Index.cshtml:41-80`; `../BC/Resources/DisplayName.resx:2898-2916` |
| Sort | `LOGON_DATE DESC` | `Controllers/AuditLogonController.cs:96` |
| Data sources | SSO success writes one row with IP from **unvalidated** `X-Forwarded-For`. Password and MFA paths use the trusted-proxy resolver. Failed SSO attempts are **not** logged. | `Controllers/AuthController.cs:174-187`; `Controllers/AccountController.cs:816-822` |

### D.13.3 EventLog: service event log (`/EventLog/Index`, EV01)

| Aspect | Detail | Source |
|---|---|---|
| Permission | EV01 ACCE. Create, Edit and Delete actions exist (EV01 INST/UPDA/DELE), but **no Create or Edit views exist**. | `Controllers/EventLogController.cs:60`, `:80`, `:104`; `Controllers/EventLogController.generated.cs:52-215` |
| Panel title | **Not rendered**: ViewMode 5 has no case in the panel header switch, so only the tab title `Event Log` appears | `Controllers/EventLogController.cs:70`; `Views/Shared/_BrowseControlPanel.cshtml:23-54`; `Views/EventLog/Index.cshtml:24-27` |
| Filters | Dates (`EVENT_DATE >= start`; `<= end` at 00:00, which **excludes events later on the end day**). `ค้นหาโดย` (Process, Description, ReferenceNo, ErrorMessage) is **ignored**: the value always searches `DESCRIPTION OR ERROR_MESSAGE LIKE`. Hard-coded `DEPARTMENT_ID = 1`. A StatusList is built but not shown. | `Controllers/EventLogController.cs:137-162`, `:189-207`, `:46-55` |
| Columns | EventDate `วันที่`; EventType `รับ/ส่ง ข้อมูล`; MessageTypeDescription titled `ประเภทข้อมูล` (**always empty**, because the mapping is commented out); ReferenceNo `เลขที่อ้างอิง`; Process `ส่วนการทำงาน`; Description `รายละเอียด`; ErrorMessage `ข้อผิดพลาด` | `Views/EventLog/Index.cshtml:55-107`; `Controllers/EventLogController.cs:114-126`; `../BC/Resources/DisplayName.resx:717-735` |
| Sort | `EVENT_DATE DESC` | `Controllers/EventLogController.cs:110` |
| Script issues | `headerScript` loads the non-existent `~/Scripts/jquery.validate.min.js` (404) and loads `cdss.js` a second time | `Views/EventLog/Index.cshtml:28-32` |

---

## D.14 Bugs and inconsistencies (for the redesign backlog)

| # | Issue | Source |
|---|---|---|
| 1 | MFA is unreachable: it is wired only into the disabled password POST, and SSO skips it. MFA privileged programs include RQ01, the approvers. | `Controllers/AccountController.cs:73-76`, `:140-152`; `Controllers/AuthController.cs:130-136` |
| 2 | `CustomAuthorize` always overwrites its own Unauthorize redirect or JSON with a 401. Denied users silently land on the blank `Home/Index`, and AJAX gets HTML. | `Attributes/CustomAuthorizeAttribute.cs:78-92`; `Attributes/HandleUnauthorizeResultAttribute.cs:10-18` |
| 3 | The Unauthorize page's "Return to Previous" uses `PortalUrl`, which is not configured, so it ends on the error page. The page heading is English. | `Controllers/AccountController.cs:486`; `Views/Account/Unauthorize.cshtml:6`, `:13` |
| 4 | ReturnUrl and deep links are lost on SSO login. | `Controllers/AuthController.cs:136` |
| 5 | A 5-minute idle timeout with no client warning or AJAX handling. | `Web.config:129` |
| 6 | Header "user name" shows USER_ID. `UserInfo` constructor bug `this.userLogOn = userLogOn` (self-assignment, stays null). | `Models/LoginModel.cs:207`; `Security/UserInfo.cs:26-31` |
| 7 | ChangePassword Cancel button has no handler. The minimum length is not shown. The strength meter does not match the server policy. | `Views/Account/ChangePassword.cshtml:51`; `Scripts/cdss.js:29-51` |
| 8 | SSO users can be forced to change a local password they do not know. | §D.5.3 |
| 9 | `DisplayName.th-TH.resx` is never compiled and has a different SystemName. The language switch is not exposed; the app is Thai-only. | `UI.Web.csproj:3190`; `Views/Shared/_LanguageMenu.cshtml` |
| 10 | Logout link uses a `javascript:` URL. On strict-CSP pages (`Home/Index`) it is blocked, so an authenticated user on `Home/Index` cannot log out (likely CSP behaviour; verify in a browser). | `Views/Shared/_login.cshtml:10`; `Security/SecurityHeaders.cs:95-99` |
| 11 | Footer renders a stray `>`. Popup layout footer has another agency's copyright. LogOn and Home/Index lack `<!DOCTYPE>`, `<html>` and `<title>`. | `Views/Shared/_Layout.cshtml:93`; `Views/Shared/_LayoutPopUp.cshtml:61` |
| 12 | `_LayoutPopUp` loads the Kendo bundle (custom DatePicker reads `_yearOffset` at definition time) without defining `_yearOffset`, which likely throws a ReferenceError. | `Views/Shared/_LayoutPopUp.cshtml:20-22`; `Scripts/kendo/2024/cdss.kendo.datepicker.2024.js:198-199` |
| 13 | DateTimePicker shows AD while DatePicker shows BE. The validator message is English. The `YearOffset` comment sign is wrong. | §D.11.1 |
| 14 | `pageSize` appSetting is used as pager ButtonCount. | `Views/AuditLog/Index.cshtml:114` |
| 15 | AuditLog ignores the date range, uses an AD free-text date filter, and produces invalid SQL for a blank `=` search. EventLog ignores SearchBy, has an off-by-one end date and an always-empty MessageType column. EventLog Create/Edit views are missing. | §D.13 |
| 16 | SSO audit trusts raw `X-Forwarded-For`. SSO failures are not audited or throttled. | `Controllers/AuthController.cs:174-176` |
| 17 | The global binder doubles `'` in every string property, including passwords posted to ChangePassword. Stored hashes for passwords that contain `'` differ from what other apps would compute. | `Binder/CustomModelBinder.cs:85-88` |
| 18 | `_Layout` disables or hides globally named buttons (`#saveButton` and others) on every page. | `Views/Shared/_Layout.cshtml:109-122` |
| 19 | Dead code: `SessionEnd` (a GET that clears the auth cookie), `BackToIndex`, `_LogOnDisplay`, `_LanguageMenu`, `Mvc.sitemap`, Telerik level-2 window helpers, `resourceProvider` search, `GetDataProfile` with Razor in JS, `Home/About` and `Home/Contact` template pages, and `CheckUserIsOnline` (always false). | various, cited above |
| 20 | Unhandled-error UX is split: an English `Error.cshtml` vs the Thai `ErrorPage`. | §D.8.3 |
| 21 | `Global.asax.cs` embeds a Stimulsoft licence key in source (value intentionally not reproduced). | `Global.asax.cs:46-52` |

---

## D.15 Configuration keys that affect the UI (names only)

| Key | Effect | Source |
|---|---|---|
| `pageSize`, `pageHeight` | Grid pager button count; `pageHeight` is unused in shell code | `Web.config:35-36` |
| `UnsuccessCount`, `PasswordExpire` | Lock threshold; unused | `Web.config:37-38` |
| `YearType`, `YearOffset` | BE display | `Web.config:48-50` |
| `PasswordStorage`, `LegacyPasswordAcceptUntil` | Hash format and DES acceptance (backend) | `Web.config:72`, `:89` |
| `Sso.Enabled`, `Sso.DiscoveryUrl`, `Sso.DiscoveryCacheTtlHours`, `Sso.AuthorizeUrl`, `Sso.TokenUrl`, `Sso.UserInfoUrl`, `Sso.LogoutUrl`, `Sso.ClientId`, `Sso.CallbackUrl`, `Sso.LogoutCallbackUrl`, `Sso.Scope`, `Sso.CitizenIdClaimKey`, `Sso.ClientSecret` (secrets file) | SSO button and flow | `Web.config:76-87`; `Secrets.appSettings.config.example:7` |
| `MfaMode`, `MfaPrivilegedPrograms`, `MfaEnforceFrom`, `MfaIssuer`, `MfaSecretKey` (secrets file) | MFA | `Web.config:97-103` |
| `Csrf:AllowedOrigins`, `Csrf:RequireOriginOrToken` | CSRF | `Web.config:105-107` |
| `TrustedProxyAddresses`, `ClientIpHeader`, `LogonThrottleExemptIps` | Throttle and audit IP | `Web.config:112-116` |
| `AuthRecheckMinutes` (not set; default 5) | Mid-session user recheck | `Security/AuthTicketGate.cs:38-45` |
| `PortalUrl` (not set) | Unauthorize "Return" target | `Attributes/CustomAuthorizeAttribute.cs:230` |
| `<forms timeout=5 name=SSPF>`, `<httpCookies>`, `<sessionState>` | Session | `Web.config:129-133` |
| `maxRequestLength` / `maxAllowedContentLength` | Upload limit ≈ 50 MB | `Web.config:173`, `:214` |
