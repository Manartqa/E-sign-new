# C. Administration / settings screens (SSPF staff app)

Scope: approval-process (signing workflow) setup, authorized signers, roles and permissions, users, and the lookups and shared partials those screens use.

**Citation root.** Every path is relative to `D:\AI\E-sign\Old source code\did-spf\`. `SSPF/...` is the staff web app; `BL/...` and `BC/...` are the business and entity layers. They are cited only where they explain a UI rule.

**Label source.** A field label such as `ชื่อกระบวนการอนุมัติ` comes from `[FieldDisplayName("Key")]`. The key resolves through `BC/Resources/DisplayName.resx`, because the models import `CDSS.DID.SPF.BC.Attributes`. Page titles come from `SSPF/App_GlobalResources/DisplayName.resx`. Thai strings are quoted verbatim.

---

## 0. Headline findings (read first)

1. **These screens are not in the SSPF menu.** `SSPF/Menu.th-TH.sitemap:3-9` (and the identical `Menu.sitemap`) lists only `RequestApproval/Index`, a report and `ChangePassword`. ApprovalProcess, AuthorizePerson, Role and User can be reached only by typing the URL.
2. **The header forms have no Save button.** The shared `#saveButton` is commented out in `SSPF/Views/Shared/_DataControlPanel.cshtml:62-63`, and none of the admin Create/Edit views add their own. `_Layout.cshtml:111-112` would disable it anyway. The forms have several text inputs, so pressing Enter does not submit them either (HTML implicit-submission rule). As shipped, the ApprovalProcess, AuthorizePerson, Role and User header forms **cannot be saved from the UI**. The only working write paths are the AJAX ones: approval steps, delete/move step, save position.
3. **The grid delete icons do nothing.** Every browse grid renders `<a class='delete' ...>`, but the handler that would bind it is commented out in `SSPF/Scripts/cdss.js:127-150`.
4. **The friendly "no permission" message is never shown.** `CustomAuthorizeAttribute` sets the message result and then always overwrites it with `HttpUnauthorizedResult` (`SSPF/Attributes/CustomAuthorizeAttribute.cs:78-92`). The result is a 401 and a login redirect. The JS branches that test `data.unauthorizeMessage` fire only for the expired-password case (`:98-106`).
5. **The UI never hides or disables controls by permission.** "เพิ่มข้อมูล", edit and delete icons, step buttons and so on always render. Permission is enforced only server-side per action (see §1.2).
6. **Several fields have no admin UI at all.** Signer certificate data (`SignOption`, `CertFilePath`, `CertPin`, `PersonSignature`), signer `PersonType`, signer `AuthorizeLevel`, and the user-to-signer link (`User.AuthorizePersonId`) are not editable in any SSPF screen. Runtime signing depends on all of them (§3.6, §5.8).

---

## 1. Cross-cutting behaviour (applies to every admin screen)

### 1.1 Permission model

| Concept | Rule | Source |
|---|---|---|
| Storage | User → `T_S_USER_ROLE` (UserId, RoleNo) → `ROLE_DTL` (RoleNo, ActionCode, ProgramCode). A user is allowed if **any** of their roles has a `ROLE_DTL` row for (program, action). There is no deny rule. | `BL/Security/BLUserRole.cs:31-49` |
| Check entry point | `[CustomAuthorize(ProgramCode, ActionCode)]` → `ProgramPermissionSeam.IsAuthorized` → `BLUserRole.IsAuthorizeUser` (fail closed). | `SSPF/Attributes/CustomAuthorizeAttribute.cs:180-196`, `SSPF/Security/ProgramPermissionSeam.cs:16-31` |
| Action codes | `ACCE` access/view, `INST` insert, `UPDA` update, `DELE` delete, `EXPO` export, `IMPO` import, `PRIN` print, `SEND` send | `SSPF/Constants/ActionCode.cs:10-17` |
| Program codes used here | `SC01` User; `SC02` Role **and** RoleDtl **and** ProgramCode lookups; `SC03` UserRole (unused by these screens); `MA14` AuthorizePerson **and** ApprovalProcess (shared); `MA17` Position; `MA10` NamePrefix | `SSPF/Constants/ProgramCode.cs:13-16,30,34,36,58` |
| Shared code consequence | One `MA14` grant controls both signer maintenance and workflow maintenance. The User screen's role list calls `Role/_RoleAll` (`SC02 ACCE`), so a user admin without `SC02 ACCE` sees an empty roles grid. | `SSPF/Constants/ProgramCode.cs:34,58`; `SSPF/Controllers/RoleController.cs:54`; `SSPF/Views/User/Create.cshtml:91` |
| Global filters | Login required for every action (`AuthorizeAttribute`). Anti-CSRF on every POST. Forced password change. WHERE-clause tokens are signed and bound to the user. Grid pageSize is capped at 100. | `SSPF/App_Start/FilterConfig.cs:12-24`; `BC/Constants/PagingLimit.cs:48-56` |
| Expired password | Once a check passes, an expired password redirects to `Account/ChangePassword`. For AJAX it returns `{unauthorizeMessage:"กรุณาเปลี่ยนรหัสผ่าน"}`. | `SSPF/Attributes/CustomAuthorizeAttribute.cs:97-118` |
| Unauthorized result | Always `HttpUnauthorizedResult` (see §0.4). The intended texts (`ไม่มีสิทธิเข้าถึงข้อมูล`, `ไม่มีสิทธิสร้างข้อมูล`, `ไม่มีสิทธิแก้ไขข้อมูล`, `ไม่มีสิทธิลบข้อมูล`, `ไม่มีสิทธิ export ข้อมูล`, ...) are dead. | `SSPF/Attributes/CustomAuthorizeAttribute.cs:202-234`; `SSPF/App_GlobalResources/MessageDisplay.resx` |
| Menu trimming | The Kendo menu uses `SecurityTrimming(true)`. JS removes empty groups and hides the navbar when it is empty. | `SSPF/Views/Shared/_Menu.cshtml:18-46` |

### 1.2 How the UI reacts to permission

- **No element is hidden or disabled based on permission.** `ViewBag.isAuthorize` is set (`CustomAuthorizeAttribute.cs:71`) but no view reads it. Grep of `SSPF/Views` finds no use.
- Clicking a control the user lacks rights for produces a 401, and the browser follows the forms-auth login redirect. For AJAX calls the code expects JSON, so the swal error handlers show text such as `"delete not success, Error : ..."` (`SSPF/Views/ApprovalProcess/Edit.cshtml:174-181`).

### 1.3 Browse (list) page pattern — `_BrowseControlPanel.cshtml`

All four admin index pages use `ControlViewMode.General`.

| Element | Behaviour | Source |
|---|---|---|
| Title | `<h3>` showing `ViewBag.CurrentFunctionText` | `SSPF/Views/Shared/_BrowseControlPanel.cshtml:25-29` |
| Search row | Label `ค้นหาโดย`. Kendo DropDownList `SearchBy` (first item preselected, 200px) from `ViewBag.SearchList`, then TextBox `SearchValue` (280px). | `:256-261` |
| Search button | `ค้นหา` submits a POST to the same Index action and shows the `กรุณารอสักครู่...` spinner. | `:276-281, 381-383` |
| Add button | `เพิ่มข้อมูล` → `location.href = Url.Action("Create")` with the spinner. Always visible. | `:293-295, 373-376` |
| Search semantics | Text fields: `COLUMN LIKE '%value%'` (Oracle, case-sensitive contains). Numeric fields: `= value`; a non-numeric value becomes `NULL`, so no rows. Date fields: `>= TO_DATE(value,'yyyy/MM/dd HH24:MI')`, so the user must type that exact format. | e.g. `SSPF/Controllers/RoleController.cs:325-357`; `BC/Constants/SearchFieldPolicy.cs` (CleanSearchValue); `SSPF/Binder/CustomModelBinder.cs:66-74` |
| Search state | After a POST the search form is reset to a new `SearchModel`, so the criteria are not echoed back. | e.g. `SSPF/Controllers/RoleController.cs:105` |
| Grid paging | `.Pageable()` with `ButtonCount(pageSize)`. `pageSize` is appSetting `10`. No explicit `PageSize`, so the Kendo default (10) applies (assumed). Empty grid text: `ไม่มีข้อมูล`. | `SSPF/Web.config:35`; e.g. `SSPF/Views/Role/Index.cshtml:78` |
| Grid sort / filter | **None.** Grids are not `.Sortable()` or `.Filterable()`. The server passes `""` as orderBy, so rows come back in DB default order. | e.g. `SSPF/Controllers/RoleController.cs:126` |
| Row selection | Single row; it has no effect on the index pages. | e.g. `SSPF/Views/Role/Index.cshtml:80` |
| Row actions | Column 1 shows an edit icon linking to `Edit?key=...` and a delete icon (`a.delete`, data-controller/action/keys). The delete icon is dead (§0.3). | e.g. `SSPF/Views/Role/Index.cshtml:43-46`; `SSPF/Scripts/cdss.js:127-150` |
| Export | Each controller has `ExportToExcel` (`EXPO`), but **no button** calls it. | e.g. `SSPF/Controllers/RoleController.generated.cs:177-222` |

### 1.4 Entry (create/edit) page pattern — `_DataControlPanel.cshtml`

| Element | Behaviour | Source |
|---|---|---|
| Title | `<h3>@CurrentFunctionText` | `SSPF/Views/Shared/_DataControlPanel.cshtml:38-41` |
| Close button | `ปิด` (yellow, `data-confirm=1`). Confirm swal: title `ต้องการปิดหน้าจอนี้ใช่หรือไม่`, buttons `ใช่` / `ไม่ใช่`. Then navigates to `indexUrl`, which comes from `?indexUrl` or a same-origin referrer and falls back to Home. | `:64-65, 278-295`; `SSPF/Scripts/cdss.js:239-266`; `SSPF/Attributes/ActionAdditionalDataFilter.cs` |
| Save button | **Commented out** (§0.2). Its handler (client-validate, then spinner) still exists. | `:62-63, 311-316` |
| Delete button | Commented out. The handler would call `OpenDeleteDataDialog` (confirm `ต้องการลบใช่หรือไม่`). | `:66-67, 297-305`; `SSPF/Scripts/cdss.js:216-237` |
| Audit box | `สร้างเมื่อ {AuditCreateText}` / `ปรับปรุงล่าสุด {AuditUpdateText}`. Format `"{0} โดย {1}"` = `<date> โดย <user>`. On Create both are `- โดย -`. | `:151-157`; `SSPF/App_GlobalResources/DisplayName.resx` (`Shared_AuditText`) |
| Attachment button | Hidden on all admin screens (`EnableAttachment=false`). | e.g. `SSPF/Controllers/RoleController.cs:161` |

**Audit date format differs by screen.** ApprovalProcess uses `CreateDateTH`, a date-only `dd/MM/yyyy` in the th-TH calendar (`BC/Master/ApprovalProcess/ApprovalProcess.generated.cs:482-489`). Role uses `DateTime.ToCultureDate()` with default `ToString` (`SSPF/Controllers/RoleController.cs:211-212`). User and AuthorizePerson use `ToCultureDateString()` = `dd/MM/yyyy HH:mm:ss` in BE (`SSPF/Extension/ControlHelper.cs:195-202`).

### 1.5 Validation pipeline

| Layer | Behaviour | Source |
|---|---|---|
| Client required | `[CustomRequired]` is registered with `RequiredAttributeAdapter` and produces jQuery-unobtrusive `required` with message `"{label} ไม่สามารถว่างได้"`. | `SSPF/Global.asax.cs:43`; `SSPF/Attributes/CustomRequiredAttribute.cs:15-18`; `DisplayName.resx` `RequiredValidation` |
| Client max length | `[StringLength(n)]` produces the default MVC English message ("The field X must be a string with a maximum length of n."). | model files (see tables) |
| Client caveats | jQuery-validate ignores hidden inputs, so Kendo DropDownLists (the original input is hidden) are not client-validated. Partials loaded by AJAX into Kendo windows are never parsed by unobtrusive validation. | general; `SSPF/Views/ApprovalProcess/Edit.cshtml:139-142` |
| Server DataAnnotations | **Ignored.** No admin controller checks `ModelState.IsValid` before saving. `ApprovalProcessDtl` even calls `ModelState.Clear()`. | e.g. `SSPF/Controllers/RoleController.generated.cs:56-93`; `SSPF/Controllers/ApprovalProcessDtlController.cs:129` |
| Server BC validation | `entity.Validate()` uses compiled CDSSLib attributes `ZeroLengthValidation` (required) and `OverMaxLengthValidation(n)`. Their message text is inside the CDSSLib DLL, not in the source. The controller adds them as `"{MessageTopic}: {MessageDescription}"`. | e.g. `BC/Security/Role/Role.generated.cs:198-199`; `SSPF/Controllers/RoleController.generated.cs:76-83` |
| Exceptions | `ClientError.Message(ex)` produces: Oracle unique violation `ข้อมูลซ้ำกับที่มีอยู่แล้ว`, concurrency `ข้อมูลถูกแก้ไขโดยผู้ใช้อื่นแล้ว กรุณาโหลดใหม่`, otherwise `เกิดข้อผิดพลาดในระบบ กรุณาติดต่อผู้ดูแลระบบ (รหัสอ้างอิง XXXXXXXX)`. App-thrown messages (namespace `CDSS*`, `Exception`, `ApplicationException`) are passed through. | `BC/Constants/ClientError.cs:19-48, 81-146` |
| PK duplicate | `DataDuplicatedException(key)` is thrown by `BL*.Save` when the PK already exists on insert. Its text comes from CDSSLib. It is shown via `ValidationSummary(true)`. | e.g. `BL/Security/BLRole.cs:91-94` |

### 1.6 Data-binding quirks a redesign must not copy blindly

- Every bound `string` property has `'` replaced by `''` at model binding, for all models and not only search. Apostrophes in names may be stored doubled unless the DAL un-escapes them (`SSPF/Binder/CustomModelBinder.cs:75-90`).
- Date values whose year differs from now by more than 300 have `YearOffset` subtracted (BE → CE) when the UI culture is th-TH (`SSPF/Binder/CustomModelBinder.cs:92-103`). A `dd/MM/yyyy` string with year > 2500 is converted the same way (`:24-33`).
- The empty string `""` from dropdowns binds to `null` (default MVC). This matters for RenewOption/SubstituteOption (§2.3).

---

## 2. Approval process (signing workflow) — `ApprovalProcess`, `ApprovalProcessDtl`

Page title (all pages): `ข้อมูลกระบวนการลงนาม` (`DisplayName.resx` `ApprovalProcess_Index_Title`; `SSPF/Controllers/ApprovalProcessController.cs:56`).

### 2.1 List — `GET/POST /ApprovalProcess/Index` (MA14 ACCE)

| Rule | Detail | Source |
|---|---|---|
| Search fields | Only `ApprovalProcessName` (`ชื่อกระบวนการอนุมัติ`). The other fields are commented out. | `SSPF/Controllers/ApprovalProcessController.generated.cs:358-377` |
| Empty search value | Not guarded, so `LIKE '%%'`, which **excludes rows with NULL name**. | `:321-355` |
| Data source | View `VApprovalProcess` (`GetPagedVApprovalProcess`) | `SSPF/Controllers/ApprovalProcessController.cs:85-119` |

| # | Column | Title (BC key → Thai) | Format / template | Source |
|---|---|---|---|---|
| 1 | Id | (blank) | edit icon → `/ApprovalProcess/Edit?id=`, delete icon (dead) | `SSPF/Views/ApprovalProcess/Index.cshtml:43-47` |
| 2 | ApprovalProcessName | `VApprovalProcess_ApprovalProcessName` → `ชื่อกระบวนการอนุมัติ` | text | `:48-52` |
| 3 | LicenseName | `VApprovalProcess_LicenseName` → `ประเภทใบอนุญาต` | `#if (LicenseFormId > 0) {LicenseName} else {#ทุกประเภทใบอนุญาต#}#` — **bug:** the `LicenseName` branch is a code block and is never output, so specific-form rows show an empty cell | `:53-58` |
| 4 | CreateDate | `วันที่สร้างข้อมูล` | `GetThaiDate(...)` `dd/MM/yyyy HH:mm:ss` | `:59-64` |
| 5 | CreateUser | `ผู้สร้างข้อมูล` | | `:65-69` |
| 6 | UpdateDate | `วันที่แก้ไขข้อมูล` | `dd/MM/yyyy HH:mm:ss` (Thai year) | `:70-75` |
| 7 | UpdateUser | `ผู้แก้ไขข้อมูล` | | `:76-80` |

`IsActive`, `RenewOption`, `SubstituteOption` and `Note1` are returned by the JSON but **not shown** (`SSPF/Controllers/ApprovalProcessController.cs:95-111`).

### 2.2 Header form — `Create` (MA14 INST) / `Edit?id=` (MA14 UPDA)

Create and Edit share the same layout (`SSPF/Views/ApprovalProcess/Create.cshtml:24-66`, `Edit.cshtml:25-66`).

| Field | Label | Control | Required | Rule / max length | Default | Source |
|---|---|---|---|---|---|---|
| Id | — | hidden `.model-key` | — | server-generated by Oracle out param `v_ID` | 0 | `Create.cshtml:30`; `DAL.OracleClient/Master/OracleApprovalProcessDbProvider.generated.cs:420,447` |
| ApprovalProcessName | `ชื่อกระบวนการอนุมัติ*` | Kendo TextBox 500px | Yes (client + BC ZeroLength) | max 150 | empty | `Create.cshtml:33-35`; `SSPF/Models/ApprovalProcessModel.generated.cs:35`; `BC/Master/ApprovalProcess/ApprovalProcess.generated.cs:183-184` |
| LicenseFormId | `ใบอนุญาต/หนังสืออนุญาต*` | Kendo DropDownList 500px | Yes (BC ZeroLength; not client-validated because the input is hidden) | max 50 (string) | first item `0` = `เลือกทั้งหมด` | `Create.cshtml:39-41`; `ApprovalProcessModel.generated.cs:39` |
| Note1 | `หมายเหตุ` | TextArea 500px × 4 rows | No | max 512 | | `Create.cshtml:45-47`; `ApprovalProcessModel.generated.cs:41` |
| boolIsActive → IsActive | `ใช้งาน*` (checkbox, label after box) | Kendo CheckBox | (always has a value) | true → 1, false → 0 | **checked** on Create | `Create.cshtml:50-52`; `SSPF/Controllers/ApprovalProcessController.generated.cs:246-249, 303-307` |
| RenewOption | `ต่ออายุ` | Kendo DropDownList 300px | No | max 1. Values below. | `""` | `Create.cshtml:56-58`; `ApprovalProcessModel.generated.cs:57` |
| SubstituteOption | `แทนใบอนุญาต` | Kendo DropDownList 300px | No | max 1. Values below (**wrong list**). | `""` | `Create.cshtml:61-63`; `ApprovalProcessModel.generated.cs:59` |
| ProductTypeCode | (`รหัสประเภทยุทธภัณฑ์`) | **not on form** | | max 35. Round-trips as null. | | `ApprovalProcessModel.generated.cs:37` |

**Dropdown sources**

| Dropdown | Items (value → text) | Source |
|---|---|---|
| LicenseFormId | `"0"` → `เลือกทั้งหมด`, then `LicenseForm` rows with `FORM_ID IN (2,8,10,16,17)` ordered by `FORM_ID` (text = `LicenseName`) | `SSPF/Controllers/ApprovalProcessController.generated.cs:380-393` |
| RenewOption | `""` → `ใช้กับคำขอใหม่และต่ออายุ`; `N` → `N-ใช้กับคำขอใหม่เท่านั้น`; `R` → `R-ใช้กับคำขอต่ออายุเท่านั้น` | `:396-401`; `BC/Constants/RenewOptionMgr.cs:31-32, 87` |
| SubstituteOption | `""` → `ใช้กับคำขอปกติและใบแทน`, then **the same N/R list from `RenewOptionMgr`** (bug: it should use `SubstituteOptionMgr` with value `S`, which itself is mislabelled `RenewOption_RenewOnly`) | `SSPF/Controllers/ApprovalProcessController.generated.cs:404-409`; `BC/Constants/SubstituteOptionMgr.cs:29-32` |

**Save rules**
- Create POST saves and then `RedirectToAction("Edit", new { id = model.Id })`. **Bug:** `model.Id` is still 0 (the generated id is on `entity.Id`), so the user lands on `Edit?id=0`, which throws a NullReference and shows a generic error (`SSPF/Controllers/ApprovalProcessController.cs:174-190`; `.generated.cs:62-79`).
- Edit POST shows only the **first** BL message and then returns (`return View(model)` inside the loop) (`.generated.cs:118-125`). On success it goes to Index (`:128`).
- Uniqueness: only the PK. Duplicate names and multiple processes per form/option are allowed (`BL/Master/BLApprovalProcess.generated.cs:491-508`).
- Audit: CreateDate/CreateUser/UpdateDate/UpdateUser are set server-side from `GetServerDate()` and `User.Identity.Name` (`SSPF/Controllers/ApprovalProcessController.generated.cs:253-264`).

**Delete header** — `POST /ApprovalProcess/Delete` (MA14 DELE). Keys use the `"id;..."` format. JSON `{Result:"Success"|"Unsuccess"}`. **No check** that the process is in use. **No cascade** to `ApprovalProcessDtl` rows (`ValidateDelete` is empty) (`SSPF/Controllers/ApprovalProcessController.generated.cs:143-164`; `BL/Master/BLApprovalProcess.generated.cs:77-79,132-139`). It is unreachable from the UI (§0.3).

**Copy** — BL `SaveCopy` plus `ApprovalProcessCopyFactory` create a copy named `<name> (คัดลอก)` with IsActive = 0 and the steps copied. **SSPF has no UI for it** (`BL/Master/ApprovalProcessCopyFactory.cs:9-35`; `BL/Master/BLApprovalProcess.cs:271-315`).

### 2.3 How a process is chosen for a request (explains RenewOption / SubstituteOption / IsActive)

`RequestController.GetSignatureProcessList` builds the process dropdown that staff use when they pick "signature process" on a request (`SSPF/Controllers/RequestController.cs:315-345`):

| Request situation | WHERE used | Notes |
|---|---|---|
| Default (all request types, and PlantEst without flags) | `((RENEW_OPTION IS NULL) OR (RENEW_OPTION = 'N')) AND (SUBSTITUTE_OPTION IS NULL)` | `:318` |
| RequestPlantEst with `ForRenew = 1` | `((RENEW_OPTION IS NULL) OR (RENEW_OPTION = 'R'))` (no substitute filter) | `:327-328` |
| RequestPlantEst with `ForSubstitute = 1` | `(SUBSTITUTE = 'S' )` — **invalid column name** (should be `SUBSTITUTE_OPTION`), so this throws at runtime; and `S` cannot be chosen in the UI anyway | `:329-330` |

- **`IsActive` is not applied** and **`LicenseFormId` is not applied**. Inactive processes, and processes for other license forms, still appear in the request dropdown (`:338`).
- When a process is chosen, its steps are copied into `T_T_REQUEST_APPROVAL` **ordered by `AUTHORIZE_LEVEL, ITEM_NO`**, not by the on-screen order. Signer ID card, email and signature image are copied from AuthorizePerson. `ApprovalSeq` is always `1` (the counter is never incremented). A process with no steps raises `ไม่พบรายละเอียดกระบวนการลงนามที่ระบุ` (`BL/Transaction/BLRequest.cs:806-849`).
- A step with level `20` is the one that actually signs (token, or server certificate depending on the signer's `SignOption`). Levels 1-19 only review (`SSPF/Controllers/RequestApprovalController.cs:349-429`).

### 2.4 Steps grid (on `ApprovalProcess/Edit` only)

| Rule | Detail | Source |
|---|---|---|
| Data | `ApprovalProcessDtl/_ApprovalProcessDtl?whereClause=APPROVAL_PROCESS_ID = {id}`, ordered by **ITEM_NO** (MA14 ACCE). On Create the where is `(0=1)`. | `SSPF/Views/ApprovalProcess/Edit.cshtml:68-73`; `SSPF/Controllers/ApprovalProcessDtlController.cs:185-221`; `SSPF/Controllers/ApprovalProcessController.generated.cs:59,67` |
| Columns | (1) `AuthorizeLevelDesc` titled `ระดับการลงนาม`, 300px; (2) `PersonFullName` titled `ชื่อ`, 500px; (3) `PersonPosition` titled `ตำแหน่ง`, 500px | `Edit.cshtml:76-90`; `BC/Resources/DisplayName.resx` |
| AuthorizeLevelDesc | 0 → empty; 20 → `ผู้ตรวจสอบและลงนาม`; n → `ผู้ตรวจสอบ n` | `BC/Master/ApprovalProcessDtl/ApprovalProcessDtl.cs:47-58` |
| PersonFullName | `{prefix}{name} {surname}` (no space after prefix) | `BC/Master/ApprovalProcessDtl/ApprovalProcessDtl.cs:36-44` |
| Paging | pageable (default 10) — steps beyond 10 move to page 2 | `Edit.cshtml:93` |
| Selection | single row; required by Delete / Move | `Edit.cshtml:94` |
| Step edit | **No way to edit an existing step** (no edit icon or double-click). The user must delete and re-add. | `Edit.cshtml:68-114` |

**Step buttons** (right of the grid): `เพิ่ม` (blue), `ลบ` (red), `เลื่อนขึ้น` (green), `เลื่อนลง` (green) (`Edit.cshtml:100-112`).

| Button | Precondition and message | Server call | After | Source |
|---|---|---|---|---|
| เพิ่ม | Requires `Id > 0`, else swal `คำเตือน` / `กรุณาบันทึกคำขอก่อนเพิ่มรายการ` (wording says "request", not "process") | opens modal Kendo Window `EntryWindow` (450×350, title `เพิ่มผู้ลงนามในขั้นตอนการลงนาม`) loading `_ApprovalProcessDtlEntry?approvalProcessId=&itemNo=0` | on save: close the window and reload the grid | `Edit.cshtml:119, 134-148, 122-132` |
| ลบ | Requires a selected row, else swal `เลือกรายการที่ต้องการลบ` / `ลขข้อมูล` (typo). **No confirm dialog.** | `POST _DeleteDetail(approvalProcessId,itemNo)` (MA14 UPDA) | reload the grid | `Edit.cshtml:152-187`; `ApprovalProcessDtlController.cs:44-56` |
| เลื่อนขึ้น | Requires a selected row, else `เลือกรายการที่ต้องการเลื่อนขึ้น` / `เลื่อนข้อมูล` | `POST _MoveupDetail` (MA14 UPDA). Swaps with `ItemNo-1`; no-op when ItemNo = 1 | reload | `Edit.cshtml:189-224`; `ApprovalProcessDtlController.cs:58-70`; `BL/Master/BLApprovalProcessDtl.cs:125-165` |
| เลื่อนลง | Requires a selected row, else `เลือกรายการที่ต้องการเลื่อนลง` / `เลื่อนข้อมูล` | `POST _MovedownDetail` (MA14 UPDA). Swaps with `ItemNo+1` | reload | `Edit.cshtml:226-261`; `ApprovalProcessDtlController.cs:72-84`; `BLApprovalProcessDtl.cs:82-123` |

- The AJAX error swal texts are English: `"delete not success, Error : ..."`. The move-down handler also says `"moveup not success"` (copy-paste) (`Edit.cshtml:177-179, 251-253`).
- **Delete does not renumber.** The controller calls `bl.Delete(entity)` and not `DeleteDetail` (the renumbering variant). This leaves ItemNo gaps. Move up/down look for exactly `ItemNo ± 1`, so after a middle delete they silently do nothing (the server still returns `success`) (`ApprovalProcessDtlController.cs:51`; `BLApprovalProcessDtl.cs:88,131,167-196`).
- Move and Delete write only a `Trace` audit line (`APPROVAL_DTL {op} process= item= user=`) (`ApprovalProcessDtlController.cs:174-178`).

### 2.5 Add-step popup — `_ApprovalProcessDtlEntry.cshtml`

| Field | Label | Control | Required | Rule | Source |
|---|---|---|---|---|---|
| ApprovalProcessId, ItemNo, AuthorizePersonId, PersonNamePrefix, PersonName, PersonSurname | — | hidden (a stray `;` after AuthorizePersonId renders as text) | — | filled by the signer search | `SSPF/Views/ApprovalProcessDtl/_ApprovalProcessDtlEntry.cshtml:7-12` |
| PersonFullName | `ชื่อ*` (label of PersonName) | Kendo TextBox 300px, **editable but not saved** (display only) | via BC: prefix/name/surname ZeroLength; max 50/100/100 | | `:15-17`; `SSPF/Models/ApprovalProcessDtlModel.generated.cs:39-44`; `BC/Master/ApprovalProcessDtl/ApprovalProcessDtl.generated.cs:316-417` |
| (button) | `ค้นหา` | opens signer search popup | — | §2.6 | `:21, 63-65` |
| PersonPosition | `ตำแหน่ง*` | TextArea 3 rows 300px, editable; prefilled from the signer | star shown but **not required** in BC | max 256 | `:25-27`; `ApprovalProcessDtlModel.generated.cs:45`; BC `:466-467` |
| AuthorizeLevel | `ระดับการลงนาม` | Kendo DropDownList 300px | BC ZeroLength | values 1..19 = `ผู้ตรวจสอบ 1`…`ผู้ตรวจสอบ 19`, 20 = `ผู้ตรวจสอบและลงนาม`. New-row default 0 → DDL shows the first item (level 1). | `:31-33`; `BC/Constants/AuthorizeLevelMgr.cs:31-50` |
| (submit) | `บันทึกข้อมูล` | Ajax form POST, replaces `#entryWindow` | | | `:5, 37` |
| SignBySystem | — | not shown; always saved as 0 (`เนื่องจากเลิกใช้งาน`) | | | `ApprovalProcessDtlController.cs:288` |

**Rules**
- ItemNo for a new row = `max(ItemNo)+1`, recomputed inside the save transaction (`ApprovalProcessDtlController.cs:111-117`; `BL/Master/BLApprovalProcessDtl.cs:55-62`).
- POST clears ModelState. If the process id is missing or invalid it adds `ไม่พบสายอนุมัติ` under key `ApprovalProcessId`. The partial has no ValidationSummary and no message slot for that key, so **the error is invisible**. The same applies to BC errors on keys other than PersonName/PersonPosition/AuthorizeLevel (`ApprovalProcessDtlController.cs:129-170`; `_ApprovalProcessDtlEntry.cshtml:15-33`).
- BL save failures add the raw `ex.Message` (`BL/Master/BLApprovalProcessDtl.cs:73-77`).
- Race: if another user adds a row between GET and POST, the posted `ItemNo` matches that new row and **overwrites it** (an existing row is treated as an update) (`ApprovalProcessDtlController.cs:134-144`).
- **Not validated:** duplicate signer in the same process; the number of level-20 steps (0 or more than 1 allowed); level ordering versus ItemNo; whether the signer is active.

### 2.6 Signer search popup — `AuthorizePerson/SearchAuthorizePerson`

| Rule | Detail | Source |
|---|---|---|
| Window | shared `#PopupWindow` 700×350, title `ค้นหาผู้ลงนาม` | `_ApprovalProcessDtlEntry.cshtml:64`; `SSPF/Scripts/cdss.window.js:13-58` |
| Auth | GET/POST have **no CustomAuthorize**: any logged-in user | `SSPF/Controllers/AuthorizePersonController.cs:46-74` |
| Filter box | TextBox `SearchAuthorizePerson` (300px). Search icon (title `ค้นหา`) or Enter reloads the grid. | `SSPF/Views/AuthorizePerson/_SearchAuthorizePerson.cshtml:12-13, 49-59` |
| **Bug** | The entry partial redefines `additionalAuthorizePersonParams()` to return only `{forApproval:true}`, overriding the global version that sends `authorizePersonName`, so **the typed name is ignored** | `_ApprovalProcessDtlEntry.cshtml:59-61`; `SSPF/Scripts/cdss.js:834-838` |
| WHERE | `forApproval` → `PERSON_TYPE = 'E'`; the name matches prefix OR name OR surname (contains). **IsActive is not filtered**, so inactive signers can be picked. | `BC/Master/AuthorizePerson/AuthorizePersonSearchFilter.cs:14-22` |
| Sort / page | ORDER BY `PERSON_NAME`; pageSize clamped ≤ 50; virtual scroll height 200 | `AuthorizePersonController.cs:61-65`; `BC/Constants/PagingLimit.cs:12`; `_SearchAuthorizePerson.cshtml:41` |
| Columns | name `#: prefix # #: name # #: surname #` (title `ชื่อบุคคล`); position (`ตำแหน่ง`); hidden prefix/name/surname/fullname | `_SearchAuthorizePerson.cshtml:24-37` |
| Returned fields | Id, prefix, name, surname, position, full name only (no ID card or email) | `SSPF/Models/AuthorizePersonLookupModel.cs:19-34` |
| Select | selecting a row fills the hidden fields, position and full name, then closes the popup | `_ApprovalProcessDtlEntry.cshtml:45-57` |

---

## 3. Authorized signers — `AuthorizePerson`

Page title: `ข้อมูลผู้ตรวจสอบลงนาม` (`AuthorizePerson_Index_Title`).

### 3.1 List — `/AuthorizePerson/Index` (MA14 ACCE)

**Search list** (`SSPF/Controllers/AuthorizePersonController.cs:354-374`): `Id` (`รหัส`), `PersonIdCardNo` (`เลขบัตรประชาชน`), `PersonNamePrefix` (`คำนำหน้าชื่อ`), `PersonName` (`ชื่อบุคคล`), `PersonSurname` (`นามสกุล`), `PersonPosition` (`ตำแหน่ง`), `PersonEmail` (`E-Mail`), `IsActive` (`ใช้งานอยู่หรือไม่`).

**Search rules** (`:298-348`):
- An empty value means no filter.
- `IsActive` accepts **only** the exact text `ใช้` (= 1) or `ไม่ใช้` (= 0); any other text matches nothing (`= 999`) (`:320-333`).
- `Id` is numeric `=`; the rest use LIKE contains.

| # | Column | Title | Template | Source |
|---|---|---|---|---|
| 1 | Id | (blank) | edit icon (`editGrid`, shows spinner) → `Edit?id=`, delete icon (dead) | `SSPF/Views/AuthorizePerson/Index.cshtml:43-47` |
| 2 | Id | `รหัส` (60px) | | `:48-52` |
| 3 | PersonIdCardNo | `เลขบัตรประชาชน` | | `:53-57` |
| 4 | Name | `ชื่อผู้ตรวจสอบลงนาม` | `#: prefix # #: name # #: surname #` (HTML-encoded) | `:58-63` |
| 5 | PersonPosition | `ตำแหน่ง` | | `:74-78` |
| 6 | PersonEmail | `E-Mail` | | `:79-83` |
| 7 | IsActive | `ใช้งานอยู่หรือไม่` | `1` → `ใช้`, `0` → `ไม่ใช้` | `:89-95` |

Audit columns are commented out (`:96-115`).

### 3.2 Form — `Create` (MA14 INST) / `Edit?id=` (MA14 UPDA)

| Field | Label | Control | Required | Rule / max | Default | Source |
|---|---|---|---|---|---|---|
| Id | `รหัส*` | disabled TextBox showing `--NEW--` (Create) plus hidden Id | auto (identity) | | | `SSPF/Views/AuthorizePerson/Create.cshtml:31-33` |
| PersonIdCardNo | `เลขบัตรประชาชน` | TextBox 210px | No | max 17. **No format or checksum validation.** | | `:36-38`; `SSPF/Models/AuthorizePersonModel.generated.cs:35`; `BC/.../AuthorizePerson.generated.cs:190-191` |
| PersonEmail | `E-Mail` | TextBox 270px | No | max 150. **No email-format validation.** | | `:41-43`; model `:45` |
| PersonNamePrefix | `คำนำหน้าชื่อ*` | Kendo DropDownList 160px, `Filter("contains")` | Yes (BC ZeroLength) | max 50 | `""` = `--กรุณาเลือก--` | `:47-53`; model `:37` |
| PersonName | `ชื่อบุคคล*` | TextBox 200px | Yes | max 100; no `<` or `>` | | `:57-59`; model `:39` |
| PersonSurname | `นามสกุล*` | TextBox 200px | Yes | max 100; no `<` or `>` | | `:62-64`; model `:41` |
| PersonPosition | `ตำแหน่ง` | TextArea 300×120 | No | max 256 | | `:68-70`; model `:43` |
| (icons) | save icon (title `บันทึก`) / search icon (title `ค้นหา`) | next to Position | | §3.4 | | `:74-76` |
| Active → IsActive | `ใช้งานอยู่หรือไม่*` + checkbox text `ใช้งานอยู่` | MVC CheckBox (id forced to `IsActive`) | | the checkbox posts `Active`, and the controller copies it to `IsActive` | **unchecked** on Create; on Edit JS checks it when `Model.IsActive == 1` | `:79-81`; `SSPF/Controllers/AuthorizePersonController.cs:168,263`; `Edit.cshtml:95-102` |
| Note1 | `หมายเหตุ` | TextArea 600×120 | No | max 512 | | `:85-87`; model `:47` |

- **Markup guard:** prefix, name or surname containing `<` or `>` gives `ข้อความมีอักขระที่ไม่อนุญาต (< >)` under PersonName (`AuthorizePersonController.cs:197-205`; `BC/Constants/PlainTextGuard.cs:11`).
- **Name prefix source:** all rows of `NamePrefix` ordered `NAME_PREFIX ASC`, value = text = prefix. There is **no PREFIX_TYPE filter**, unlike `/NamePrefix/_GetNamePrefix`, which restricts to `PREFIX_TYPE = 1` (`AuthorizePersonController.cs:375-388`; `SSPF/Controllers/NamePrefixController.cs:46-59`).
- **Uniqueness:** none (PK only). The same person or ID card can be entered twice (`BL/Master/BLAuthorizePerson.generated.cs:491-509`).
- **Close:** the `ปิด` handler is overridden to go to `AuthorizePerson/Index` with a confirm (`Create.cshtml:171-173`).
- Edit POST shows only the first BL message (`AuthorizePersonController.cs:275-282`).

### 3.3 Hidden or required-but-unsettable fields (BC `AuthorizePerson`)

| Field | BC rule | In SSPF form? | Effect | Source |
|---|---|---|---|---|
| PersonType | **required** (ZeroLength), max 1. Label `ใช่หรือไม่` (sic). | No | **Create from SSPF fails BC validation** (null). Even if saved, only `PERSON_TYPE='E'` signers appear in the workflow signer search. | `BC/Master/AuthorizePerson/AuthorizePerson.generated.cs:846-847`; `AuthorizePersonSearchFilter.cs:16` |
| AuthorizeLevel | required byte (default 0) | No | per-signer level; not used by the steps (each step has its own level) | `:896-897` |
| SignOption | required byte (default 0) | No | **0 = sign with USB token, 1 = server-side certificate file** | `:996-997`; `SSPF/Controllers/RequestApprovalController.cs:356,384` |
| CertFilePath / CertPin | max 120 / 50 | No | server certificate for SignOption 1 | `:1046-1097` |
| PersonSignature | byte[] (signature image) | No | copied to request approvals | `BL/Transaction/BLRequest.cs:833-835` |

On Edit, these are preserved because `GetEntity` does not touch them (`SSPF/Controllers/AuthorizePersonController.generated.cs:194-224`).

### 3.4 Position helper (on the signer form)

| Action | Behaviour | Source |
|---|---|---|
| Search icon | opens `#PopupWindow` 400×350 `ค้นหาตำแหน่ง` with `Position/SearchPosition`. Filter TextBox `SearchPositionName` (Enter or icon). Grid of positions (contains, ORDER BY `PERSON_POSITION`, ≤ 50/page, virtual scroll). Selecting a row copies its text into PersonPosition and closes. No permission check beyond login. | `SSPF/Views/AuthorizePerson/Create.cshtml:96-113`; `SSPF/Views/Position/_SearchPosition.cshtml:12-48`; `SSPF/Controllers/PositionController.cs:78-106` |
| Save icon | confirm `ต้องการบันทึกข้อมูลตำแหน่งไว้หรือไม่` (`ใช่`/`ไม่ใช่`), then `POST Position/_SavePosition(positionName)` | `Create.cshtml:115-165` |
| Save rules | requires **MA14 INST** (an Edit-only user cannot save a position). Blank → `กรุณาระบุตำแหน่ง`. An existing name (exact match after Trim) → success with no insert. Otherwise insert with `AuthorizePersonId = 0`. | `PositionController.cs:45-76` |
| Save messages | success `บันทึกข้อมูลเรียบร้อยแล้ว` / `บันทึกข้อมูลสำเร็จ`; failure `ไม่สามารถบันทึกข้อมูลได้ ข้อผิดพลาด: …` / `บันทึกข้อมูลไม่สำเร็จ`; unauthorized branch `ผู้ใช้นี้ไม่มีสิทธิในการบันทึกข้อมูล` / `ไม่มีสิทธบันทึก` (unreachable, §0.4); AJAX error `บันทึกข้อมูลไม่สำเร็จ ข้อผิดพลาด: …` (uses `$.parseJson`, a typo, so it always falls through to the catch) | `Create.cshtml:138-157` |

### 3.5 Delete signer

`POST /AuthorizePerson/Delete` (MA14 DELE) with keys `"id;..."` returns JSON Success/Unsuccess. There is **no check** for use in `ApprovalProcessDtl` or request approvals (`ValidateDelete` is empty) (`SSPF/Controllers/AuthorizePersonController.generated.cs:100-121`; `BL/Master/BLAuthorizePerson.generated.cs:77-79`). It is unreachable from the UI (§0.3).

### 3.6 How signers relate to users, positions and certificates

- **User → signer:** `T_S_USER.AUTHORIZE_PERSON_ID` (`User_AuthorizePersonId` = `ผู้ลงนาม`). SSPF limits the request list to requests whose approval chain contains that signer, and checks it again at sign time. **No SSPF screen edits it.** The User form does not include it (`BL/Security/RequestSignerScope.cs:8-50`; `SSPF/Controllers/RequestApprovalController.cs:139,328`; `SSPF/Models/UserModel.generated.cs:98-99`).
- **Position:** free text on the signer. `Position` is only a pick-list (its `AuthorizePersonId` is always 0 when saved from here). The step copies the position text at add time, so later signer edits do not propagate to existing steps (`SSPF/Controllers/PositionController.cs:60`; `ApprovalProcessDtlController.cs:286`).
- **Name snapshot:** steps store the prefix/name/surname/position at add time. Request approvals copy those from the step, plus ID card, email and signature from the live signer (`BL/Transaction/BLRequest.cs:821-836`).

---

## 4. Roles & permissions — `Role` (+ `ProgramCode`, `RoleDtl`)

Page title: `ข้อมูลกลุ่มผู้ใช้` (`Role_Index_Title`).

### 4.1 List — `/Role/Index` (SC02 ACCE)

**Search list** (`SSPF/Controllers/RoleController.generated.cs:242-258`): `RoleNo` (`รหัสกลุ่มผู้ใช้`), `RoleName` (`ชื่อกลุ่มผู้ใช้`), `IsBuildIn` (`เป็นข้อมูลตั้งต้น`, numeric 0/1), `Note1` (`หมายเหตุ`), `CreateDate` / `UpdateDate` (format `yyyy/MM/dd HH24:MI`), `CreateUser` / `UpdateUser`. An empty value means no filter (`SSPF/Controllers/RoleController.cs:325-357`).

| # | Column | Title | Notes | Source |
|---|---|---|---|---|
| 1 | RoleNo | (blank) | edit → `Role/Edit?roleNo=`, delete icon (dead) | `SSPF/Views/Role/Index.cshtml:43-46` |
| 2 | RoleNo | `เลขที่กลุ่มผู้ใช้` (150px) | | `:47-51` |
| 3 | RoleName | `ชื่อกลุ่มผู้ใช้` (300px) | | `:52-56` |
| 4 | TotalUser | `จำนวนผู้ใช้ในกลุ่ม` (70px) | `{0:#}` (0 renders blank) | `:57-61` |
| 5 | CreateDate | `วันที่สร้าง` | `dd/MM/yyyy HH:mm:ss` Thai | `:62-66` |
| 6 | CreateUser | `ผู้สร้าง` | | `:67-71` |
| 7 | UpdateDate | `วันที่ปรับปรุงล่าสุด` | | `:72-76` |

`UpdateUser`, `IsBuildIn` and `Note1` are not shown. The data source is view `VRole` (`RoleController.cs:120-152`).

### 4.2 Form — `Create` (SC02 INST) / `Edit?roleNo=` (SC02 UPDA)

| Field | Label | Control | Required | Rule | Default | Source |
|---|---|---|---|---|---|---|
| RoleNo | `รหัสกลุ่มผู้ใช้*` | Create: Kendo NumericTextBox, min 0, max 99, 0 decimals, format `#`. Edit: disabled TextBox (80px) + hidden `.model-key`. | Yes | byte; **user-chosen PK**; duplicate → `DataDuplicatedException` | 0 | `SSPF/Views/Role/Create.cshtml:28-29`; `Edit.cshtml:31-32`; `BL/Security/BLRole.cs:91-94` |
| RoleName | `ชื่อกลุ่มผู้ใช้*` | Kendo TextBox 300px | Yes (client + BC ZeroLength) | max 100. **Uniqueness is not checked.** | | `Create.cshtml:33-34`; `SSPF/Models/RoleModel.generated.cs:35-36`; `BC/Security/Role/Role.generated.cs:198-199` |
| boolIsBuildIn → IsBuildIn | checkbox text `กลุ่มผู้ใช้นี้เป็นรหัสผู้ใช้ของระบบ*` | Kendo CheckBox (editable on both Create and Edit) | | 1/0. **Has no effect anywhere** (no delete or edit protection). | unchecked | `Create.cshtml:42-43`; `SSPF/Models/RoleModel.cs:36-40` |
| Note1 | (`หมายเหตุ`) | **not on form** | | max 512. On Edit it is overwritten with the posted null. | | `RoleModel.generated.cs:39-40`; `SSPF/Controllers/RoleController.cs:249` |
| Roles.{ProgramCode} | — | one hidden input per program code, holding a CSV of action codes | | built from the permission tree | see 4.3 | `Create.cshtml:35-38` |

### 4.3 Permission tree (the role editor)

| Rule | Detail | Source |
|---|---|---|
| Master grid `gridRole` | one row per program in `ProgramCode` (`BLProgramCode.GetAll`). Shows `ProgramName` only (ProgramCode hidden), no header text, no paging. Read from `ProgramCode/_ProgramCodeByAll` (SC02 ACCE). | `Create.cshtml:47-64`; `SSPF/Controllers/ProgramCodeController.cs:52-74` |
| Detail grid per program | `grid_{ProgramCode}`: checkbox (value = ActionCode) and `ActionName`, headers hidden. Read from `ProgramCode/_ProgramActionByProgramCode?programCode=` (view `VProgramAction`, SC02 ACCE). | `Create.cshtml:68-86`; `ProgramCodeController.cs:81-104` |
| Pre-load trick | on master dataBound, **expand then collapse all rows** so that every detail grid loads and binds its checkboxes | `Create.cshtml:94-97` |
| Checkbox state | comes only from hidden `Roles.{program}` (`IsChecked` from the server is never set). Each click rewrites that hidden CSV from the checked boxes of that program. | `Create.cshtml:99-108, 111-131` |
| **Create default** | **every action of every program is pre-checked** (from `ProgramAction.GetAll`). A new role grants everything unless the admin unticks. | `SSPF/Controllers/RoleController.cs:172-179` |
| Edit default | current `ROLE_DTL` rows of the role | `RoleController.cs:215-221` |
| Save semantics | `ROLE_DTL` is fully replaced: `DELETE WHERE ROLE_NO=` then insert one row per (program, action) in one transaction | `RoleController.cs:251-271`; `BL/Security/BLRole.cs:96-116` |
| Empty role | allowed. The BL message `ไม่มีการระบุหน้าที่กลุ่มผู้ใช้งาน` (topic `หน้าที่กลุ่มผู้ใช้งาน`) only fires when the list is null, which never happens. | `BL/Security/BLRole.cs:129-133` |
| No select-all | no per-program or global "select all", no action-column matrix | `Create.cshtml:47-86` |

### 4.4 Delete role

`POST /Role/Delete` (SC02 DELE, anti-forgery). It deletes the `ROLE` and `ROLE_DTL` rows. **It does not delete `T_S_USER_ROLE` rows**, and does not check for users or `IsBuildIn`. On failure it returns `{Result:"Unsuccess", ErrorMessage}` (`SSPF/Controllers/RoleController.generated.cs:150-171`; `BL/Security/BLRole.cs:42-68`; `BL/Security/BLRole.generated.cs:69-71`). It is unreachable from the UI (§0.3).

### 4.5 Orphan role/program endpoints

- `ProgramCodeController.generated.cs` and `RoleDtlController.generated.cs` expose Index/Create/Edit/Delete/Export guarded by SC02. **There are no views** (`SSPF/Views/ProgramCode`, `SSPF/Views/RoleDtl` do not exist), so program codes and actions are effectively DB-maintained (`SSPF/Controllers/ProgramCodeController.generated.cs:53-335`; `SSPF/Controllers/RoleDtlController.generated.cs:53-339`).

---

## 5. Users — `User`

Page title: `ข้อมูลผู้ใช้งานระบบ` (neutral resx). The th-TH resx has `User Profile (ผู้ใช้งานระบบ)`, an inconsistency.

### 5.1 List — `/User/Index` (SC01 ACCE)

**Search list:** `UserId` (`ผู้ใช้งาน`) and `UserName` (`ชื่อ-นามสกุล`) only. The server also supports UserLogon/Note1/flags but they are not offered. Searching by Password is deliberately impossible (`SSPF/Controllers/UserController.cs:384-438`).

| # | Column | Title | Template | Source |
|---|---|---|---|---|
| 1 | UserId | (blank) | edit → `User/Edit?userId=` (URL-encoded), delete icon (dead) | `SSPF/Views/User/Index.cshtml:39-42` |
| 2 | UserId | `ผู้ใช้งาน` | | `:43-47` |
| 3 | UserLogon | `ชื่อผู้ใช้งาน` | | `:48-52` |
| 4 | UserName | `ชื่อ-นามสกุล` | | `:53-57` |
| 5 | DisableAccount | `ปิดการใช้งาน` | disabled checkbox, checked when 1 | `:58-63` |
| 6 | LockAccount | `ระงับการใช้งาน` | disabled checkbox | `:64-69` |
| 7 | RetryCount | `จำนวนครั้งที่ป้อนรหัสผ่านผิด` | centered | `:70-74` |

The password is never sent to the grid or the export (`SSPF/Controllers/UserController.generated.cs:105,280`).

### 5.2 Form — `Create` (SC01 INST) / `Edit?userId=` (SC01 UPDA)

| Field | Label | Control | Required | Rule / max | Default | Source |
|---|---|---|---|---|---|---|
| UserId | `ผู้ใช้งาน*` | TextBox (Edit: disabled + hidden) | Yes | Create only: regex `^[A-Za-z0-9._@-]{1,20}$`, else `รหัสผู้ใช้ใช้ได้เฉพาะ A-Z a-z 0-9 . _ @ - และยาวไม่เกิน 20 ตัวอักษร`. PK; duplicate → DataDuplicatedException. | | `SSPF/Views/User/Create.cshtml:24-26`; `Edit.cshtml:23-24`; `SSPF/Controllers/UserController.cs:257-265`; `BC/Constants/UserIdFormat.cs:14-21` |
| UserLogon | `ชื่อผู้ใช้งาน*` | TextBox | Yes | max 20. **Uniqueness is not checked in the app**, although login looks users up by logon. | | `Create.cshtml:29-31`; `SSPF/Models/UserModel.generated.cs:35`; `BL/Security/BLUser.cs:44` |
| IsBuildIn | `เป็นข้อมูลตั้งต้น*` | Create: hidden (commented out). Edit: disabled checkbox + hidden. | | **The server ignores the posted value**: Create = 0, Edit = DB value | 0 | `Create.cshtml:33-37`; `Edit.cshtml:32-37`; `UserController.cs:301-305` |
| UserName | `ชื่อ-นามสกุล*` | TextBox 500px | Yes | max 100 | | `Create.cshtml:40-42`; model `:37` |
| Password | `รหัสผ่าน*` | Password input | Create: yes (client). Edit: optional, placeholder `เว้นว่าง = ใช้รหัสเดิม`, `data-val=false` | policy below; model max 200 | blank (never echoed) | `Create.cshtml:46-48`; `Edit.cshtml:47`; `UserController.cs:355` |
| ConfirmPassword | `ยืนยันรหัสผ่าน*` | Password input | | must equal Password: client `[Compare]` and server, both `ยืนยันรหัสผ่านไม่ตรงกัน` | | `Create.cshtml:51-53`; `SSPF/Models/UserModel.cs:37`; `UserController.cs:286-289` |
| boolChangePasswordFirstLogon | `เปลี่ยนรหัสผ่านเมื่อเข้าระบบครั้งแรก*` | Kendo CheckBox | | 1/0 | unchecked | `Create.cshtml:57-58` |
| ExpiryDay (helper, not saved) | `จำนวนวันหมดอายุ` | Kendo NumericTextBox 70px, 0..1000, format `#` | | on change: > 0 sets PasswordExpiryDate = today + N days (display year + `_yearOffset`); 0 clears it | empty | `Create.cshtml:62-63, 121-131` |
| PasswordExpiryDate | `วันที่รหัสผ่านหมดอายุ` | Kendo DatePicker (max 31/12/3000) | No | expired → forced change on next action | null | `Create.cshtml:66-68`; `SSPF/Attributes/CustomAuthorizeAttribute.cs:237-253` |
| boolDisableAccount | `ปิดการใช้งาน` | Kendo CheckBox | | 1/0 | unchecked | `Create.cshtml:72-73` |
| Roles | — | grid `gridUserRole` (500px): checkbox (value RoleNo) + RoleName from `Role/_RoleAll` (needs SC02 ACCE). The hidden `Roles` CSV is updated on click. | at least 1 (server) | see 5.3 | Create: **pre-ticks every role that any user currently holds** (bug: it uses `BLUserRole.GetAll()`) | `Create.cshtml:77-96, 112, 133-157`; `UserController.cs:68-71` |
| RetryCount | `จำนวนครั้งที่ป้อนรหัสผ่านผิด` | disabled TextBox 80px | | display only | | `Create.cshtml:99-100` |
| boolLockAccount | `ระงับการใช้งาน*` | Kendo CheckBox | | unlocking resets RetryCount to 0 | unchecked | `Create.cshtml:103-104`; `UserController.cs:296-300` |
| Note1 | `หมายเหตุ` | TextArea 500px | No | max 512 | | `Create.cshtml:109-111` |
| PasswordEffectiveDate, LastLogonDate, AuthorizePersonId | — | **not on form** | | | | `SSPF/Models/UserModel.generated.cs:41-99` |

### 5.3 Server rules on save

| Rule | Message (verbatim) | Source |
|---|---|---|
| Role CSV empty, non-numeric, or a role not in `ROLE` (and not already held) | `ไม่มีสิทธิ์กำหนดบทบาทนี้` (also used for "no role selected") | `BC/Security/UserRoleAssignmentPolicy.cs:56, 142-176`; `SSPF/Controllers/UserController.cs:221-235` |
| Editing **your own** user: the role change is silently ignored (persisted roles kept) | — | `UserRoleAssignmentPolicy.cs:149-152` |
| No roles at BL level | topic `กลุ่มผู้ใช้งาน`: `ไม่มีการระบุหน้าที่ผู้ใช้งาน` | `BL/Security/BLUser.cs:913-916` |
| Password policy (Create, or Edit when filled). Min = max(8, appSetting `PasswordMinLength`), max 128. Messages are joined with a space. | `รหัสผ่านต้องยาวอย่างน้อย {n} ตัวอักษร`; `รหัสผ่านต้องยาวไม่เกิน 128 ตัวอักษร`; `รหัสผ่านต้องไม่เป็นตัวอักษรเดียวกันทั้งหมด`; `รหัสผ่านนี้เป็นรหัสที่ใช้กันทั่วไปและเดาได้ง่าย กรุณาตั้งรหัสอื่น` (≈100-word blacklist); `รหัสผ่านต้องไม่มีชื่อผู้ใช้อยู่ในรหัส` (logon or id of length ≥ 3) | `BC/Security/PasswordPolicy.cs:18-19, 74-121`; `BL/Security/BLUser.cs:186-191` |
| Create with blank password | client-required; server: BC `Password` ZeroLength fails (stored hash required) | `BC/Security/User/User.generated.cs:309-310` |
| Session revocation after Edit | when the user becomes locked, becomes disabled, or the password is changed, all their SSPF sessions are revoked immediately | `SSPF/Controllers/UserController.cs:189-193, 211-214` |
| Roles save | `USER_ROLE` is fully replaced (delete + insert) in one transaction | `BL/Security/BLUser.cs:693-705` |
| Edit error display | the **first** BL message only | `UserController.cs:180-187` |

### 5.4 Delete user

`POST /User/Delete` (SC01 DELE, anti-forgery). Every key is loaded first. If any is missing, **built-in** (`IsBuildIn ≠ 0`), or **the actor's own account**, the response is `Unsuccess` and nothing is deleted. Otherwise each user and their `USER_ROLE` rows are deleted. The audit-logged delete overload is **not** used here (`SSPF/Controllers/UserController.generated.cs:220-258`; `BL/Security/UserDeletePolicy.cs:41-58`; `BL/Security/BLUser.cs:809-815`). It is unreachable from the UI (§0.3).

### 5.5 MFA reset

`POST /User/ResetMfa(userId)` (SC01 UPDA) deletes the user's MFA enrolment and redirects back to Edit. **No button calls it** (`SSPF/Controllers/UserController.cs:444-452`).

---

## 6. Lookups and shared partials

| Item | Relevance to admin screens | Source |
|---|---|---|
| NamePrefix | AuthorizePerson prefix dropdown (server list, all types). `_GetNamePrefix` (PREFIX_TYPE = 1, no auth) is not used here. NamePrefix CRUD views exist (MA10) but are outside this area. | `SSPF/Controllers/AuthorizePersonController.cs:375-388`; `SSPF/Controllers/NamePrefixController.cs:46-59` |
| Position | search popup and quick-save from the signer form (§3.4). Position CRUD actions (MA17) exist, but only `_SearchPosition.cshtml` exists as a view. | `SSPF/Controllers/PositionController*.cs`; `SSPF/Views/Position/` |
| Department / ControlOfficer / `_DepartmentControlPanel` | **Not used by any admin screen.** They are trader-department landing pages (buttons such as `ตรวจสอบประวัติ`, `เพิ่มผู้ประกอบการ`, and `ยังไม่ได้ระบุผู้ประกอบการ กรุณาเลือกผู้ประกอบการที่ต้องการ`). | `SSPF/Views/Shared/_DepartmentControlPanel.cshtml:1-171`; `SSPF/Controllers/DepartmentController.cs`; `SSPF/Controllers/ControlOfficerController.cs` |
| `EditorTemplates/*` | **Not used.** Admin views call Kendo helpers directly, never `EditorFor`. The templates are numeric, currency, product and unit editors for other modules. | `SSPF/Views/Shared/EditorTemplates/*.cshtml` |

---

## 7. Dead or orphaned code in this area

- `SSPF/Controllers/ApprovalProcessDtlController.generated.cs` is **not compiled**. It is absent from `SSPF/UI.Web.csproj:271-273`, uses namespace `CDSS.DID.SPF.UI.Web` (`:44`), references the undefined `PROGRAM_CODE.APPROVAL_PROCESS_DTL` (`:53`), and has `ItemNo` undefined (`:251`).
- `SSPF/Views/ApprovalProcessDtl/Index|Create|Edit.cshtml` are not in the csproj and use the wrong model namespace (`CDSS.DID.SPF.UI.Web.Models`). Only `_ApprovalProcessDtlEntry.cshtml` is live (`SSPF/UI.Web.csproj:3093`).
- The generic `ApprovalProcessDtl` search list (`.generated.cs:420-440`) is unreachable.
- `SSPF/Scripts/sweetalert.min.js` holds an older `onGridBound` with a working `a.delete` binding, but it is not in any bundle (`SSPF/App_Start/BundleConfig.cs:84-93`).

---

## 8. Consolidated bugs and inconsistencies (for the redesign backlog)

| # | Issue | Source |
|---|---|---|
| B1 | Admin screens are missing from the menu | `SSPF/Menu.th-TH.sitemap:3-9` |
| B2 | No Save button on any admin header form | `SSPF/Views/Shared/_DataControlPanel.cshtml:62-63` |
| B3 | Grid delete icons are not wired | `SSPF/Scripts/cdss.js:127-150` |
| B4 | The unauthorized message is always replaced by a bare 401 | `SSPF/Attributes/CustomAuthorizeAttribute.cs:78-92` |
| B5 | No permission-based hide/disable anywhere | §1.2 |
| B6 | Server never checks `ModelState.IsValid`, so DataAnnotations are client-only | e.g. `SSPF/Controllers/RoleController.generated.cs:56-93` |
| B7 | ApprovalProcess Create redirects to `Edit?id=0` | `SSPF/Controllers/ApprovalProcessController.cs:190` |
| B8 | The ApprovalProcess list's license column is blank for specific forms | `SSPF/Views/ApprovalProcess/Index.cshtml:54` |
| B9 | The SubstituteOption dropdown uses the RenewOption list; `SubstituteOptionMgr` is mislabelled | `SSPF/Controllers/ApprovalProcessController.generated.cs:404-409`; `BC/Constants/SubstituteOptionMgr.cs:31` |
| B10 | Request-side process selection ignores IsActive and LicenseFormId; the substitute branch uses a non-existent column `SUBSTITUTE` | `SSPF/Controllers/RequestController.cs:318-338` |
| B11 | Step delete does not renumber, so move up/down break silently | `SSPF/Controllers/ApprovalProcessDtlController.cs:51`; `BL/Master/BLApprovalProcessDtl.cs:88,131` |
| B12 | Step delete has no confirmation; error typo `ลขข้อมูล`; move-down error says "moveup" | `SSPF/Views/ApprovalProcess/Edit.cshtml:185, 251` |
| B13 | Runtime step order = `AUTHORIZE_LEVEL, ITEM_NO`, not the on-screen ITEM_NO order; `ApprovalSeq` is always 1 | `BL/Transaction/BLRequest.cs:806,814,824` |
| B14 | The signer search ignores the typed name inside the step popup | `SSPF/Views/ApprovalProcessDtl/_ApprovalProcessDtlEntry.cshtml:59-61` |
| B15 | The signer search shows inactive signers; only `PERSON_TYPE='E'` signers are listed, and SSPF cannot set PersonType | `BC/Master/AuthorizePerson/AuthorizePersonSearchFilter.cs:16` |
| B16 | AuthorizePerson Create cannot pass BC validation (PersonType required and not on the form) | `BC/Master/AuthorizePerson/AuthorizePerson.generated.cs:846-847` |
| B17 | Step-popup errors under keys without a message slot (e.g. `ไม่พบสายอนุมัติ`) are invisible | `SSPF/Controllers/ApprovalProcessDtlController.cs:149` |
| B18 | Step popup: a concurrent add can overwrite another user's row | `SSPF/Controllers/ApprovalProcessDtlController.cs:134-144` |
| B19 | No validation of duplicate signer per process, or of 0 or more than 1 level-20 signer | §2.5 |
| B20 | Header/signer delete has no referential checks; role delete leaves `USER_ROLE` orphans | `BL/Master/BLApprovalProcess.generated.cs:77-79`; `BL/Security/BLRole.cs:42-68` |
| B21 | A new role defaults to **all permissions** checked | `SSPF/Controllers/RoleController.cs:172-179` |
| B22 | A new user pre-ticks every role held by any user | `SSPF/Controllers/UserController.cs:68-71` |
| B23 | Role `IsBuildIn` is editable and has no effect; user `IsBuildIn` is read-only and protects against delete | `SSPF/Views/Role/Create.cshtml:42`; `BL/Security/UserDeletePolicy.cs:49` |
| B24 | Role Edit overwrites `Note1` with null (field not on form) | `SSPF/Controllers/RoleController.cs:249` |
| B25 | No uniqueness on RoleName, UserLogon, process name, signer ID card | §2.2, §3.2, §4.2, §5.2 |
| B26 | No ID-card or email format validation for signers | `SSPF/Models/AuthorizePersonModel.generated.cs:35,45` |
| B27 | `_SavePosition` needs MA14 **INST**, so it fails for edit-only users; JS typo `$.parseJson` | `SSPF/Controllers/PositionController.cs:45`; `SSPF/Views/AuthorizePerson/Create.cshtml:152` |
| B28 | Signer name-prefix list is not filtered by PREFIX_TYPE | `SSPF/Controllers/AuthorizePersonController.cs:380` |
| B29 | Signer certificate, SignOption, PersonType and the user↔signer link have no admin UI | §3.3, §3.6 |
| B30 | `ResetMfa` and `ExportToExcel` have no buttons | `SSPF/Controllers/UserController.cs:444`; §1.3 |
| B31 | Audit date format differs between screens | §1.4 |
| B32 | `'` is doubled on every bound string | `SSPF/Binder/CustomModelBinder.cs:85-88` |
| B33 | MA14 is shared by signers and workflows; SC02 ACCE is needed to see roles on the User screen | `SSPF/Constants/ProgramCode.cs:34,58` |
| B34 | Edit POSTs show only the first BL error | e.g. `SSPF/Controllers/ApprovalProcessController.generated.cs:120-124` |
| B35 | `เพิ่ม` warning says `กรุณาบันทึกคำขอก่อนเพิ่มรายการ` ("request") on a process screen | `SSPF/Views/ApprovalProcess/Edit.cshtml:147` |
| B36 | ApprovalProcess empty search is `LIKE '%%'`, which hides NULL-named rows | `SSPF/Controllers/ApprovalProcessController.generated.cs:330-338` |
| B37 | AuthorizePerson `IsActive` search accepts only the exact words `ใช้` / `ไม่ใช้` | `SSPF/Controllers/AuthorizePersonController.cs:320-333` |
| B38 | User page title differs between resx cultures | `SSPF/App_GlobalResources/DisplayName*.resx` (`User_Index_Title`) |
