# A. Signing / Approval Core (legacy SSPF, staff-side signer app)

Scope: the screens a signer ("ผู้บังคับบัญชา" / authorize person) uses to review, approve, reject and digitally sign
licence requests in the legacy ASP.NET MVC 5 app `SSPF`, plus the server rules the UI relies on.

Citation convention: every `path:line` is relative to `D:\AI\E-sign\Old source code\did-spf\`
(e.g. `SSPF/Views/RequestApproval/_SignRequest.cshtml:119`). Thai UI strings are quoted verbatim.

Source map (what was read):

| Area | Files |
|---|---|
| Controller | `SSPF/Controllers/RequestApprovalController.cs`, `SSPF/Controllers/RequestApprovalController.generated.cs` |
| Backend proxy | `SSPF/Controllers/api/RequestEsigController.cs` |
| Views | `SSPF/Views/RequestApproval/{Index,IndexWeb,_SignRequest,_SignRequestList,_ApprovalStatus,_OtpVerification}.cshtml`, `SSPF/Views/Shared/_BrowseControlPanel.cshtml` (filter/toolbar for this page), `SSPF/Views/Shared/_DataControlPanel.cshtml` (sign button on request pages) |
| Models | `SSPF/Models/VRequestApprovalModel*.cs`, `SSPF/Models/RequestApprovalModel*.cs`, `SSPF/Models/SearchModel.cs` |
| Security | `SSPF/Attributes/RequestAccessFilter.cs`, `SSPF/Security/RequestAccessPolicy.cs`, `SSPF/Attributes/CustomAuthorizeAttribute.cs`, `SSPF/Security/AntiForgeryRequestFilter.cs`, `SSPF/App_Start/FilterConfig.cs` |
| JS | `SSPF/Scripts/cdss.js`, `cdss.datetime.th.js`, `cdss.csrf.js`, `cdss.sweetalert.js` (SweetAlert v1 fork), `jquery.bootstrap.loading.js` (`waitingDialog`) |
| BL/BC followed | `BL/Transaction/RequestApprovalGuard.cs`, `BL/Transaction/BLRequestApproval.cs`, `BL/Transaction/BLRequest.cs` (`UpdateSignApproval`, `SelectSignature`), `BC/View/Transaction/VRequestApproval/VRequestApproval.cs`, `BC/Constants/ApprovalStatusMgr.cs`, `BC/Constants/RequestTypeMgr.cs`, `BC/Enumerates/*.cs`, `BC/Constants/ClientError.cs`, `BC/Security/LicenseXmlSignatureVerifier.cs`, `DAL.OracleClient/Transaction/OracleRequestApprovalDbProvider.cs` |

Not in the repo (cannot be documented from source): the Oracle stored procedure `P_REQUEST_APPROVAL_LS` (decides which
approval rows appear in a signer's inbox), the DB view `V_REQUEST_APPROVAL` (columns `STATUS`, `CHECKING`,
`FAST_TRACK_PRIORITY`), the external REST backend behind `SpfBackendApiUrl`, and the ActiveX control
`Security.XmlDsig.ActiveX.cab`.

---

## 0. Reference values (magic numbers, labels, colours)

### 0.1 Approval row status (`T_T_REQUEST_APPROVAL.APPROVAL_STATUS`)

| Value | Enum | Label (UI) | Source |
|---|---|---|---|
| 0 | `Wait` | `รออนุมัติ` | `BC/Enumerates/ApprovalStatus.cs:10`, `BC/Constants/ApprovalStatusMgr.cs:31`, resx `ApprovalStatus_Wait` |
| 1 | `Approve` | `อนุมัติ` | `BC/Enumerates/ApprovalStatus.cs:11`, `BC/Constants/ApprovalStatusMgr.cs:32` |
| 2 | `Reject` | `ไม่อนุมัติ` | `BC/Enumerates/ApprovalStatus.cs:12`, `BC/Constants/ApprovalStatusMgr.cs:33` |

- Only 1 and 2 are accepted as a decision; anything else is refused with `ผลการพิจารณาไม่ถูกต้อง`
  (`BL/Transaction/RequestApprovalGuard.cs:25,29-32`; `SSPF/Controllers/RequestApprovalController.cs:299-302,517-520`;
  `BL/Transaction/BLRequest.cs:92-96`).
- The read-only "ตรวจสอบการลงนาม" grid on the new RequestInfo page maps unknown values to `รออนุมัติ`
  (`SSPF/Views/Request/shared/_ApproveCheck.cshtml:35-41`).
- No colour is applied to approval status anywhere; it is plain text in the popup grids.

### 0.2 Authorize level (`AUTHORIZE_LEVEL`)

| Value | Label (`AuthorizeLevelDesc`) | Meaning | Source |
|---|---|---|---|
| 0 | (empty) | — | `BC/View/Transaction/VRequestApproval/VRequestApproval.cs:66-67` |
| 20 | `ผู้ตรวจสอบและลงนาม` | Final signer: the only level that digitally signs XML, triggers licence issue and email | `VRequestApproval.cs:68-69`; `RequestApprovalController.cs:349,487`; `BL/Transaction/BLRequestApproval.cs:364` |
| any other n | `ผู้ตรวจสอบ {n}` (e.g. `ผู้ตรวจสอบ 10`) | Reviewer; approve/reject without digital signature | `VRequestApproval.cs:70-71`, resx `AuthorizeLevel_Approval` |

### 0.3 Request status used by the inbox (`V_REQUEST_APPROVAL.STATUS`, values of `RequestStatus`)

| Value | Enum | Used for | Source |
|---|---|---|---|
| 20 | `Inform` | Only requests in status 20 appear in the "pending" inbox; red "urgent" highlight only when status = 20 | `BC/Enumerates/RequestStatus.cs:14`; `BL/Transaction/BLRequestApproval.cs:512`; `SSPF/Views/RequestApproval/Index.cshtml:54` |
| 30 | `ResultChecked` | Set on the per-type request after the final approval or after any rejection; status icon column only shows for `Status >= 30` | `RequestStatus.cs:15`; `BL/Transaction/BLRequest.cs:166,266`; `Index.cshtml:85` |
| 40 | `LicenseRelease` | (≥30 so still shows the icon) | `RequestStatus.cs:16` |

`CHECKING` (`Checking` in the model, 1 char): `A` = approved, `R` = rejected; written to the per-type request table
(`CheckingStatus`) by `BLRequest.UpdateSignApproval` (`BL/Transaction/BLRequest.cs:165,266`).

### 0.4 Request types offered in the inbox filter

`GetRequestTypeList()` (`SSPF/Controllers/RequestApprovalController.cs:997-1010`):

| Key | Label |
|---|---|
| 0 | `ทุกประเภท` (default, = no filter) (`:1001`) |
| 2 | `คำขอรับใบอนุญาตประกอบกิจการโรงงานฯ (อ.1, อ.3, อ.20)` — **listed twice** (`:1002` and `:1005`) |
| 3 | `คำขออนุญาตขนย้ายวัตถุหรืออาวุธฯ (อ.9)` |
| 4 | `คำขออนุญาตสั่งหรือนำเข้ามาฯ (อ.4)` |
| 5 | `คำขออนุญาตขายหรือจำหน่ายฯ ในราชอาณาจักร (อ.15)` |
| 6 | `คำขออนุญาตขายหรือจำหน่ายฯ โดยการส่งอกไปนอกราชอาณาจักร (อ.14)` (sic, typo `ส่งอก` in resource) |

Labels come from `BC/Constants/RequestTypeMgr.cs:31-38` → BC resx. `RequestTypeMgr` has no entries for types 50–53
(`RequestOpenProd` … `RequestChangePlantPerson`, `BC/Enumerates/RequestType.cs:20-23`), so `RequestTypeDesc` for those
renders empty (`VRequestApproval.cs:43-44`).

### 0.5 Sign option of the signer (`T_M_AUTHORIZE_PERSON.SIGN_OPTION`)

| Value | Meaning | Source |
|---|---|---|
| 0 | USB token on the signer's PC, signed in browser via ActiveX | `RequestApprovalController.cs:356` comment `ใช้ token` |
| 1 | Certificate file (PFX) stored on the server + stored PIN; server signs | `RequestApprovalController.cs:384` comment `ใช้ File on Server` |
| other | Not handled: level-20 approval fails with the "signature required" message | `RequestApprovalController.cs:441-445` |

### 0.6 Other hard-coded values

| Value | Meaning | Source |
|---|---|---|
| `SignBySystem = 3` | Every signature from this app is stamped "E-Signature (Web)" (1=E-Licensing Win, 2=E-Internet Web, 3=E-Signature Web, 4=E-Licensing for Trader Win) | `RequestApprovalController.cs:462,689` |
| `clsid:F243B018-295A-4DF0-BA4E-37899E68B388`, `codebase="Security.XmlDsig.ActiveX.cab"` | ActiveX signer object `CDSSXmlDsigActiveX` | `SSPF/Views/RequestApproval/Index.cshtml:30` (also on the 5 request Entry pages, e.g. `SSPF/Views/RequestImport/Entry.cshtml:27`) |
| `OPTION_CODE = 'Email_E_Signature'` | Recipient mailbox for result emails | `RequestApprovalController.cs:1259` |
| `pathXml = ~/App_Data/XmlFile` | Where the to-be-signed XML is written on every popup open | `SSPF/Web.config:45`; `RequestApprovalController.cs:1224-1241` |
| `SignedXmlPath` (empty → `~/App_Data/xmlSigned/Licenses`) | Where signed XML evidence is stored | `SSPF/Web.config:47`; `RequestApprovalController.cs:1112-1121` |
| `pageSize = 10` | Used as pager **button count**, not page size | `SSPF/Web.config:35`; `RequestApprovalController.generated.cs:106-109`; `Index.cshtml:117` |
| `YearOffset = 543` | Buddhist-era offset for all dates in UI | `SSPF/Web.config:50`; `SSPF/Views/Shared/_Layout.cshtml:24` |
| Forms auth `timeout="5"` sliding | Session expires after 5 idle minutes | `SSPF/Web.config:129` |
| `RequestAccess.Mode = Enforce` | Request-level access check is enforced (Audit = log only) | `SSPF/Web.config:68`; `SSPF/Security/RequestAccessPolicy.cs:74-77` |
| `LicenseXmlSignatureSkipVerify` (empty) | `true` disables server verification of token-signed XML | `SSPF/Web.config:109`; `RequestApprovalController.cs:1081-1085` |
| `CertPinKey` | Key to decrypt the stored certificate PIN (SignOption 1) | `SSPF/Web.config:70`; `RequestApprovalController.cs:388` |
| Program codes | `REQUEST_APPROVAL = "RQ01"` (same as `REQUEST`), `APPROVAL_PROCESS = "MA14"`; actions `ACCESS="ACCE"`, `UPDATE="UPDA"` | `SSPF/Constants/ProgramCode.cs:58,61,79`; `SSPF/Constants/ActionCode.cs:10,16` |

---

## 1. Landing page and menu

### 1.1 `IndexWeb` (post-login landing)
- After login (password and SSO) the user is redirected to `RequestApproval/IndexWeb`
  (`SSPF/Controllers/AccountController.cs:175,698`, `SSPF/Controllers/AuthController.cs:136`).
- `IndexWeb` only requires an authenticated user (`[Authorize]`, `SSPF/Controllers/RequestApprovalController.cs:733-738`)
  and renders the layout with **no content** (`SSPF/Views/RequestApproval/IndexWeb.cshtml:1-5`). It sets an unused
  `ViewBag.WhereClause` (`RequestApprovalController.cs:736`).
- The header logo/title links back to it (`SSPF/Views/Shared/_Layout.cshtml:54`).

### 1.2 Menu
- Menu item `คำขอใบอนุญาต/หนังสืออนุญาต สำหรับผู้บังคับบัญชา` → `RequestApproval/Index` (`SSPF/Menu.th-TH.sitemap:4`).
  Other items: report `รายงานสรุปการตรวจสอบและลงนาม` and `เปลี่ยนรหัสผ่าน` (`:5-8`). Menu uses security trimming and
  empty groups are removed client-side (`SSPF/Views/Shared/_Menu.cshtml:18-45`).

---

## 2. Screen: Signing inbox — `RequestApproval/Index`

Page title / heading: `ลงนามคำขอใบอนุญาต/หนังสืออนุญาต` (`RequestApprovalController.cs:752`; resx
`RequestApproval_Index_Title`; `SSPF/Views/RequestApproval/Index.cshtml:21-27`).

### 2.1 Access
| Rule | Source |
|---|---|
| GET/POST `Index` and grid read `_Index` require program `RQ01` + `ACCE` | `RequestApprovalController.cs:743,770,798` |
| Not authorised → always HTTP 401 (the friendlier JSON/redirect from `ReturnUnAuthorizeAction` is overwritten by `HttpUnauthorizedResult`) | `SSPF/Attributes/CustomAuthorizeAttribute.cs:75-92` |
| Password expired → ajax gets `{unauthorizeMessage:"กรุณาเปลี่ยนรหัสผ่าน"}`, full page redirects to `Account/ChangePassword` | `CustomAuthorizeAttribute.cs:96-118` |
| The list is computed for the **logged-in user's** `AuthorizePersonId` (`T_S_USER.AUTHORIZE_PERSON_ID`); a user not linked to a signer gets `authorizePersonId = 0` → empty list | `RequestApprovalController.cs:801-808`; `BL/Transaction/BLRequestApproval.cs:499-514` |
| The ActiveX `<object>` is injected in the page head (needed later by the sign popups) | `Index.cshtml:28-31` |

### 2.2 Filter panel (rendered by `_BrowseControlPanel` with `ViewMode = RequestApproval (22)`)

`ViewBag.ViewMode = ControlViewMode.RequestApproval` (`RequestApprovalController.cs:757`; enum value 22 in
`SSPF/Enumerates/ControlViewMode.cs:32`).

| Control | Label | Default | Notes | Source |
|---|---|---|---|---|
| `StartDate` (Kendo DatePicker, max 31/12/5000) | `ข้อมูลจากวันที่` | empty | filters `DOCUMENT_DATE >= start 00:00:00` and is passed to the SP | `_BrowseControlPanel.cshtml:122-123`; `BLRequestApproval.cs:474-477,499` |
| `EndDate` | `ถึงวันที่` | empty | `DOCUMENT_DATE <= end 23:59:59` | `_BrowseControlPanel.cshtml:124-125`; `BLRequestApproval.cs:479-482` |
| `RequestType` dropdown (350px) | `ประเภทคำขอ` | `ทุกประเภท` (0) | `>0` adds `REQUEST_TYPE = n` | `_BrowseControlPanel.cshtml:126-130`; `BLRequestApproval.cs:484-487` |
| `SearchBy` dropdown (200px) | `ค้นหาโดย` | first item = `ผู้ประกอบการ` | options: `TraderName`=`ผู้ประกอบการ`, `RegisterNo`=`เลขที่คำขอ`, `DocumentNo`=`เลขรับเรื่อง` | `_BrowseControlPanel.cshtml:132-136`; `RequestApprovalController.cs:960-970`; BC resx `VRequestApproval_*` |
| `SearchValue` textbox (280px) | — | empty | `<column> LIKE '%value%'` (contains, case per DB collation); only for the 3 whitelisted fields; `'` escaped by the model binder | `_BrowseControlPanel.cshtml:137`; `RequestApprovalController.cs:879-901`; `SSPF/Binder/CustomModelBinder.cs:46-61` |
| `SearchButton` | `ค้นหา` | — | In this view mode it is rendered **without `type`**, i.e. as a text `<input>` styled as a button; click → grid `read()` only | `_BrowseControlPanel.cshtml:282-287`; `Index.cshtml:171-174` |

Behaviour rules:
- Changing date/type/search does **not** reload the grid; only `ค้นหา` does (`Index.cshtml:171-174`). The search keeps
  the current page number (no `page(1)`), so a narrowed result can show an empty page (`Index.cshtml:172`).
- The panel's generic search handler shows `กรุณารอสักครู่...` (`_BrowseControlPanel.cshtml:381-383`), but `Index`
  removes it with `.off("click")` (`Index.cshtml:171`), so no spinner on search.
- Grid request payload (`onAdditionalData`): `StartDate, EndDate, RequestType, SearchBy, SearchValue, isApproved,
  ApprovaType` (`Index.cshtml:126-138`).
- Dates are sent in Buddhist year and converted back by the model binder (`SSPF/Binder/CustomModelBinder.cs:24-31,92-103`).

### 2.3 Toolbar (below the filter)

| Control | Label | Behaviour | Source |
|---|---|---|---|
| `SignRequestApproval` button | `   ตรวจสอบ/ลงนาม   ` | Calls `SignRequest()` (see 2.8). Disabled while "signed" mode is on | `_BrowseControlPanel.cshtml:352-353`; `Index.cshtml:157-164` |
| `chkRequestApprova` checkbox | `ดูคำขอที่ลงนาม` | Toggles inbox mode: unchecked = pending (to sign), checked = history (already signed) | `_BrowseControlPanel.cshtml:355`; `Index.cshtml:133-136,139-169` |
| `ApprovaType` dropdown (100px) | (no label) | Items `อนุมัติ`(1), `ไม่อนุมัติ`(2); **disabled** by default; enabled only in signed mode; `change` reloads grid | `_BrowseControlPanel.cshtml:357-358`; `RequestApprovalController.cs:1017-1025`; `Index.cshtml:159,163,177-180` |

Toggling `ดูคำขอที่ลงนาม` (`Index.cshtml:139-169`):
- Checked: sets `EndDate` = today and `StartDate` = `new Date()` with `setMonth(-2)` (both with +543). `setMonth(-2)`
  means "November of the previous year, same day", **not** "2 months ago" (`Index.cshtml:141-147`) — a bug; the
  effective window is ~10–21 months depending on today's month.
- Unchecked: clears both dates (`Index.cshtml:148-151`).
- Always: resets to page 1, reloads, disables/enables `ตรวจสอบ/ลงนาม` and `ApprovaType`, unticks all checkboxes and
  clears the selection array `itmSelect` (`Index.cshtml:153-168`).
- There is no "all results" option in `ApprovaType`; signed mode always filters by one decision
  (`BLRequestApproval.cs:489-492`). The initial value bound is `Model.ApprovaType` = 0 (byte default), which is not in
  the list, so the first option `อนุมัติ` is what the user sees (`_BrowseControlPanel.cshtml:358`).

### 2.4 Grid columns (`grid`, `Index.cshtml:39-121`)

Model id: `RequestApprovalId` (`Index.cshtml:42`).

| # | Field | Header | Width | Template / format | Source |
|---|---|---|---|---|---|
| 1 | `RequestApprovalId` | header = checkbox `chkAll` | 30px, centred | `<input type='checkbox' name='RequestApprovalInformCheck' value='#=RequestApprovalId#'>` | `Index.cshtml:47-52` |
| 2 | `RequestTypeDesc` | `ประเภทคำขอ` | 300px | red if urgent (2.6) | `Index.cshtml:53-58` |
| 3 | `DocumentNo` | `เลขรับเรื่อง` | 150px | red if urgent | `Index.cshtml:59-64` |
| 4 | `DocumentDate` | `วันที่คำขอ` | 150px | `GetThaiDate(...)` → `dd/MM/yyyy` (BE), red if urgent | `Index.cshtml:65-70`; `SSPF/Scripts/cdss.datetime.th.js:25-36` |
| 5 | `TraderName` | `ผู้ประกอบการ` | from metadata | red if urgent | `Index.cshtml:71-76` |
| 6 | `BuyerName` | `ส่งไปยัง/ขายให้กับ` (hard-coded) | from metadata | empty when null; red if urgent | `Index.cshtml:77-83` |
| 7 | `Status` | `สถานะ` | 50px centred | icon only: `approved.png` when `Status >= 30 && Checking == 'A'`; `reject.png` when `Status >= 30 && Checking == 'R'`; else blank. Icons wrapped in dead `<a href='#'>` | `Index.cshtml:84-88` |
| 8 | `RegisterUserName` | `เจ้าหน้าที่รับเรื่อง` | from metadata | red if urgent | `Index.cshtml:89-94` |
| 9 | `RegisterNo` | `เลขที่คำขอ` | 150px | red if urgent | `Index.cshtml:95-100` |
| 10 | `RegisterDate` | `วันที่รับเรื่อง` | 150px | Thai date, red if urgent | `Index.cshtml:101-106` |
| 11 | `RequestApprovalId` | (blank) | 300px | row buttons (2.7) | `Index.cshtml:107-114` |

Grid options: pageable with empty message `ไม่มีข้อมูล` and `ButtonCount = pageSize(10)`; page size = Kendo MVC
default (10, not configured); resizable columns; single row selection (no action); `DataBound = onGridBound`
(`Index.cshtml:117-120`). Server caps page size at 100 (`SSPF/Attributes/GridPagingFilter.cs:9-13`).
No column sorting or column filtering is enabled.

Data returned to the browser per row also includes `PersonIdCardNo`, `PersonEmail` and `SignatureFileName` that the
grid never shows (`RequestApprovalController.cs:847,849,858`) — inconsistent with F-515, which removed them from the
popup grids (`RequestApprovalController.cs:90-93`).

### 2.5 Which rows appear ("my turn") and ordering

| Rule | Detail | Source |
|---|---|---|
| Candidate rows | IDs returned by stored procedure `P_REQUEST_APPROVAL_LS(v_AUTHORIZE_PERSON_ID, v_SHOW_APPROVED, v_START_DATE, v_END_DATE)`; `v_SHOW_APPROVED` = 1 in signed mode, 0 in pending mode. **SP body not in repo** — the "is it my turn" rule for the inbox lives there | `BLRequestApproval.cs:319-346,499`; `DAL.OracleClient/Transaction/OracleRequestApprovalDbProvider.cs:163-171` |
| Pending mode | `STATUS = 20` and `REQUEST_APPROVAL_ID IN (sp result)` + filters | `BLRequestApproval.cs:508-514` |
| Pending sort | `FAST_TRACK_PRIORITY DESC, REQUEST_ID` (urgent first, then oldest request id) | `BLRequestApproval.cs:512` |
| Signed mode | `REQUEST_APPROVAL_ID IN (sp result)` + `APPROVAL_STATUS = <ApprovaType>` + filters (no status restriction) | `BLRequestApproval.cs:501-507,489-492` |
| Signed sort | `DOCUMENT_DATE DESC` | `BLRequestApproval.cs:505` |
| Empty SP result | empty grid | `BLRequestApproval.cs:503,510` |
| Invalid `ApprovaType` (non-byte) | empty grid | `BLRequestApproval.cs:381-394,462-466` |
| Paging | all rows fetched, then paged in memory (`Skip/Take`), total = full count ("แก้ไขข้อมูลหายบางตัว เรื่อง GetPaged 01/04/69") | `RequestApprovalController.cs:816-823` |
| Dead code | `GetPagedVRequestAprovalForSignatureByAuthorizePersonId` and `GetWhereClauseCout` no longer used | `RequestApprovalController.cs:811-814,915-953`; `BLRequestApproval.cs:396-456` |

### 2.6 Urgent (ด่วน / fast-track) highlight
- Text of columns 2,3,4,5,6,8,9,10 is `color:red` when `FastTrackPriority == 1 && Status == 20`
  (`Index.cshtml:54,60,66,72,78,90,96,102`). Status column and buttons are not coloured.
- `FastTrackPriority` comes from the view (`SSPF/Models/VRequestApprovalModel.generated.cs:172`), passed at
  `RequestApprovalController.cs:861`. `FastTrackRemark` exists in the model (`VRequestApprovalModel.generated.cs:174`) but
  is never sent or shown.

### 2.7 Row button matrix (column 11)

| Mode (`isApproved`) | `แสดงคำขอ` (blue) | `ดูสถานะ` (yellow) | Checkbox | Source |
|---|---|---|---|---|
| Pending (false) | yes | no | yes | `Index.cshtml:109-111` |
| Signed (true) | yes | yes | yes (but `ตรวจสอบ/ลงนาม` is disabled) | `Index.cshtml:109-111,157-160` |

`isApproved` is echoed back per row by the server (`RequestApprovalController.cs:859`).

- `แสดงคำขอ` (`data-key = RequestId`): shows `กรุณารอสักครู่...` and navigates **in the same tab** to
  `Request/ViewRequest?requestId=…`; a 5-second timer would reload the grid (irrelevant after navigation). If key ≤ 0:
  `swal("คำเตือน", "ไม่พบเลขคำขอที่ต้องการ", "error")` (`Index.cshtml:270-284`). An older commented version opened a
  new tab (`Index.cshtml:199-206`).
  - `ViewRequest` redirects to the type-specific Entry page for types 2,3,4,5,6 and 7 (7 → PlantEst page), otherwise
    returns an **empty page**; it has no explicit permission attribute and throws if the id does not exist
    (`SSPF/Controllers/RequestController.cs:74-97`). The target Entry pages need their own program right (e.g.
    `RQ05 INSERT` for import) plus `RequestAccessFilter(SignerScopeOnly = true)` (`SSPF/Controllers/RequestImportController.cs:87-90`).
- `ดูสถานะ` (`data-key = RequestApprovalId`): opens window `EntryWindow3` with `_ReviewApprovalStatus`, title
  `ทำการลงลายเซ็นต์` (misleading — it is read-only) (`Index.cshtml:285-295`).

### 2.8 Selection and single vs bulk routing

Selection is held in a JS array `itmSelect` of `RequestApprovalId` strings (`Index.cshtml:236`).

| Rule | Source |
|---|---|
| On each grid dataBound, rows whose id is in `itmSelect` are re-ticked → selection survives paging | `Index.cshtml:239-246` |
| Ticking a row pushes its id; unticking splices it | `Index.cshtml:248-255` |
| `chkAll` ticked: ticks all visible rows and **overwrites** `itmSelect[0..n-1]` with visible ids (other pages' selections partially overwritten) | `Index.cshtml:257-262` |
| `chkAll` unticked: unticks visible rows but removes only `itmSelect[last]` (`$.inArray(this.value)` on the header checkbox = -1 → `splice(-1,1)`) — **bug**: hidden selections remain and get signed | `Index.cshtml:263-266` |
| `SignRequest()`: none selected → `swal("คำเตือน", "กรุณาเลือกรายการที่ต้องการ", "error")` | `Index.cshtml:322-324` |
| exactly 1 → single popup `EntryWindow` (1130×600) loading `_ReviewSignRequest?signRequest=<id>` | `Index.cshtml:301-310,122` |
| 2+ → bulk popup `EntryWindow2` (600×400) loading `_ReviewSignRequestList?signRequest=<id,id,...>` | `Index.cshtml:311-321,123` |
| Both windows titled `ทำการลงลายเซ็นต์`; modal, draggable, resizable, scrollable | `Index.cshtml:122-124,309,319` |
| Closing any of the 3 windows reloads the inbox grid (`onWindowClose`) but does **not** clear `itmSelect` | `Index.cshtml:191-194,122-124` |
| No client-side check that the selected rows are "my turn"; the server rejects the whole batch (3.6) | — |

Handler-accumulation bug: `window.onGridBound` is also the `DataBound` handler of the popup history grids
(`_SignRequest.cshtml:107`, `_ApprovalStatus.cshtml:90`); every popup grid bind re-attaches `.on("click")` handlers
to the main-grid checkboxes/buttons without `.off()` (`Index.cshtml:248-295`). After that, one click pushes the same id
twice → `itmSelect.length == 2` → the **bulk** popup opens for a single row, and unticking leaves a copy behind.

### 2.9 POST `Index`
- The POST action rebuilds the page but does not set `ViewBag.ApprovaTypeList`
  (`RequestApprovalController.cs:770-788`), so rendering the `ApprovaType` dropdown would fail
  (`_BrowseControlPanel.cshtml:358`). Normally unreachable because the search "button" is not a submit.

---

## 3. Screen: Single sign popup — `_SignRequest` (window `EntryWindow`)

Opened from the inbox (2.8) or from the `ตรวจสอบ/ลงนาม` button on a request Entry page (section 6).

### 3.1 Load rules (`GET RequestApproval/_ReviewSignRequest?signRequest=<RequestApprovalId>`)

| Rule | Source |
|---|---|
| Only requires login (`[CustomAuthorize]` without program code) because several request pages call it | `RequestApprovalController.cs:148-150` |
| Row found but the user may not open the request → HTTP 403 (`RequestAccessPolicy.Check`) | `RequestApprovalController.cs:158-162` |
| Non-numeric `signRequest` → `FormatException` → error page in the window | `RequestApprovalController.cs:156`; `BC/Constants/SqlText.cs:69-76` |
| Row not found → popup renders with an empty model (no error) | `RequestApprovalController.cs:176-180` |
| **No check that the user is this row's signer or that it is their turn** at load time; enforced only on save | — |
| `SignOption` is read from the row's signer master record | `RequestApprovalController.cs:168-172` |
| The unsigned XML of the licence is generated now and embedded in a hidden field; this also **writes a file** `{RequestId}_{RevisionNo}_{ApprovalSeq}.xml` under `pathXml` on every open | `RequestApprovalController.cs:173,1197-1245` |
| Revision dropdown items = revisions in which the row's signer appears | `RequestApprovalController.cs:182,978-990` |

### 3.2 Layout

| Element | Content | Source |
|---|---|---|
| Heading (green) | `ลงนาม คำขอใบอนุญาต/หนังสืออนุญาต` | `_SignRequest.cshtml:16` |
| Buttons | `บันทึกข้อมูล` (green, `btnSignData`), `ปิด` (yellow, `btnClose`) | `_SignRequest.cshtml:19-20` |
| Status box (right) | `แบบคำขอ:` RequestTypeDesc; `เลขรับเรื่อง:` **RegisterNo**; `วันที่รับเรื่อง:` RegisterDate `dd/MM/yyyy` | `_SignRequest.cshtml:24-28` |
| Hidden fields | `RequestApprovalId, ReferenceNo, AuthorizePersonId, AuthorizeLevel, SignOption, PersonEmail, xmlForSign` | `_SignRequest.cshtml:34-40` |
| Decision radios (`name=ApprovalStatus`) | `อนุมัติ` (value 1, **checked by default**), `ไม่อนุมัติ` (value 2) | `_SignRequest.cshtml:44-45` |
| Remark | label `หมายเหตุ`, textarea `ApprovalDescription` 500px × 4 rows | `_SignRequest.cshtml:50-52` |
| History bar | `สถานะการลงนาม` · `ประวัติการลงนาม` · `ครั้งที่` + `RevisionNo` dropdown (100px) | `_SignRequest.cshtml:58-67` |

Label inconsistency: the popup labels `RegisterNo` as `เลขรับเรื่อง`, while the inbox grid labels `RegisterNo` as
`เลขที่คำขอ` and `DocumentNo` as `เลขรับเรื่อง` (BC resx `VRequestApproval_RegisterNo`/`_DocumentNo`; the result email
also uses `เลขรับเรื่องที่ {DocumentNo} - เลขคำขอที่ {RegisterNo}`, `RequestApprovalController.cs:1299`).

### 3.3 Approval-chain history grid (`gridRequestApproval`)

| Column | Header | Format | Source |
|---|---|---|---|
| `PersonFullName` (prefix+name+" "+surname) | `ชื่อ` | 300px | `_SignRequest.cshtml:78-82`; `VRequestApproval.cs:52-57` |
| `AuthorizeLevelDesc` | `ระดับผู้ตรวจสอบ/ลงนาม` | 100px | `_SignRequest.cshtml:83-87` |
| `ApprovalStatusDesc` | `สถานะอนุมัติ/ลงลายเซ็นต์` | 100px | `_SignRequest.cshtml:88-92` |
| `ApprovalDate` | `วันที่อนุมัติ/ลงลายเซ็นต์` | `dd/MM/yyyy HH:mm:ss` BE via `GetThaiDateTime` (blank if null) | `_SignRequest.cshtml:93-98`; `cdss.datetime.th.js:38-48` |
| `ApprovalDescription` | `รายละเอียดอนุมัติ/ลงลายเซ็นต์` | — | `_SignRequest.cshtml:99-102` |

- Data: `RequestApproval/_ViewRequestApproval` with `{signRequest, revisionNo}` (`_SignRequest.cshtml:74`;
  `Index.cshtml:226-228`). The id is mapped to its request; rows of that request for the requested revision (empty →
  **latest** revision) sorted by `AUTHORIZE_LEVEL ASC` (`RequestApprovalController.cs:67-88`;
  `BL/Transaction/BLRequestApproval.cs:264-278,520-551`). Invalid revision → empty grid.
- Permission: `_ViewRequestApproval` requires program **`MA14` (APPROVAL_PROCESS) ACCESS** + `RequestAccessFilter`
  (`RequestApprovalController.cs:65-66`). A signer without MA14 gets 401 and an empty history grid — risk to verify
  against role data.
- Grid: pageable (empty text `ไม่มีข้อมูล`, ButtonCount 10), resizable, single select (`_SignRequest.cshtml:104-107`).
- Rows sent omit ID card, email and signature image (F-515) (`RequestApprovalController.cs:90-129`).
- Revision dropdown: values = `RevisionNo`, texts = 1..n in ascending revision order; preselected = this row's revision
  (`RequestApprovalController.cs:978-990`; `_SignRequest.cshtml:61-65`). `change` → global `RevisionNo` = value and reload
  (`Index.cshtml:326-330`).
- Bugs: (a) the first load sends no revision (global `RevisionNo` undefined) → shows the **latest** revision even if
  the dropdown shows an older one; (b) the global `RevisionNo` is never reset, so the next popup (other request) loads
  the previously chosen revision number (`Index.cshtml:188,226-228,326-330`).

### 3.4 Save flow (`btnSignData` click) — decision tree

Source: `_SignRequest.cshtml:115-233`.

1. Button is disabled immediately (`:116`) and is **never re-enabled** on any client-side failure (user must close and
   reopen the popup).
2. If decision = `ไม่อนุมัติ` and remark is blank (trimmed) → focus remark and
   `swal("กรุณากรอกหมายเหตุ กรณีไม่ผ่านการอนุมัติ!!")`; stop (`:118-123`). Remark is optional for approval. No max-length
   check client-side (DB/model limit 512, `SSPF/Models/VRequestApprovalModel.generated.cs:155`).
3. `obj = document.CDSSXmlDsigActiveX`; if missing → `swal("คำเตือน", "Object is not created.", "error")`; stop (`:126-129`).
4. Show `กรุณารอสักครู่...` (`:131`).
5. **Token path** when `SignOption == "0" && AuthorizeLevel == "20"` (`:132`) — note: taken for **both approve and reject**:
   1. `certInfo = obj.GetCertificateFromStoreByEmail(PersonEmail)` — the certificate is located by the **signer's email**
      from the approval row (`:135-136`).
   2. `certInfo` contains `Certificate Store does not exists.` → `swal("คำเตือน", "กรุณา Install Active-X", "error")` (`:137,208-211`).
   3. `certInfo` contains `Certificate is not found for Email:` → `swal("คำเตือน", "กรุณาเสียบ Token USB", "error")` (`:138,204-207`).
   4. `verifySign(certInfo)` — certificate-date check is fully commented out and always returns `""` (`:235-288`); the
      commented messages were `Token ยังไม่สามารถใช้งานได้ วันเริ่มต้นการใช้งาน […]`, `Token ไม่สามารถใช้งานได้ วันที่สิ้นสุดการใช้งาน […]`,
      `ไม่พบข้อมูลการใช้งานได้ของ Token นี้` (dead).
   5. Close the popup **before** signing (`:145`) → triggers inbox grid reload.
   6. `xmlSigned = obj.SignXmlWithCertFromStoreByEmail(email, xmlForSign)` (token PIN prompt is the ActiveX/OS dialog;
      the app has no PIN field) (`:146`).
   7. Result contains `The operation was canceled by the user` or has no `<` → `swal("คำเตือน", "ลงนามไม่สำเร็จ/ยกเลิกการลงนาม/ไม่ได้มีการเสียบ Token USB", "error")` (`:147,198-202`).
   8. POST JSON `{xmlSigned, requestApprovalId, authorizePersonId, approvalStatus, approvalDescription}` to
      `_setXmlSigned` (`:149-157`). Also logs the payload to the console (`:150`).
   9. Success with `Result` containing `UnSuccess :` → hide spinner, `swal(result.Result)` (`:182-184`).
   10. Otherwise → `location.reload()` (whole page) (`:185-188`). Code after it (`#SignPopup` modal hide, grid reload,
       clear `itmSelect`) is redundant; `#SignPopup` does not exist (`:189-192`).
   11. HTTP error → `swal(xhr.responseText)` **without hiding the spinner** (`:158-160`).
6. **Non-token path** (everything else: reviewers of any level, level 20 with SignOption 1, any rejection by non-token users):
   close popup (`:213`), `approveRequest(decision, remark)` posts form-encoded `{xmlSigned:"", requestApprovalId,
   authorizePersonId, approvalStatus, approvalDescription}` to `_setXmlSigned` (`:290-338`):
   - Success: hide spinner; `UnSuccess :` → `swal(result.Result)`; else `window.location.reload()` (`:325-337`).
     Commented success texts: `ทำรายการสำเร็จ : … รายการ`, `ลงนามคำขอสำเร็จ` (no success message is shown today).
   - HTTP error → `swal("คำเตือน", xhr.responseText, "error")` (`:307-309`).
7. Exceptions (`:218-232`):
   - `Error: Automation server can't create object` → `swal("คำเตือน", "กรุณาติดตั้ง ActiveX Plugin เพื่อใช้ลงนามเอกสารอิเล็กทรอนิกส์", "error")`.
   - `TypeError: obj.GetCertificateFromStoreByEmail is not a function` (any non-IE browser) →
     `swal("คำเตือน", "กรุณาใช้ Internet Explorer", "error")`.
   - other → `swal("คำเตือน", err, "error")`.
   => Token signing works **only in Internet Explorer**; non-token approvals work in any browser.
8. `ปิด` closes the window (`:356-358`).

`swal` = SweetAlert v1 fork, confirm button `ตกลง` (`SSPF/Scripts/cdss.sweetalert.js` defaults).
There is **no confirmation dialog** before approve/reject.

### 3.5 Server: `POST RequestApproval/_setXmlSigned` — checks in order

Permission: `RQ01` + `UPDA`, POST only (`RequestApprovalController.cs:295`); CSRF header added by `cdss.csrf.js`
(`SSPF/Scripts/cdss.csrf.js:17-26`) and checked globally (`SSPF/App_Start/FilterConfig.cs`, `AntiForgeryRequestFilter`).

| # | Check | Result / message (`Result` field) | Source |
|---|---|---|---|
| 1 | `approvalStatus` ∈ {1,2} | `UnSuccess : ผลการพิจารณาไม่ถูกต้อง` | `:299-302`; `RequestApprovalGuard.cs:25,29-32` |
| 2 | `requestApprovalId <= 0` or row not found | returns `{Result:"0"}` = treated as **success** by the UI (silent no-op, page reloads) | `:320-324,495` |
| 3 | Logged-in user's `AuthorizePersonId` must equal the row's signer (client value ignored) | `UnSuccess : ผู้ใช้นี้ไม่ใช่ผู้ลงนามของรายการนี้` | `:326-332,136-141` |
| 4 | Turn check `RequestApprovalGuard.CanSign`: row not yet decided (status null/0, no ApprovalDate, no SignatureFileName) **and** all rows of same request+revision with smaller `ApprovalSeq` are approved (1) | `UnSuccess : รายการนี้ลงนามแล้ว หรือยังไม่ถึงลำดับการลงนาม` | `:334-338,1069-1072`; `RequestApprovalGuard.cs:26,38-48,76-83` |
| 5 | Approve: signer master record exists | `UnSuccess : ไม่พบข้อมูล ผู้ลงนามในข้อมูลอ้างอิง` | `:342-346` |
| 6a | Approve + level 20 + SignOption 0: verify client XML (single enveloped XmlDsig, valid signature, cert in validity period and chaining to a server-trusted root, content equals server-regenerated XML) | `UnSuccess : ลายมือชื่อดิจิทัลไม่ถูกต้อง (<Result>)` where Result ∈ `Malformed, NotSigned, MultipleSignatures, InvalidSignature, CertificateExpired, UntrustedCertificate, ContentMismatch` | `:356-370,1079-1096`; `BC/Security/LicenseXmlSignatureVerifier.cs:11-21` |
| 6a' | … empty `xmlSigned` | falls to #7 | `:358,441-445` |
| 6b | Approve + level 20 + SignOption 1: no cert path | `UnSuccess : ไม่พบ Certificate File` | `:424-427` |
| 6b' | wrong PIN / bad PFX (CryptographicException) | `UnSuccess : PIN หรือไฟล์ใบรับรองไม่ถูกต้อง` (via outer catch) | `:390,498-501`; `BC/Constants/ClientError.cs:19,81-87` |
| 6b'' | cert not yet valid / expired | JSON key is lower-case **`result`**: `UnSuccessไม่สามารถใช้งานได้ก่อนวันที่ {dd/MM/yyyy}.` / `UnSuccessไม่สามารถใช้งานได้หลังจากวันที่ {dd/MM/yyyy}.` (literal braces; no ` : `). The UI reads `result.Result` → undefined → JS TypeError → **nothing shown** | `:397-404` |
| 6b''' | server sign + self-verify fails | `UnSuccess : ลงนามด้วยใบรับรองบน server ไม่สำเร็จ (ลายมือชื่อตรวจไม่ผ่าน) กรุณาติดต่อผู้ดูแลระบบ` | `:408-419,1099,1130-1175` |
| 7 | Approve + level 20 and no signature file produced | `UnSuccess : ไม่พบลายมือชื่อดิจิทัลของรายการที่ต้องลงนาม (ระดับ 20) — ไม่บันทึกทั้งชุด` | `:441-445`; `RequestApprovalGuard.cs:51` |
| 8 | Reject: no signature processing at all (token signature produced by the client for a reject is discarded) | — | `:454-458` |
| 9 | Save via `BLRequest.UpdateSignApproval` (section 8); first BL message → `UnSuccess : <message>` | e.g. `ผลการพิจารณาไม่ถูกต้อง`, the level-20 signature message, or `เกิดข้อผิดพลาดในระบบ กรุณาติดต่อผู้ดูแลระบบ (รหัสอ้างอิง XXXXXXXX)` | `:460-486`; `BL/Transaction/BLRequest.cs:88-546`; `ClientError.cs:18` |
| 10 | Level 20 (approve or reject) → send result email (errors swallowed) | — | `:487-490,1254-1342` |
| 11 | Done | `{Result:"0"}` (`Rowcount` is never incremented) | `:495` |
| — | Any exception | `UnSuccess : <ClientError message>` | `:498-501` |

Fields written on the approval row: `SignBySystem=3`, `SignatureFileName` (level-20 approve only), `ApprovalDate` =
server time, `ApprovalStatus`, `ApprovalDescription` (remark), `UpdateDate/User` (`:462-469`). Remark is not required
server-side for reject (client-only rule).

Signature evidence storage: token XML saved via `SignedLicenseXmlStorage.Save` outside the web root and only the file
name stored (`:1105-1110`); server-signed XML likewise (`:1174`). The commented WCF upload (`FileTransferServiceClient`)
is dead but the client object and credentials are still created on every level-20 approval (`:352-355,371-380,422`).

The certificate is located on the client by e-mail, and the server verifies only that it chains to a trusted root — it
does **not** check that the certificate belongs to the signer (`LicenseXmlSignatureVerifier.cs:29` "การผูกใบรับรองกับตัวผู้ลงนาม … ยังไม่มีข้อมูลใน DB").

SignOption 1 side effect: after a successful certificate open, a plaintext stored PIN is re-encrypted with `CertPinKey`
(`:391,1040-1065`).

---

## 4. Screen: Bulk sign popup — `_SignRequestList` (window `EntryWindow2`, 600×400)

### 4.1 Load rules (`GET RequestApproval/_ReviewSignRequestList?signRequest=<id,id,…>`)

| Rule | Source |
|---|---|
| Requires `RQ01 ACCE` (stricter than the single popup) | `RequestApprovalController.cs:192` |
| No rows → HTTP 404 | `:199-204` |
| Any row whose request the user may not open → HTTP 403 for the whole set | `:206-210` |
| Header values (`AuthorizePersonId, AuthorizeLevel, SignOption, PersonEmail, RequestApprovalId`) are taken from `entitylist[0]` — the first row in **unspecified DB order** | `:212-221` |
| One unsigned XML per row, ordered by `RequestApprovalId` (must match server order on save) | `:223-230` |
| No turn / signer check at load | — |

### 4.2 Layout (`_SignRequestList.cshtml`)
- Heading `ลงนาม คำขอใบอนุญาต/หนังสืออนุญาต`; buttons `บันทึกข้อมูล` (`btnSignData2`), `ปิด` (`btnClose2`) (`:16-20`).
- No request info box, no history grid.
- Hidden fields incl. `RequestApprovalList` (raw id list) and `xmlForSignList` (renders `System.String[]` — unused) (`:26-33`).
- Radios `name=ApprovalStatus2`: `อนุมัติ` (1, default) / `ไม่อนุมัติ` (2) (`:36-37`); one decision and one remark apply to
  **all** selected rows (`:97,238`).
- Remark `หมายเหตุ`, 500px × 8 rows (`:42-44`).
- The XML array is injected into script with `@Html.Raw(JsonConvert.SerializeObject(...))` (`:72`) — no `</script>`
  escaping (XSS risk if licence data contains it).

### 4.3 Save flow (`_SignRequestList.cshtml:54-173`)
Same as 3.4 with these differences:
- Remark rule and message identical: `กรุณากรอกหมายเหตุ กรณีไม่ผ่านการอนุมัติ!!` (`:58-62`); button stays disabled (`:55`).
- Token path decision uses the **first row's** SignOption/level (`:71`). Mixed selections misbehave: if row[0] is not
  level 20 but others are, the client skips signing and the server refuses the batch (4.4 #5).
- Token path signs every XML in a loop; the PIN prompt may appear per document; the first failure stops with
  `ลงนามไม่สำเร็จ/ยกเลิกการลงนาม/ไม่ได้มีการเสียบ Token USB` (`:84-94`).
- `verifySign` error would be shown as `swal(strError, "error")` (title/text swapped) — dead because verifySign returns `""` (`:77-81`).
- Token success: does **not** reload the page; hides non-existent `#SignPopup`, reloads the grid, clears `itmSelect`,
  hides spinner (`:133-139`). Non-token success: `window.location.reload()` (`:265-277`).
- POST targets `_setXmlSignedList` with `{xmlSigned:[...], requestApprovalList, authorizePersonId, approvalStatus, approvalDescription}` (`:97-105,238-246`).
- DOM-id collision: both popups contain `#ApprovalDescription`, `#SignOption`, `#AuthorizeLevel`, `#PersonEmail`,
  `#RequestApprovalId`; Kendo keeps closed window content in the DOM, so after opening the single popup once, the bulk
  popup reads the **single popup's** remark/sign option (`_SignRequest.cshtml:34-51` vs `_SignRequestList.cshtml:26-43`).

### 4.4 Server: `POST RequestApproval/_setXmlSignedList`

| # | Check | Message | Source |
|---|---|---|---|
| 1 | decision ∈ {1,2} | `UnSuccess : ผลการพิจารณาไม่ถูกต้อง` | `RequestApprovalController.cs:517-520` |
| 2 | `requestApprovalList` null → `{Result:"0"}` (silent success) | — | `:538,724` |
| 3 | Rows processed in `Id` order | — | `:540-548` |
| 4 | **Every** row's signer = logged-in user | `UnSuccess : ผู้ใช้นี้ไม่ใช่ผู้ลงนามของรายการนี้` | `:550-556` |
| 5 | **Every** row passes `CanSign` | `UnSuccess : รายการนี้ลงนามแล้ว หรือยังไม่ถึงลำดับการลงนาม` | `:558-562` |
| 6 | Approve: signer exists | `UnSuccess : ไม่พบข้อมูล ผู้ลงนามในข้อมูลอ้างอิง` | `:566-570` |
| 7 | Approve, SignOption 0, any level-20 row, and `xmlSigned` missing or count ≠ row count | `UnSuccess : ไม่พบลายมือชื่อดิจิทัลของรายการที่ต้องลงนาม (ระดับ 20) — ไม่บันทึกทั้งชุด` | `:573-578` |
| 8 | Per level-20 row: same verification/server-sign rules and messages as 3.5 #6–#7; any failure rejects the whole batch **before** saving | see 3.5 | `:580-680` |
| 9 | Save loop: each row saved in its **own** BL transaction; first BL error returns `UnSuccess : …` — rows already saved stay saved (partial commit) | — | `:685-714` |
| 10 | Email per level-20 row | — | `:715-718` |

---

## 5. Screen: Approval status popup — `_ApprovalStatus` (window `EntryWindow3`, 1000×600)

| Rule | Source |
|---|---|
| Opened only from `ดูสถานะ` in signed mode | `Index.cshtml:285-295,109-111` |
| Load requires `RQ01 ACCE` + `RequestAccessPolicy.Check` (403) | `RequestApprovalController.cs:248-262` |
| Server still generates (and writes to disk) the unsigned XML although the view never uses it | `RequestApprovalController.cs:272` |
| Heading `ลงนาม คำขอใบอนุญาต/หนังสืออนุญาต`, only button `ปิด` | `_ApprovalStatus.cshtml:16-19` |
| Same info box (`แบบคำขอ:`, `เลขรับเรื่อง:` RegisterNo, `วันที่รับเรื่อง:`) | `_ApprovalStatus.cshtml:22-28` |
| Same history bar, revision dropdown and 5-column grid as 3.3; data param from `additionalRequestApprovalStatusData` (`signRequest = approvalStatusHistory`) | `_ApprovalStatus.cshtml:41-91`; `Index.cshtml:230-232` |
| Read-only: no decision controls | — |
| Bugs: `ปิด` handler binds to the **first** `#btnClose` in the DOM (`$("#btnClose").off().on()`), which is the single sign popup's button if that popup was opened earlier → status popup cannot be closed by its button; `changeRevisionNo` reads the first `#RevisionNo`/`#gridRequestApproval` likewise | `_ApprovalStatus.cshtml:96-99`; `Index.cshtml:326-330` |

---

## 6. Entry point on request pages: `ตรวจสอบ/ลงนาม` button

| Rule | Source |
|---|---|
| Shown on Entry pages of PlantEst, Move, SaleDom, Import, SaleInt when `ViewBag.EnableSign` | `SSPF/Views/Shared/_DataControlPanel.cshtml:14,88-135` |
| `EnableSign = true` when the user's approval row for the request (latest revision: `ORDER BY REVISION_NO DESC`) has `ApprovalStatus == 0`; `requestApprovalId` = that row | `SSPF/Controllers/RequestImportController.cs:250-268` (same pattern `RequestMoveController.cs:851-855`, `RequestPlantEstController.cs:1078-1082`, `RequestSaleDomController.cs:850-854`, `RequestSaleIntController.cs:313-317`) |
| Does **not** check turn order (previous signers) — the button can show before it is the user's turn; save fails with the "ยังไม่ถึงลำดับ" message | same + 3.5 #4 |
| Click → same `_SignRequest` popup in the page's own `EntryWindow`, title `ทำการลงลายเซ็นต์`; success reloads the request page | `SSPF/Views/RequestImport/Entry.cshtml:1586-1596`; `_SignRequest.cshtml:187,336` |

---

## 7. Unused: `_OtpVerification.cshtml`

- Buttons `ยืนยัน OTP` (`btnConfirmOtp`) and `ขอรหัส OTP ใหม่` (`btnRequestOtp`), label `เลขที่อ้างอิง` with hard-coded
  `1234`, textbox `txtOtp` (`SSPF/Views/RequestApproval/_OtpVerification.cshtml:6-17`).
- No controller action renders it and no script references it (repo-wide search). **There is no OTP step** in the
  legacy signing flow; it is a mock-up only.

---

## 8. What happens after a decision (business effects visible in the UI)

`BLRequest.UpdateSignApproval(request, approvalRow)` (`BL/Transaction/BLRequest.cs:88-546`), one DB transaction per row.

| Situation | Effect | Source |
|---|---|---|
| Any decision | Approval row saved; request `UpdateDate/User` saved | `BLRequest.cs:531-533` |
| **Reject (2)** by **any** signer (reviewer or final) | Per-type request (PlantEst / Move / SaleDom+linked Move / SaleInt+linked Move / Import) set to `CheckingStatus="R"`, status 30, `Message` = remark, `CheckingDate` = approval date. Request leaves every signer's pending inbox (status ≠ 20); remaining signers' rows stay `รออนุมัติ` | `BLRequest.cs:157-245` |
| **Approve (1)** by non-final signer | No request status change; request stays 20 and moves on to the next signer | `BLRequest.cs:246-529` (all branches gated by `isLastApproval`) |
| **Approve (1)** by final signer (`isLastApproval`: the user is the signer of the level-20 row with the highest seq in this revision) | `CheckingStatus="A"`, status 30; licence number allocated; licence status 30; licence `AuthorizeSignature` = signer's stored signature image | `BLRequest.cs:147,250-255`; `BL/Transaction/BLRequestApproval.cs:350-375` |
| Licence validity on final approval | PlantEst and Import: issue today, expiry today + 1 year − 1 day; Move: today + 179 days (also request Start/End); SaleDom: linked Move licence and own licence expire at today + 179 days, or at the P3/P5 document's expiry if it is less than 180 days away; SaleInt: today + 179 days | `BLRequest.cs:276-277,294-295,307-310,345-436,474-492,519-520` |
| Level-20 decision (approve **or** reject) | E-mail to mailbox `Email_E_Signature`, subject `การแจ้งผลการลงนามหนังสืออนุญาต <{type}> เลขรับเรื่องที่ {DocumentNo} - เลขคำขอที่ {RegisterNo}`; body ends with result `อนุมัติ`/`ไม่อนุมัติ` (bold 22px). Type texts: `ขอต่ออนุญาตใบ อ.2`, `ขออนุญาตขนย้าย`, `ขออนุญาต ขาย/ขนย้าย ในประเทศ` (+ second line `ขออนุญาตขนย้าย` for the linked move), `ขออนุญาต ขาย/ขนย้าย นอกประเทศ`, `ขออนุญาตสั่งนำเข้า`. Send result logged (1 ok / 2 failed); missing mailbox → message `ไม่สามารถส่ง Email ได้เนื่องจากไม่ได้ระบุ Email กรุณาระบุก่อนส่ง` built but **ignored** | `RequestApprovalController.cs:1254-1342`; `SSPF/App_GlobalResources/MessageDisplay.resx` `WarningEMailAddressCannotEmpty` |
| No in-app notification, no e-mail to the trader, no e-mail to the next signer | — | (none found in this area) |
| UI after save | Single popup: full page reload (inbox or request page). Bulk token path: grid reload only. No success toast | 3.4, 4.3 |

BL bugs visible to users: `ValidateSave` errors do not stop the commit, so the UI can show `UnSuccess : …` although data
was saved (`BLRequest.cs:155,531-537`); SaleInt allocates a licence running number even when not the final approval
(`BLRequest.cs:444-446`); final approval with no licence row throws (`BLRequest.cs:254`) → generic error with reference
code; SaleDom/SaleInt throw if the linked move request (same ReferenceNo, type 3) is missing (`BLRequest.cs:135-141`).

---

## 9. Signing chain, ordering and parallelism

| Rule | Source |
|---|---|
| A chain (revision) is created when staff choose signature type 1 and an approval process: rows copied from `T_M_APPROVAL_PROCESS_DTL` ordered by `AUTHORIZE_LEVEL, ITEM_NO`; new revision = max(revision)+1; all rows `ApprovalStatus=0`, `SignBySystem=0`; missing process detail → `ไม่พบรายละเอียดกระบวนการลงนามที่ระบุ` | `BL/Transaction/BLRequest.cs:776-850`; caller `SSPF/Controllers/RequestController.cs:275` |
| **Bug: `short seq = 1;` is never incremented** — every row of a chain created here gets `ApprovalSeq = 1` | `BLRequest.cs:814,824` |
| Server turn rule: a row can be signed only if all rows with a **smaller** `ApprovalSeq` in the same request+revision are approved. With all seq = 1 this check never blocks → effectively **parallel** signing; ordering then depends only on the inbox SP (not in repo) | `RequestApprovalGuard.cs:38-48` |
| Final signer = level-20 row with highest `APPROVAL_SEQ` (ties broken arbitrarily). With all seq = 1 a level-20 signer who signs before reviewers issues the licence immediately | `BLRequestApproval.cs:362-375`; `BLRequest.cs:147,250` |
| Rows can also be created/edited/deleted through SPFAPI (unsigned rows only: `รายการนี้ลงนามแล้ว ไม่สามารถลบได้`, `รายการนี้ลงนามแล้ว ไม่สามารถแก้ไขได้`) | `SPFAPI/APIs/Transaction/RequestApprovalController.generated.cs:64-72,142-143,178-210`; `RequestApprovalGuard.cs:14,16` |
| Any rejection ends the revision (request status 30/R); re-submission creates a new revision; history is browsable by `ครั้งที่` | 8; 3.3 |

---

## 10. Permission model the UI depends on

| Layer | Rule | Source |
|---|---|---|
| Global | Every action requires login (`AuthorizeAttribute`), CSRF filter (POST needs same origin/anti-forgery token), password-change filter | `SSPF/App_Start/FilterConfig.cs:16-19` |
| Program rights | Inbox and bulk/status popups: `RQ01 ACCE`; save: `RQ01 UPDA`; history grid: `MA14 ACCE`; single popup: login only | 2.1, 3.1, 3.3, 3.5, 4.1, 5 |
| `RequestAccessPolicy.Check(user, requestId)` | user linked to a signer → allowed only if they are a signer on **any revision** of that request; user not linked → needs `RQ01 ACCE`; errors → deny; `Enforce` mode (default) denies, `Audit` logs and allows; denials logged once per hour per key | `SSPF/Security/RequestAccessPolicy.cs:34-49,74-108,311-343` |
| `CheckSigner` (SignerScopeOnly) | signer users must be on the request; non-signers pass (program right checked elsewhere) | `RequestAccessPolicy.cs:56-71,110-133` |
| `RequestAccessFilter` | reads `request_id`/`requestId` (request id), `id`/`selectedRecord[]`/custom param (record id mapped to request via `RecordKind`), model `RequestId`/`Id`; non-numeric/negative → 403; record not found → 404; any request denied → 403 | `SSPF/Attributes/RequestAccessFilter.cs:66-179,187-331,333-364` |
| Signer identity on save | always from `T_S_USER.AUTHORIZE_PERSON_ID` of the logged-in user; client `authorizePersonId` ignored | `RequestApprovalController.cs:136-141,326-332,550-556` |

---

## 11. `RequestEsigController` (`/RequestEsig/*`) — proxy to the new backend

Used only by the read-only `Request/RequestInfo` page (tabs incl. `ตรวจสอบการลงนาม`) and its partials, not by the
signing inbox (`SSPF/Views/Request/RequestInfo.cshtml:128,194-197`; `SSPF/Views/Request/shared/*.cshtml`).
`RequestInfo` is hard-coded to `แบบ อ.1` and not linked from the inbox (`SSPF/Controllers/RequestController.cs:1456-1491`).

| Rule | Source |
|---|---|
| Class-level `[CustomAuthorize]` (login only) + `[RequestAccessFilter]` (request id from `request_id`/`requestId`/`id`) | `SSPF/Controllers/api/RequestEsigController.cs:22-23` |
| Calls `SpfBackendApiUrl` with a per-user bearer token (`BackendTokenFactory.Create(user, ip)`) | `:28-29`; `SSPF/Web.config:66` |
| `GetRequest(id, requestType)`: types 1 or 3 → `request-form-a1/request-info/{id}`, else `request/request-info/{id}` | `:113-125` |
| `factoryInfo`, `resultChkOfc`, `meetingInfo` forwarders; on success enriches `data.product_type_group_name` and `data.objective_type_name` via two extra lookups | `:31-39,76-100,1297-1315` |
| Backend non-2xx → body passed through unchanged; exception → HTTP 500 `{error: <ClientError message>}` | `:60-61,106-110` |
| `is_sucess` (sic) or `is_success`; if absent → treated as success | `:1285-1294` |
| Grid endpoints (`_RequestDetail`, `_RequestPerson`, `_RequestBuilding`, `_RequestChangeBuilding`, `_RequestDoc(documentType 1/2/3/6/99)`, `_ResultBgChk`, `_ResultLocChk` (object or array), `_ResultMeeting(meetingType 1/2/3)`, `_ResultLocChkOfc`, `_ApprovalCheck`) fetch the full list and page in memory; any failure → empty grid silently | `:317-1279` |
| `_ApprovalCheck` → `authorize-process/approval-esig-list/{requestId}`; UI columns `ลำดับ` (empty template), `วันที่อนุมัติ`, `สถานะการอนุมัติ`, `ชื่อ-นามสกุล ผู้อนุมัติ`, `ตำแหน่ง`, `ลำดับการลงนาม`, `รายละเอียด`; page size 10 with size picker and refresh | `:1196-1279`; `SSPF/Views/Request/shared/_ApproveCheck.cshtml:3-31` |
| `PreviewPdf(token)` → `attachment/download/{token}` (escaped); failure page text `ไม่พบไฟล์เอกสาร` or `BackendFileResponse.FailureMessage(status)` (403 = no right); inline only for PDF/JPEG/PNG/GIF by magic bytes, others download with CSP sandbox | `:205-248,262-276` |
| `PreviewDefault` → `กรุณาเลือกไฟล์เพื่อเปิดดู` | `:251-256` |
| Report endpoints (request/licence forms A1, A3, open, expand, plant change, person change) → PDF only, otherwise `ไม่พบไฟล์เอกสาร` | `:1318-1409` |
| Error page style: grey `#d3d3d3` full-height centred `<h2>` | `:279-312` |

---

## 12. Timeouts and timing

| Item | Value | Source |
|---|---|---|
| Session (forms auth) | 5 minutes sliding. An expired session during sign makes the ajax receive the login page: non-token path shows the login HTML in a `คำเตือน` dialog; token path throws a JS error and leaves the spinner | `SSPF/Web.config:129`; 3.4 |
| bfcache | Page restored from back/forward cache is force-reloaded | `SSPF/Views/Shared/_Layout.cshtml:11-13` |
| "แสดงคำขอ" timer | 5 s (dead after navigation) | `Index.cshtml:274-279` |
| Signing / OTP / token-PIN timeout | none in app code (PIN dialog belongs to the token middleware) | — |

---

## 13. Bugs, inconsistencies and dead code (summary)

1. Chain creation never increments `ApprovalSeq` → server turn order is not enforced; final signer can issue the licence before reviewers (`BL/Transaction/BLRequest.cs:814,824`; `RequestApprovalGuard.cs:38-48`).
2. `chkAll` untick leaves hidden selections that are then signed (`Index.cshtml:263-266`).
3. Duplicate click handlers after popup grid binds → duplicate ids, bulk popup for one row (`Index.cshtml:238-296`; `_SignRequest.cshtml:107`).
4. `btnSignData`/`btnSignData2` stay disabled after a validation error (`_SignRequest.cshtml:116-123`; `_SignRequestList.cshtml:55-62`).
5. DOM-id collisions between the three popups (remark, sign option, close button, revision dropdown) (sections 4.3, 5).
6. Global `RevisionNo` not reset between popups; history initially shows the latest revision regardless of dropdown (3.3).
7. Token path is used for **rejection** by a level-20 token user; the signature is discarded server-side (`_SignRequest.cshtml:132`; `RequestApprovalController.cs:454-458`).
8. SignOption 1 certificate-date errors use key `result` (lower case) and are never shown; date format prints literal braces (`RequestApprovalController.cs:395-404,628-637`).
9. `privateCertificate == null` check is unreachable (`:393`).
10. Missing/unknown approval id returns success `"0"` (`:320-324,495`).
11. Token-path HTTP error leaves the spinner (`_SignRequest.cshtml:158-160`; `_SignRequestList.cshtml:106-108`).
12. Token signing requires Internet Explorer + ActiveX (`_SignRequest.cshtml:219-225`).
13. Certificate not bound to the signer; selected by e-mail only (`LicenseXmlSignatureVerifier.cs:29`; `_SignRequest.cshtml:135-136`).
14. Opening any sign/status popup writes an XML file to `App_Data/XmlFile` (GET with side effect; concurrent opens of the same row share one file name) (`RequestApprovalController.cs:1224-1241`).
15. Bulk popup takes SignOption/level from an arbitrary first row; mixed-level batches fail (`RequestApprovalController.cs:214-221`; `_SignRequestList.cshtml:71`).
16. Bulk save is not atomic across rows (`RequestApprovalController.cs:685-714`).
17. `ValidateSave` errors do not prevent commit (`BLRequest.cs:155`).
18. Label mismatch `เลขรับเรื่อง` vs `เลขที่คำขอ` between popup and grid (3.2).
19. Duplicate `อ.1, อ.3, อ.20` option in type filter (`RequestApprovalController.cs:1002,1005`); no labels for types 50–53.
20. `setMonth(-2)` date default bug in signed mode (`Index.cshtml:146`).
21. `pageSize` setting used as pager button count (`Index.cshtml:117`).
22. Search keeps current page; search "button" has no `type` (renders as text input) (`Index.cshtml:172`; `_BrowseControlPanel.cshtml:285`).
23. POST `Index` lacks `ApprovaTypeList` (`RequestApprovalController.cs:770-788`).
24. Grid JSON leaks signer ID card no. and e-mail (`RequestApprovalController.cs:847,849`).
25. `_ViewRequestApproval` needs `MA14`, unlike the rest of the flow (`RequestApprovalController.cs:65`).
26. `ReturnUnAuthorizeAction` result is always overwritten by a bare 401 (`CustomAuthorizeAttribute.cs:78-92`).
27. `ViewRequest` returns a blank page for types other than 2–7 (`RequestController.cs:80-96`).
28. Dead code: `_OtpVerification.cshtml`; `GetWhereClauseCout`; `GetPagedVRequestAprovalForSignatureByAuthorizePersonId`; `verifySign` body; commented `.button-sign` handler (`Index.cshtml:196-224`); `FileTransferServiceClient` setup; `xmlForSignList` hidden field; `Close()` action (`RequestApprovalController.generated.cs:55-59`); `ViewBag.WhereClause` on Index/IndexWeb; `GetModel` (`RequestApprovalController.generated.cs:67-102`).
29. Payload logged to browser console (`_SignRequest.cshtml:150`; `_SignRequestList.cshtml:98`).
30. XML embedded with `Html.Raw` JSON in a script block (`_SignRequestList.cshtml:72`).

---

## 14. Notes for the Next.js redesign (derived, not legacy behaviour)

- Keep: per-signer inbox (pending vs signed), urgent-first sort with red highlight, single + bulk decision, remark
  mandatory on reject, server-side identity/turn/decision checks, level-20-only digital signature with server-side XML
  verification, chain history by revision, result e-mail to `Email_E_Signature`.
- Decide explicitly (legacy is broken or implicit): turn order (sequential by seq vs parallel), whether reviewers must
  finish before level 20, binding certificate ↔ signer, confirmation dialog, success feedback, atomic bulk save, the
  missing SP rule for "my turn", what history filter "all" should show, and replacing ActiveX/IE with a signing agent.
