# B. Requests (คำขอ), documents and attachments — what a signer sees before signing

Legacy app: SSPF (staff/signer side, ASP.NET MVC 5 + Kendo UI + jQuery).
All paths are relative to `did-spf/SSPF/` unless prefixed with `../BC/` or `../BL/` (siblings of `SSPF`).
Thai UI strings are quoted verbatim. "Bug" marks behaviour that is wrong or inconsistent in the legacy code; the redesign should decide whether to keep it.

---

## 0. Orientation (read first)

| # | Fact | Source |
|---|------|--------|
| 0.1 | The live menu is the Kendo menu bound to sitemap `Menu-th-TH` / `Menu-en-US`. It contains only: `คำขอใบอนุญาต/หนังสืออนุญาต สำหรับผู้บังคับบัญชา` (RequestApproval/Index), `รายงาน > รายงานสรุปการตรวจสอบและลงนาม`, `เปลี่ยนรหัสผ่าน`. | `Views/Shared/_Menu.cshtml:7,18-24`, `Global.asax.cs:70-71`, `Menu.th-TH.sitemap:4-8` |
| 0.2 | Therefore Request/Index, Request/RequestInfo, Inbox, Outbox, RequestDoc/Index are **not reachable from the menu**; they are reachable only by URL or from other screens. `Mvc.sitemap` (which lists `กล่องส่ง`/`กล่องรับ`) is a stale copy from another system and is not bound to the menu. | `Mvc.sitemap:27-30` (unused) |
| 0.3 | The signer's real entry path is: RequestApproval grid → "view request" → `Request/ViewRequest?requestId=` → redirect to the type-specific `…/Entry` page (data-entry form, read-mostly for signers) which shows the `ตรวจสอบ/ลงนาม` button. | `Views/RequestApproval/Index.cshtml:273`, `Controllers/RequestController.cs:74-97` |
| 0.4 | `Request/RequestInfo` is a newer, read-only "e-sign request detail" page (tabs: description / check results / signature check) fed by the new back-end API through the `RequestEsig` proxy. It is not linked from anywhere in SSPF and is hard-wired to form type 1 (แบบ อ.1). It is the closest existing design to a "what the signer sees before signing" screen. | `Controllers/RequestController.cs:1456-1491`, `Controllers/api/RequestEsigController.cs` |
| 0.5 | Global filters: every action requires login (`AuthorizeAttribute`), CSRF check on every POST, forced password change, signed where-clause tokens, grid page size capped at 100. | `App_Start/FilterConfig.cs:12-23` |
| 0.6 | Config: `pageSize` = 10; back-end API base `SpfBackendApiUrl`; `RequestAccess.Mode` = `Enforce`; upload body cap effectively 50 MB (IIS `maxAllowedContentLength=52428800` bytes; `maxRequestLength` is 50 GB in KB so IIS wins). | `Web.config:35,66,68,173,214` |

---

## 1. Shared domain rules

### 1.1 Request types (`REQUEST_TYPE`)

| Code | Enum name | Thai label shown in lists (`RequestTypeMgr`) | Entry controller (from `VRequest.RequestDesc`) | Source |
|---|---|---|---|---|
| 0 | RequestBgCheck | คำขอรับหนังสือตรวจสอบประวัติ กรรมการ และผู้ถือหุ้น | RequestBgChk | `../BC/Enumerates/RequestType.cs:10`, `../BC/Constants/RequestTypeMgr.cs:31`, `../BC/Resources/DisplayName.resx:2730` |
| 1 | RequestLocCheck | คำขอตรวจโรงงานผลิตอาวุธของเอกชน | RequestLocChk | `RequestTypeMgr.cs:34`, `DisplayName.resx:2733` |
| 2 | RequestPlantEst | คำขอรับใบอนุญาตประกอบกิจการโรงงานฯ (อ.1, อ.3, อ.20) | RequestPlantEst | `RequestTypeMgr.cs:32`, `DisplayName.resx:2736` |
| 3 | RequestMove | คำขออนุญาตขนย้ายวัตถุหรืออาวุธฯ (อ.9) | RequestMove | `RequestTypeMgr.cs:35`, `DisplayName.resx:2739` |
| 4 | RequestImport | คำขออนุญาตสั่งหรือนำเข้ามาฯ (อ.4) | RequestImport | `RequestTypeMgr.cs:33`, `DisplayName.resx:2742` |
| 5 | RequestSaleDom | คำขออนุญาตขายหรือจำหน่ายฯ ในราชอาณาจักร (อ.15) | RequestSaleDom | `RequestTypeMgr.cs:36`, `DisplayName.resx:2745` |
| 6 | RequestSaleInt | คำขออนุญาตขายหรือจำหน่ายฯ โดยการส่งอกไปนอกราชอาณาจักร (อ.14) — note typo "ส่งอก" (should be ส่งออก) | RequestSaleInt | `RequestTypeMgr.cs:37`, `DisplayName.resx:2748` |
| 7 | Requestledger | รายงานแสดงบัญชีรับจ่าย (อ.11) | RequestLedger | `RequestTypeMgr.cs:38`, `DisplayName.resx:2751` |
| 8, 9, 50, 51, 52, 53 | LicensePlantEst, NewLicensePlantEst, RequestOpenProd, RequestExpandProd, RequestChangePlant, RequestChangePlantPerson | **no label** (not registered in `RequestTypeMgr`) | falls to `RequestLedger` (else-branch) | `../BC/Enumerates/RequestType.cs:18-23`, `../BC/View/Transaction/VRequest/VRequest.cs:50-73` |

- `RequestDesc` maps type → controller name; anything not 0–6 becomes `RequestLedger` (`../BC/View/Transaction/VRequest/VRequest.cs:69-70`). Bug: types 8/9/50–53 would open the ledger page.
- `RequestTypeDescription` = `RequestTypeMgr[type].ToString()` — throws for unregistered types (8/9/50–53) (`VRequest.cs:75-81`). Bug risk if V_REQUEST returns such rows.
- Form codes used by Request/Index default filter: `FORM_ID IN ('1','3','20','4','9','14','15')` (อ.1, อ.3, อ.20, อ.4, อ.9, อ.14, อ.15) (`Controllers/RequestController.cs:1392`).

### 1.2 Request statuses (generic `RequestStatus`)

| Value | Thai label (`RequestStatusMgr`) | Source |
|---|---|---|
| 0 | ยื่นคำขอ | `../BC/Constants/RequestStatusMgr.cs:31`, `DisplayName.resx:4493` |
| 2 | รอแก้ไข | `RequestStatusMgr.cs:32`, `DisplayName.resx:7990` |
| 5 | ส่งข้อมูล-รอตรวจสอบ | `RequestStatusMgr.cs:33`, `DisplayName.resx:7993` |
| 10 | รับเรื่อง | `RequestStatusMgr.cs:34`, `DisplayName.resx:4496` |
| 20 | นำเรียน | `RequestStatusMgr.cs:35`, `DisplayName.resx:4499` |
| 30 | อนุมัติ | `RequestStatusMgr.cs:36`, `DisplayName.resx:4502` |
| 40 | ชำระเงิน/จ่ายหนังสืออนุญาต | `RequestStatusMgr.cs:37`, `DisplayName.resx:4505` |
| 99 | ยกเลิกคำขออนุญาต | `RequestStatusMgr.cs:38`, `DisplayName.resx:4508` |

- List display string is `"<code> - <label>"` (e.g. `30 - อนุมัติ`) (`../BC/View/Transaction/VRequest/VRequest.cs:38-48`).
- `RequestSaleDomStatus` adds `CheckBalance = 11`, `DestInform = 50`, `DestResponse = 51`, `BkkInform = 52` (`../BC/Enumerates/RequestSaleDomStatus.cs:14,18-20`); it is reused as the lock threshold on the request-documents page (§8.1).
- "Checking" (approval result) codes: `A` = อนุมัติ, `R` = ไม่อนุมัติ (`Controllers/RequestController.cs:590-598`).

### 1.3 Who may see a request (signer scoping)

| Rule | Detail | Source |
|---|---|---|
| Signer vs staff | A user whose DB record has `AuthorizePersonId > 0` is a **signer**; `0` = staff; user not found = deny. | `Security/RequestAccessPolicy.cs:289-303` |
| Single request access (`Check`) | Signer: must have a row in `T_T_REQUEST_APPROVAL` for (request, signer). Staff: must hold `RQ01 ACCE`. | `Security/RequestAccessPolicy.cs:91-108,306-309` |
| Signer-only scope (`CheckSigner`) | Signer must be on the request's approval chain; staff pass (their screen permission already checked by `CustomAuthorize`). Used by all type `Entry` pages. | `Security/RequestAccessPolicy.cs:56-71,110-133` |
| Enforce/Audit mode | Empty or misspelt mode = enforce; `Audit` lets the call through but logs. Denials logged once per hour per (user, request, action, detail). | `Security/RequestAccessPolicy.cs:74-89,311-343` |
| Lists | Signer lists are always scoped: `(<where>) AND <col> IN (SELECT REQUEST_ID FROM T_T_REQUEST_APPROVAL WHERE AUTHORIZE_PERSON_ID = <signer>)`; lookup failure → `(1=0)` (empty list). Independent of Audit mode. | `Security/RequestAccessPolicy.cs:140-156,255-263`, `../BL/Security/RequestSignerScope.cs:21-49` |
| Action filter | `RequestAccessFilter` reads `request_id`/`requestId` (request id), `id`/`selectedRecord[]`/`model.Id` (record id mapped to request by `RecordKind`). Non-numeric/negative → 403; record not found → 404; any request failing policy → 403; no id → skipped (new-record pages). | `Attributes/RequestAccessFilter.cs:56-65,109-179,188-331` |

Program codes relevant here: `RQ01` = REQUEST / REQUEST_DOC / REQUEST_APPROVAL / ATTACH_FILE, `RQ02` BgChk, `RQ03` LocChk, `RQ04` PlantEst, `RQ05` Import, `RQ06` Move, `RQ07` SaleInt, `RQ08` SaleDom, `RQ09` Ledger, `LC01` License, `LC03` LicenseInform, `MA18` Trader, `RP01` report print, `IN01` Inbox, `OU01` Outbox. Actions `ACCE/INST/UPDA/DELE/PRIN` (`Constants/ProgramCode.cs:37-118`, `Constants/ActionCode.cs:10-17`).

---

## 2. Screen: Request list — `/Request/Index` ("ข้อมูลคำขอต่างๆ")

### 2.1 Access & load

| Rule | Source |
|---|---|
| GET/POST require `RQ01 ACCE`. Grid read `_VRequest` also requires `RQ01 ACCE`. | `Controllers/RequestController.cs:476,500,1267` |
| Title `ViewBag.Title` = `Request_Index_Title` = "ข้อมูลคำขอต่างๆ"; header text also "ข้อมูลคำขอต่างๆ". | `Views/Request/Index.cshtml:20`, `Controllers/RequestController.cs:491,516`, `App_GlobalResources/DisplayName.resx:861` |
| Signers only see requests on which they are in the approval chain (column `ID`). | `Controllers/RequestController.cs:1272-1273` |
| Not in the menu (see 0.1). | — |

### 2.2 Search panel (shared `_BrowseControlPanel`, mode `IndustrialFactory`, `RequestType` not set → -1, `EnableButtonRequest=false`)

| Control | Label | Values / behaviour | Source |
|---|---|---|---|
| Heading | green "ข้อมูลคำขอต่างๆ" (no trader name because `EnableButtonRequest=false`) | — | `Views/Shared/_BrowseControlPanel.cshtml:30-43`, `Controllers/RequestController.cs:490` |
| Date from / to | ข้อมูลจากวันที่ / ถึงวันที่ | Kendo DatePicker, max 31/12/5000. Filters `DOCUMENT_DATE >= start` and `DOCUMENT_DATE <= end` (date at 00:00). | `_BrowseControlPanel.cshtml:141-147`, `RequestController.cs:1375-1378` |
| Status | สถานะ | `เลือกทั้งหมด`, `0 ยื่นคำขอ`, `10 รับเรื่อง`, `30 อนุมัติ`, `40 ชำระเงิน/จ่ายหนังสืออนุญาต` → `STATUS = '<v>'`. Statuses 2, 5, 20, 99 are **not offered**. | `_BrowseControlPanel.cshtml:198-209`, `RequestController.cs:577-587,1379-1380` |
| Search by | ค้นหาโดย | `RegisterNo` (เลขที่คำขอ), `TraderName` (ผู้ประกอบการ), `LicenseNo` (เลขใบอนุญาต), `DocumentNo` (เลขที่รับเรื่อง), `ReferenceNo` (เลขอ้างอิง); text → `LIKE '%value%'` | `_BrowseControlPanel.cshtml:256-261`, `RequestController.cs:602-614,1351-1374`, `../BC/Resources/DisplayName.resx:5615,5623,5632,5638,5642` |
| Submit | ค้นหา (shows "กรุณารอสักครู่..." loader) | full-page POST | `_BrowseControlPanel.cshtml:276-281,381-383` |
| Right-side buttons | none (IndustrialFactory with type -1) | — | `_BrowseControlPanel.cshtml:308-328` |
| Hidden lists | `RequestTypeList` ("--ทั้งหมด--" = 99 + 8 types) and `ChkStatusList` are built but **not rendered** for type -1. | `RequestController.cs:484-485,550-558`, `_BrowseControlPanel.cshtml:148-182` |

### 2.3 Grid columns (Kendo, server paging)

| # | Column | Field / format | Notes | Source |
|---|---|---|---|---|
| 1 | (edit icon) | link `~/{RequestDesc}/Entry?traderId={TraderId}&requestId={Id}` | opens the type-specific Entry page | `Views/Request/Index.cshtml:40-44` |
| — | hidden | RequestType, FormId, RequestDesc, Checking | | `Index.cshtml:60-62,100` |
| 2 | วันที่รับเรื่อง | `DocumentDate` | **label/field mismatch**: DocumentDate is labelled "วันที่รับเรื่อง" | `Index.cshtml:63-67`, `../BC/Resources/DisplayName.resx:5608` |
| 3 | แบบคำขอ | `RequestTypeDescription` | | `Index.cshtml:68-72`, `DisplayName.resx:6673` |
| 4 | เลขที่คำขอ | `RegisterNo` | | `Index.cshtml:73-77` |
| 5 | วันที่คำขอ | `RegisterDate` | label mismatch (register date labelled "วันที่คำขอ") | `Index.cshtml:78-82`, `DisplayName.resx:5619` |
| 6 | ผู้ประกอบการ | `TraderName` | | `Index.cshtml:83-87` |
| 7 | สถานะ | `StatusDesc`; if `Status=='30' && Checking=='A'` append " ( อนุมัต )", if `'30' && 'R'` append " ( ไม่อนุมัต )" | Thai typo "อนุมัต" (missing ิ). Result e.g. `30 - อนุมัติ ( ไม่อนุมัต )` — contradictory text. | `Index.cshtml:88-99` |
| 8 | เลขใบอนุญาต | `LicenseNo` | | `Index.cshtml:101-105` |
| 9 | วันที่อนุญาต | `IssueDate` | | `Index.cshtml:106-110`, `DisplayName.resx:5635` |
| 10 | เลขที่รับเรื่อง | `DocumentNo` | label mismatch with col 2/4 naming | `Index.cshtml:111-115` |
| 11 | เลขอ้างอิง | `ReferenceNo` | | `Index.cshtml:116-120` |

- Sort: fixed `DOCUMENT_NO DESC` server-side; no column sorting enabled (`Controllers/RequestController.cs:1275`).
- Paging: Kendo pager, empty text "ไม่มีข้อมูล"; the configured `pageSize` (10) is passed as the pager **ButtonCount**, not page size (`Index.cshtml:122`, `RequestController.cs:1337-1340`). Resizable columns, single-row select (`Index.cshtml:123-124`).
- Date strings in the JSON use Thai date + `HH:mm:ss` (`RequestController.cs:1287-1302`).

### 2.4 Bugs / inconsistencies (list)

1. GET restricts to `FORM_ID IN ('1','3','20','4','9','14','15')`; POST drops that restriction (code commented out), so after the first search the list widens to all forms (`RequestController.cs:1385-1393`).
2. `SearchModel.RequestType` is an `int` default 0 and the dropdown is not rendered, so every POST adds `REQUEST_TYPE = '0'` (BgChk only) because `0 < 99` (`Models/SearchModel.cs:25`, `RequestController.cs:1383-1384`). Search effectively returns only type 0.
3. End-date filter compares with midnight → records later on the end date are excluded (`RequestController.cs:1377-1378`).
4. `SearchValue` is concatenated into SQL `LIKE '%{0}%'` without escaping (an apostrophe breaks the query; second-order injection inside the signed where-clause) (`RequestController.cs:1355-1369`).
5. Status filter list omits 2/5/20/99 while those values exist (`RequestController.cs:577-587` vs `RequestStatusMgr.cs:31-38`).

---

## 3. Action: `/Request/ViewRequest?requestId=` (open a request from the approval list)

| Rule | Source |
|---|---|
| No `CustomAuthorize`/`RequestAccessFilter` on this action (login only); it redirects to `{Type}/Entry?traderId=&requestId=` which applies `RequestAccessFilter(SignerScopeOnly=true)`. | `Controllers/RequestController.cs:74-97`; e.g. `Controllers/RequestMoveController.cs:601-602` |
| Mapping: 2→RequestPlantEst, 3→RequestMove, 4→RequestImport, 5→RequestSaleDom, 6→RequestSaleInt, 7→**RequestPlantEst** (bug: should be RequestLedger). | `RequestController.cs:80-94` |
| Types 0, 1 and others return an empty page (`Content("")`). | `RequestController.cs:96` |
| Unknown id → `entity` null → NullReferenceException (500). | `RequestController.cs:77-80` |
| Called from RequestApproval grid button `.button-view-request` (same tab, loader for 5 s). | `Views/RequestApproval/Index.cshtml:273` |

---

## 4. Screen: Request info (read-only e-sign detail) — `/Request/RequestInfo?requestId=`

Action: `RequestInfo(int requestId)` sets `RequestId`, `FormType = 1` and `RequestTypeName = "แบบ อ.1"` unconditionally; the code that derived form type from the request is commented out. No program permission attribute (login only); the data endpoints it calls are protected (§5.1). (`Controllers/RequestController.cs:1456-1491`)

### 4.1 Layout

| Area | Content | Source |
|---|---|---|
| Top | Button `ย้อนกลับ` → `history.back()` | `Views/Request/RequestInfo.cshtml:7-9,728-730` |
| Header card | ประเภทใบอนุญาต = `RequestTypeName`; เลขที่ใบคำขอ (`document_no`); วันที่ยื่นคำขอ (`document_date`, date); สถานะเอกสาร (`request_plant_est.plant_est_status_name`, placeholder "นำเรียน"); เลขที่รับเรื่อง (`register_no`); วันที่รับเรื่อง (`register_date`); เลขที่นำเรียน (`inform_no`); วันที่นำเรียน (`inform_date`); ผู้ประกอบการ (`trader_name`) | `RequestInfo.cshtml:13-122` |
| Tabs | `รายละเอียดคำขอ` (active) / `ผลการตรวจสอบ` / `ตรวจสอบการลงนาม` | `RequestInfo.cshtml:125-129` |
| Tab 1 | partial `shared/_RequestDesc` + (FormType 1,3,4,5) grid "รายการวัสดุ/วัตถุดิบ" | `RequestInfo.cshtml:134-182` |
| Tab 2 | partial `shared/_ResultCheck` | `RequestInfo.cshtml:185-191` |
| Tab 3 | partial `shared/_ApproveCheck` (signature timeline) | `RequestInfo.cshtml:194-200` |

### 4.2 Data binding rules (client JS)

| Rule | Source |
|---|---|
| On load: `GET /requestEsig/GetRequest?id={id}&requestType={FormType}` and `GET /requestEsig/factoryInfo?request_id={id}`; for FormType 5/6 also `resultChkOfc`. | `RequestInfo.cshtml:357-363,494-564` |
| Every element with `data-field` is bound by dotted path; missing value → `data-default` or `-`. Elements inside a Kendo grid are skipped. | `RequestInfo.cshtml:629-662` |
| `data-format="date"` → `dd/MM/yyyy` with Buddhist year (+543); `datetime` adds `HH:mm` when time ≠ 00:00; `number` → locale format. Only ISO `YYYY-MM-DD[THH:mm:ss]` is parsed; anything else shown raw. | `RequestInfo.cshtml:379-431` |
| `data-map="fn"` applies a mapper before formatting (e.g. `formatThaiDate`, `mapInspectionStatus`). | `RequestInfo.cshtml:650-655` |
| Grid row number column (#) is recomputed per page in `onGridDataBound`. | `RequestInfo.cshtml:365-373` |
| Header load failure → alert "เกิดข้อผิดพลาดในการโหลดข้อมูล". API `is_success=false` intends alert `json.message` or "ไม่สามารถโหลดข้อมูลได้" but references undefined `json` → falls into the catch → same generic alert. | `RequestInfo.cshtml:499-526` |
| Thai date helpers for grids: `formatThaiDate` → `dd/MM/yyyy(BE)` or `-`; `formatThaiDateTime` adds `HH:mm:ss`. | `RequestInfo.cshtml:699-726` |

### 4.3 Tab 1 — `รายละเอียดคำขอ` (`shared/_RequestDesc`)

Left column (7/12): form-specific block + collapsible panels (collapsed by default, toggled by a hamburger button). Right column (5/12): preview pane `iframe#pdfPreview` initially loading `RequestEsig/PreviewDefault` ("กรุณาเลือกไฟล์เพื่อเปิดดู").

Form-specific block chosen by `ViewBag.formType` (`Views/Request/shared/_RequestDesc.cshtml:7-30`):

| formType | Partial | Heading (verbatim) | Print buttons (right → left) | Fields | Source |
|---|---|---|---|---|---|
| 1 | `_descA1` | แบบคำขอรับใบอนุญาตประกอบกิจการโรงงานผลิตอาวุธ (แบบ อ.1) | ใบอนุญาต (`licenseA1Report`), เอกสารตรวจสอบ (`checking`), ใบคำขอ (`requestA1Report`) | วัตถุประสงค์ (`objective_type_name`), ประเภทวัตถุหรืออาวุธที่ขออนุญาต (`product_type_group_name`), วัตถุประสงค์ (ขยายความ) (`objective`), หมายเหตุ (`note1`) | `Views/Request/description/_descA1.cshtml:2-38` |
| 3 | `_descA3` | แบบคำขอรับใบอนุญาตประกอบกิจการโรงงานผลิตอาวุธ (แบบ อ.3) | สลักหลัง (`endorse`), ใบอนุญาต (`licenseA3Report`), เอกสารตรวจสอบ (`checking`), ใบคำขอ (`requestA3Report`) | เอกสารเขียนที่ (bound to empty path → always `-`), อ้างอิงถึงใบอนุญาต (`objective` — wrong field), วัตถุประสงค์ อ.2, วันที่ใบอนุญาต (`issue_date`, raw), ประเภทวัตถุ…, วันหมดอายุ (`expiry_date`, raw), เลขที่หนังสืออนุญาตขยายสายการผลิต (`objective` — wrong field), วันที่อนุญาต (`issue_date`) | `description/_descA3.cshtml:2-70` |
| 4 | `_descOpen` | แบบคำขออนุญาตเปิดดำเนินกิจการโรงงานผลิตอาวุธ | หนังสืออนุญาต (`licenseOpenReport`), เอกสารตรวจสอบ, ใบคำขอ (`requestOpenReport`) | เอกสารเขียนที่ (`document_place_name`), อ้างอิงถึงใบอนุญาต (`history_license_no`), วัตถุประสงค์ อ.2, วันที่ใบอนุญาต, ประเภทวัตถุ…, วันหมดอายุ (history_*), เลขที่หนังสืออนุญาตขยายสายการผลิต (`ref_expand_license_no`), วันที่อนุญาต; grid "รายการอาวุธ/วัตถุดิบ" (รหัส, กลุ่ม, ชื่ออาวุธ&วัตถุดิบ, รายละเอียด, อาคารที่ใช้, เครื่องจักร); วัตถุประสงค์การขอเปิดดำเนินการผลิต | `description/_descOpen.cshtml:4-107` |
| 5 | `_descExpand` | แบบคำขออนุญาตเปิดขยายสายการผลิตอาวุธ | สลักหลัง, หนังสืออนุญาต (`licenseExpandReport`), เอกสารตรวจสอบ, ใบคำขอ (`requestExpandReport`) | as Open but ref = เลขที่หนังสืออนุญาตเปิดดำเนินการผลิต (`ref_open_license_no`); grid "รายการอาวุธ/วัตถุดิบ ที่ขยายสายการผลิต"; วัตถุประสงค์การขอเปิดขยายสายการผลิต | `description/_descExpand.cshtml:4-111` |
| 6 | `_descChangeFactory` | แบบคำขออนุญาตเปลี่ยนแปลงโรงงาน | สลักหลัง, หนังสืออนุญาต (`licensePlantChangeReport`), เอกสารตรวจสอบ, ใบคำขอ (`requestPlantChangeReport`) | เอกสารเขียนที่ (empty path), grid "ข้อมูลอ้างอิงใบอนุญาต อ.2" (ประเภทที่ขอรับอนุญาต, วัตถุประสงค์, เลขที่ใบอนุญาต, วันที่ได้รับ, วันที่หมดอายุ, ใบอนุญาต icon, สลักหลัง icon), ความประสงค์คำขอ (empty path), grid "รายการพื้นที่ในโรงงาน" (ชื่อโรงงาน, ชื่อคลังโรงงาน, ลักษณะ, วันที่แก้ไข, เอกสาร = `ใช้งาน`/`ไม่ใช้งาน` by `status==1`, หมายเหตุ), วัตถุประสงค์การขอเปลี่ยนแปลง (empty path) | `description/_descChangeFactory.cshtml:4-113` |
| 7 | `_descChangeCommittee` | แบบคำขออนุญาตเปลี่ยนแปลงกรรมการ | สลักหลัง, หนังสืออนุญาต (`licensePersonChangeReport`), เอกสารตรวจสอบ, ใบคำขอ (`RequestPersonChangeReport`) | เอกสารเขียนที่, grid ข้อมูลอ้างอิงใบอนุญาต อ.2, ความประสงค์คำขอ, วัตถุประสงค์การขอเปลี่ยนแปลง (all text fields bound to empty path) | `description/_descChangeCommittee.cshtml:4-79` |

Common collapsible panels (all form types unless stated) (`_RequestDesc.cshtml`):

| Panel | Shown when | Content | Documents grid (`documentType`) | Source |
|---|---|---|---|---|
| ข้อมูลสำนักงาน/การจดทะเบียน | always | ข้อมูลสำนักงาน: เลขที่บัตรประจำตัวผู้เสียภาษี, สาขาประกอบการ, หมู่ที่, จังหวัด, ตรอก/ซอย, ตำบล/แขวง, โทรศัพท์, โทรสาร, ชื่อบริษัท, เลขที่อยู่, ชื่ออาคาร, ถนน, อำเภอ/เขต, รหัสไปรษณีย์, อีเมล. ข้อมูลการจดทะเบียน: เลขที่ทะเบียนนิติบุคคล, ทุนจดทะเบียน (bound to `.capital_amount` — leading dot bug → always `-`), วันที่จดทะเบียนนิติบุคคล (raw), สถานที่จดทะเบียนนิติบุคคล, จังหวัดที่จดทะเบียนนิติบุคคล | "ข้อมูลเอกสารหลักฐาน" → `_RequestDoc(documentType=1)` | `_RequestDesc.cshtml:31-199` |
| ข้อมูลโรงงาน | always | ชื่อโรงงาน, เนื้อที่โรงงาน (ไร่/งาน/ตารางวา), ละติจูด/ลองจิจูด, address fields, เลขทะเบียนโรงงาน, รายละเอียดเพิ่มเติมของสถานที่, อีเมล, กำลังเครื่องจักรที่ได้รับอนุญาต (all `request_plant_est.*`) | `documentType=3` | `_RequestDesc.cshtml:201-352` |
| ข้อมูลและบุคคล | always | person grid: เลขที่บัตรแสดงตัวตน, ชื่อ-นามสกุล, ตำแหน่งในบริษัท, ผู้รับมอบอำนาจ (`เป็นผู้รับมอบอำนาจ`/`ไม่เป็นผู้รับมอบอำนาจ` + name), สถานะ (C=สร้างข้อมูล, R=ตีกลับ/แก้ไข, W=รอตรวจสอบ, A=ถูกต้อง, else `-`) | `documentType=2` | `_RequestDesc.cshtml:354-445,719-727` |
| ข้อมูลอาคาร | formType 1 or 3 | grid: ชื่ออาคาร, ประเภทอาคาร (1=อาคารการผลิต else `-`), วัตถุประสงค์การใช้งาน, สถานะอาคาร (1 ปกติ, 2 ก่อสร้างใหม่, 3 ดัดแปลง, 4 ชำรุด, 5 ขยาย, 9 ยกเลิก) | — | `_RequestDesc.cshtml:447-498,729-746` |
| ข้อมูลโครงการ | formType 1, 3, 5, 6 | grid "เอกสารโครงการ": ชื่อเอกสาร, เอกสาร icon | `documentType=6` | `_RequestDesc.cshtml:499-545` |
| เอกสารแนบอื่นๆ | always | "ข้อมูลเอกสารหลักฐาน" | `documentType=99` | `_RequestDesc.cshtml:549-602` |

Document grid columns (types 1, 2, 3, 99): `#`, ชื่อเอกสาร, วันที่เอกสาร (`formatThaiDate(issue_date)`), วันหมดอายุ (`formatThaiDate(expiry_date)`), a **second column also titled "วันหมดอายุ"** that actually shows issuer "จังหวัด<prov> ออกโดย:<district>" or `-`, เอกสาร (icon if `file_token != ''`) (`_RequestDesc.cshtml:162-192,316-346,409-439,565-597`). Page size 10, refresh + page-size picker, server operation (paging done by the proxy, §5.2).

Preview rules (Tab 1):

| Rule | Source |
|---|---|
| Only the "เอกสารแนบอื่นๆ" grid (99) renders a clickable icon (`.js-preview-pdf` with `data-token`); click sets `iframe#pdfPreview.src = /requestEsig/PreviewPdf?token=<encoded>`; no token → `-`. | `_RequestDesc.cshtml:585-588,705-717` |
| Bug: the office (1), factory (3), person (2) and project (6) grids render the PDF icon **without** class/token → not clickable; empty token shows blank. | `_RequestDesc.cshtml:182,336,429,529` |
| `_descChangeFactory` / `_descChangeCommittee` icons use inline `onclick="previewPdf('#=result_file_token#')"` (raw template, not HTML-encoded) and both "ใบอนุญาต" and "สลักหลัง" columns open the **same** `result_file_token`. | `_descChangeFactory.cshtml:42-53`, `_descChangeCommittee.cshtml:42-53` |
| `img#imgPreview` exists but is never used (images also go to the iframe). | `_RequestDesc.cshtml:612` |

Print buttons (`.btn-print`) behaviour:

| Rule | Source |
|---|---|
| Opens a blank window ("กำลังโหลดเอกสาร..."), fetches `/requestEsig/{data-report-type}?request_id={data-request-id}`; non-OK → close + alert "เกิดข้อผิดพลาดในการเรียกเอกสาร"; HTML response → close + alert "ไม่พบไฟล์เอกสาร"; otherwise shows the blob (PDF) in the new window. | `_RequestDesc.cshtml:662-703` |
| Bug: no button sets `data-request-id` → URL carries `request_id=undefined` → model binding of `int request_id` fails → error alert. Every print button is broken as written. | `_descA1.cshtml:3-11` (and all desc partials) |
| Bug: `checking` (เอกสารตรวจสอบ) and `endorse` (สลักหลัง) have no server endpoint. | `_descA1.cshtml:6`, `_descA3.cshtml:3`; endpoints list `Controllers/api/RequestEsigController.cs:1319-1366` |
| Bug: the page's `ย้อนกลับ` button also has class `btn-print` → clicking Back additionally opens a window for `/requestEsig/undefined`. | `RequestInfo.cshtml:7` |

Tab 1 also shows the product grid "รายการวัสดุ/วัตถุดิบ" for FormType 1/3/4/5: `#`, รหัส, กลุ่ม, ชื่ออาวุธ&วัตถุดิบ, รายละเอียด, กำลังการผลิต/ปี (หน่วยนับ) = `quantity` (n0) + `unit_name1`, กำลังการผลิต/ปี (นำหนัก) [sic: น้ำหนัก] = `quantity2` + `unit_name2` (`RequestInfo.cshtml:138-181`). For 4/5 this duplicates the product grid already inside the desc partial.

### 4.4 Tab 2 — `ผลการตรวจสอบ` (`shared/_ResultCheck`)

| Panel | Shown when (FormType) | Content | Source |
|---|---|---|---|
| ผลการตรวจสอบโรงงานโดยเจ้าหน้าที่ควบคุม | 5, 6 | ข้อมูลคำขอตรวจสอบโรงงานโดยเจ้าหน้าที่: เลขที่อ้างอิง, วันที่สร้างคำขอ; สถานะการตรวจสอบโรงงานโดยเจ้าหน้าที่ (`request_status` mapped: 0 ยื่นคำขอ, 2 ตีกลับ/แก้ไข, 5 ส่งข้อมูลรอตรวจสอบ, 10 รับเรื่อง, 20 เสนออนุมัติ, 25 ตีกลับโดยผู้มีอำนาจลงนาม, 29 ไม่อนุมัติ, 30 อนุมัติ, 35 อยู่ระหว่างบันทึกผล, 40 ผลตรวจสอบ-ผ่านหมด, 41 ผลตรวจสอบ-ไม่ผ่านทั้งหมด, 42 ผลตรวจสอบ-ไม่ผ่านบางคน, else `-`); grid "ไฟล์สรุปรายงาน" (รายการเอกสาร, เอกสาร icon) | `Views/Request/shared/_ResultCheck.cshtml:7-79,454-470` |
| ผลการตรวจสอบประวัติ | 1, 3, 7 | grid: เลขที่บัตร, ชื่อ-นามสกุล, วันที่เอกสาร, วันที่เริ่ม, วันที่หมดอายุ, เอกสาร icon (`result_attach_file_token`) | `_ResultCheck.cshtml:81-139` |
| ผลการตรวจสอบสถานที่ตั้งโรงงาน | 1, 3, 4 | กำหนดวันที่นัดตรวจโรงงาน, เลขที่คำสั่งเดินทาง, วันที่คำสั่งเดินทาง, สถานะการตรวจสอบโรงงาน (true → รับผลตรวจ-ผ่าน, false → รับผลตรวจ-ไม่ผ่าน, else `-`), ผลการตรวจสอบโรงงาน; grid "ไฟล์ผลการตรวจสอบโรงงาน" | `_ResultCheck.cshtml:141-223,438-444` |
| ผลการประชุม อท.ศอพท. / ผลการประชุม กมย. กห. / ผลการประชุม คพอท. | 1 only | วันที่ประชุม, ผลการประชุม (1 เห็นชอบ, 2 ไม่เห็นชอบ, **default also ไม่เห็นชอบ**), รายละเอียดการประชุม; grid "ไฟล์ผลการประชุม" (meetingType 1/2/3) | `_ResultCheck.cshtml:225-424,446-452` |
| Preview | right column `iframe#pdfPreviewResult` hidden until a `.js-preview-result` icon is clicked → `/RequestEsig/PreviewPdf?token=…` | `_ResultCheck.cshtml:430-435,472-485` |

- Bug: the three meeting header sections are bound by `loadMeetingSection*` functions that are never called → their text fields always show `-` (grids still load) (`RequestInfo.cshtml:566-627` vs `357-363`).
- Bug: `console.Error` (capital E) in the OFC branch throws on API failure (`RequestInfo.cshtml:547`).
- "Default ไม่เห็นชอบ" for a missing meeting result is misleading (`_ResultCheck.cshtml:446-451`).

### 4.5 Tab 3 — `ตรวจสอบการลงนาม` (signature timeline, `shared/_ApproveCheck`)

| Column | Field / mapping | Source |
|---|---|---|
| ลำดับ | row number | `Views/Request/shared/_ApproveCheck.cshtml:7-10` |
| วันที่อนุมัติ | `formatThaiDateTime(approval_date)` → `dd/MM/yyyy HH:mm:ss` (BE) or `-` | `_ApproveCheck.cshtml:11-13` |
| สถานะการอนุมัติ | 0 รออนุมัติ, 1 อนุมัติ, 2 ไม่อนุมัติ, default รออนุมัติ | `_ApproveCheck.cshtml:14-16,35-42` |
| ชื่อ-นามสกุล ผู้อนุมัติ | prefix+name (no space) + surname | `_ApproveCheck.cshtml:17-19` |
| ตำแหน่ง | `person_position` | `_ApproveCheck.cshtml:20` |
| ลำดับการลงนาม | `authorize_level_name` (levels 1–19 "ผู้ตรวจสอบ {n}", 20 "ผู้ตรวจสอบและลงนาม") | `_ApproveCheck.cshtml:21`, `../BC/Constants/AuthorizeLevelMgr.cs:31-50`, `../BC/Resources/DisplayName.resx:7495-7499` |
| รายละเอียด | `approval_description` | `_ApproveCheck.cshtml:22` |

- Data: `RequestEsig/_ApprovalCheck` → back-end `authorize-process/approval-esig-list/{requestId}`; order is whatever the back-end returns (`Controllers/api/RequestEsigController.cs:1196-1279`).
- Bug: this grid is named `gridBgResultChk`, the same id as the background-check grid in Tab 2 for FormType 1/3/7 → duplicate DOM id; Kendo's `$("#gridBgResultChk")` init binds to the first element, so on the only reachable form type (1) the signature timeline tab is likely empty / the check-result grid gets overwritten (`_ApproveCheck.cshtml:4` vs `_ResultCheck.cshtml:98`).

---

## 5. `RequestEsig` proxy (API used by RequestInfo)

### 5.1 Access

| Rule | Source |
|---|---|
| Class-level `[CustomAuthorize]` with no program (= login only) + `[RequestAccessFilter]` (checks `request_id`/`requestId`/`id`). `PreviewPdf(token)` and `PreviewDefault()` carry no request id → only login is checked here; permission on the file is decided by the back-end (403 → "ไม่มีสิทธิ์ดูไฟล์นี้"). | `Controllers/api/RequestEsigController.cs:22-24,204-248`, `Security/BackendFileResponse.cs:44-54` |
| Note: `GetRequest(int id, …)` — `id` is treated as request id by the filter. | `RequestEsigController.cs:113-125`, `Attributes/RequestAccessFilter.cs:209-213` |
| Calls carry a per-user bearer token `BackendTokenFactory.Create(user, IP)`. | `RequestEsigController.cs:28-29` |

### 5.2 Data endpoints

| Endpoint | Back-end path | Notes | Source |
|---|---|---|---|
| `GetRequest(id, requestType)` | requestType 1 or 3 → `request-form-a1/request-info/{id}`; else `request/request-info/{id}` | | `RequestEsigController.cs:113-125` |
| `factoryInfo(request_id)` | `inspection/inspect-factory-result-info/{id}` | | `:31-33` |
| `resultChkOfc(request_id)` | `request-chk-ofc/{id}` | | `:34-36` |
| `meetingInfo(request_id, meeting_type)` | `request-form-a1/request-meeting-info/{id}/{type}` | | `:37-39` |
| Forwarder behaviour | Non-2xx → back-end body passed through; non-JSON → raw; on success enriches `data.product_type_group_name` (lookup by code) and `data.objective_type_name` (lookup in `constants/objective-type-list`); exception → HTTP 500 `{error}`. `is_sucess` (typo) or `is_success` accepted; missing flag = success. | `:42-111,1284-1315` |
| Grids `_RequestDetail` (`request/product-list`), `_RequestPerson` (`request-form-a1/request-person-list`), `_RequestBuilding` (`request-form-building/request-building-list`), `_RequestChangeBuilding` (`request/request-change-bldg`), `_RequestDoc(requestId, documentType)` (`request/request-document-list/{id}/{type}`), `_ResultBgChk` (`inspection/inspect-person-result-list`), `_ResultLocChk` (`inspection/inspect-factory-result-info`), `_ResultMeeting` (`request-form-a1/request-meeting-doc-list/{id}/{type}`), `_ResultLocChkOfc` (`request/request-ofc-list`), `_ApprovalCheck` (`authorize-process/approval-esig-list`) | Full list fetched, **paged in memory** (Skip/Take), Total = full count; any failure → empty result (errors swallowed). No sorting/filtering. | `:317-1279` |

Document types used by the UI: 1 office/company, 2 persons, 3 factory, 6 project, 99 other (`_RequestDesc.cshtml:189,343,436,536,594`).

### 5.3 File preview / report rules (security-relevant, keep in redesign)

| Rule | Source |
|---|---|
| `PreviewPdf(token)`: empty token → HTML page "ไม่พบไฟล์เอกสาร"; token is URL-escaped into `attachment/download/{token}`. | `RequestEsigController.cs:204-213` |
| Back-end non-success → HTML page: 403 → "ไม่มีสิทธิ์ดูไฟล์นี้", else "ไม่พบไฟล์เอกสาร"; empty body or exception → "ไม่พบไฟล์เอกสาร". The page is a grey centred `<h2>` designed to sit inside the iframe. | `:229-247,279-312`, `Security/BackendFileResponse.cs:43-54` |
| `PreviewDefault()` → same page with "กรุณาเลือกไฟล์เพื่อเปิดดู". | `:250-256` |
| Content type decided by allowlist on the file **name** from back-end `Content-Disposition` + magic bytes: PDF (`%PDF-`), JPEG, PNG, GIF → `inline`; DOC/DOCX → `attachment` with their MIME; anything else (or name/bytes mismatch) → `application/octet-stream` `attachment`. Attachments get `Content-Security-Policy: default-src 'none'; sandbox`. File name sanitised (path stripped, invalid → `document`), header uses RFC 5987 `filename*`. | `Security/BackendFileResponse.cs:62-140`, `../BC/Constants/FileUploadPolicy.cs:26-35,196-214`, `RequestEsigController.cs:262-276` |
| Reports (`requestA1Report`, `requestA3Report`, `requestOpenReport`, `requestExpandReport`, `requestPlantChangeReport`, `requestPersonChangeReport`, `licenseA1Report`, `licenseA3Report`, `licenseOpenReport`, `licenseExpandReport`, `licensePlantChangeReport`, `licensePersonChangeReport`): must start with `%PDF-`, else "ไม่พบไฟล์เอกสาร"; always `application/pdf` inline; `.pdf` appended to the name if missing. | `RequestEsigController.cs:1319-1409`, `Security/BackendFileResponse.cs:96-108` |

---

## 6. Popup: choose signing method (`กำหนดวิธีการลงนาม`) — RequestMove only

Flow: on RequestMove/Entry, button `นำเรียน` → confirm (title "กรุณายืนยัน", text "การนำเรียน", buttons `ใช่`/`ไม่ใช่`) → if the request is saved, POST `Request/_CreateLicenseInform` into the Kendo window titled "กำหนดวิธีการลงนาม"; unsaved → "คำเตือน" / "กรุณาบันทึกคำขอก่อนเพิ่มรายการ" (`Views/RequestMove/Entry.cshtml:1569-1607`).

### 6.1 Popup content (`Views/Request/_RequestSignatureProcessEntry.cshtml`)

| Element | Detail | Source |
|---|---|---|
| Buttons | `บันทึกข้อมูล` (submit), `ปิด` | `_RequestSignatureProcessEntry.cshtml:18-19` |
| Radio | `ลงนามด้วยวิธีปกติ` (value 0, default) / `ลงนามด้วย E-Signature` (value 1) → `Request.SignatureType` | `:55-56` |
| Dropdown | label `กระบวนการลงนาม`, list = approval processes | `:61-62` |
| Grid (process steps) | ลำดับผู้ลงนาม (ItemNo, 70px), ชื่อ (PersonFullName), ตำแหน่ง, ระดับการลงนาม; pager empty "ไม่มีข้อมูล" | `:69-102`, `../BC/Resources/DisplayName.resx:7339-7358` |
| Hidden fields | carry the 5 inform signer names/positions, document no/date, operation period fields (from the นำเรียน section) | `:24-52` |

### 6.2 Server rules

| Rule | Source |
|---|---|
| Both actions: POST only, `RQ06 INSERT`. | `Controllers/RequestController.cs:102,155` |
| Process list: `ApprovalProcess` rows with `(RENEW_OPTION IS NULL OR 'N') AND SUBSTITUTE_OPTION IS NULL`; for PlantEst renew → `RENEW_OPTION IS NULL OR 'R'`; substitute → `SUBSTITUTE = 'S'`. | `RequestController.cs:313-348` |
| Validation messages (shown under the form): request missing → "ไม่พบข้อมูลคำขอ"; process not in offered list → "กระบวนการลงนามไม่ถูกต้อง"; inform belongs to another request → "หนังสือนำเรียนไม่ใช่ของคำขอนี้"; derived move license missing or move status < 10 → "ไม่ใช่หนังสืออนุญาตขนย้าย"; BL messages appended. | `RequestController.cs:169-204,281-288` |
| Save: creates/updates LicenseInform (Title "นำเรียน", ReferenceNo from the DB request; InformStatus = Inform if DocumentNo & DocumentDate present else Waiting); bumps the move request status to ≥ 20 (Inform); then `SelectSignature(requestId, signatureType, processId)`. | `RequestController.cs:194-275` |
| `SelectSignature` with type 1 (E-Signature): copies the process steps ordered by `AUTHORIZE_LEVEL, ITEM_NO` into `T_T_REQUEST_APPROVAL` with a new `REVISION_NO` (max+1), sequence 1..n, signer id card/email/signature image from AuthorizePerson. Type 0 only stores `SIGNATURE_TYPE`. | `../BL/Transaction/BLRequest.cs:776-836` |
| Success JSON: `saveStatus`, inform `statusDesc`, `requestStatus`/`requestStatusDesc`, `DocumentNo`, `DocumentDate`, `auditUpdateText` (format "{0} โดย {1}"). | `RequestController.cs:298-307`, `App_GlobalResources/DisplayName.resx:561` |

### 6.3 Bugs

1. The process grid's data function returns `{}` → `_ApprovalProcessDtl` gets no where-clause → shows the steps of **all** processes, not the selected one (`Views/RequestMove/Entry.cshtml:2198-2200`, `Controllers/ApprovalProcessDtlController.cs:186-192`).
2. `onSignatureProcessChange` uses an undefined `e` (`Entry.cshtml:2194-2196`).
3. `closeEntryWindow` reads `data.*` but the parsed variable is `response` → ReferenceError swallowed; the window closes and `นำเรียน` is disabled, but status/document-no/audit labels are not refreshed (`Entry.cshtml:1550-1563`).
4. `#selectSignatureProcess` handler does a GET to a POST-only action and no element with that id exists (dead) (`Entry.cshtml:2133-2147`).
5. Substitute filter uses non-existent column `SUBSTITUTE` (should be `SUBSTITUTE_OPTION`) (`RequestController.cs:329-330`).
6. Only RequestMove offers this popup in SSPF; other types call `LicenseInform/_CreateLicenseInform` without signature selection, so their approval chain must be created elsewhere (not found in this repo; likely the new back-end) (`Views/RequestImport/Entry.cshtml:1080`, `Views/RequestPlantEst/Entry.cshtml:1945`).

---

## 7. Attachments (ไฟล์แนบ) — `AttachFileController`

### 7.1 Attachment groups (`ATTACH_GROUP`) and who may touch them

| Code | Name (screen param) | Disk folder | Owner programs (Read=ACCE; Write=INST or UPDA; Remove=UPDA or DELE) | Request-scoped? |
|---|---|---|---|---|
| 0 | TraderDoc | TRADER_DOC | MA18, RQ04 | no |
| 1 | TraderPlant (also "Trader") | TRADER_PLANT | MA18 | no |
| 2 | TraderPlantTech | TRADER_PLANT_TECH | MA18 | no |
| 3 | TraderOpen | TRADER_OPEN | MA18 | no |
| 4 | TraderExpand | TRADER_EXPAND | MA18 | no |
| 5 | TraderOpenExt | TRADER_OPEN_EXT | MA18 | no |
| 6 | TraderStop | TRADER_STOP | MA18 | no |
| 7 | TraderChange | TRADER_CHANGE | MA18 | no |
| 8 | TraderRevoke | TRADER_REVOKE | MA18 | no |
| 9 | RequestDoc | REQUEST_DOC | RQ01 | **yes** (via REQUEST_DOC.REQUEST_ID) |
| 10 | LicenseInform | LICENSE_INFORM | LC03 + RQ05/06/07/08 (narrowed to LC03 + the program of `Request=` when given) | **yes** (AttachRecordId1 = request id) |
| 11 | License | LICENSE | LC01 | no |
| 12 | TraderReopen | TRADER_REOPEN | MA18 | no |
| 13 | InformMove | INFORM_MOVE | IF02 | no |
| 14 | RequestBgChk | REQUEST_BG_CHK | RQ02 | no |
| 15 | TraderPersonChange | TRADER_PERSON_CHANGE | MA18 | no |
| 16 | RequestLocChk / TraderPlantOfficer | TRADER_PLANT_OFFICER | MA18, RQ03 | no |

Sources: `../BC/Enumerates/AttachGroup.cs:10-26`, `../BC/Constants/AttachmentStorage.cs:36-50`, `../BL/Security/AttachFilePermissionPolicy.cs:37-65,91-123,136-165`, `Attributes/AttachFileAuthorizeAttribute.cs:31-32,427-457`.

- Read also accepts legacy `RQ01 ACCE` (transition rule); unknown group: Read → RQ01, Write/Remove → denied (`Security/AttachFileAccess.cs:28-50`).
- Denied: AJAX → JSON `unauthorizeMessage` = "ไม่มีสิทธิแก้ไขข้อมูล" (write) / "ไม่มีสิทธิลบข้อมูล" (remove) / "ไม่มีสิทธิเข้าถึงข้อมูล" (read); non-AJAX → HTTP 401 (`AttachFileAuthorizeAttribute.cs:472-495`, `App_GlobalResources/MessageDisplay.resx:162-172`).
- Conflicting values for the same parameter across query/form/route → deny (`AttachFileAuthorizeAttribute.cs:141-201`).

### 7.2 Screen: attachment list — `/AttachFile/UploadFile` and `/AttachFile/UploadFileRequest`

| Rule | Source |
|---|---|
| GET params `AttachGroup`, `AttachRecordId1`, `TraderId` (+ `Request` for the request variant). Read permission of the group + request scope for 9/10. | `Controllers/AttachFileController.cs:1031-1070,1125-1157` |
| Header (`_DataControlPanel`, not General mode): "<TraderName> >> <function text>"; only `ปิด` button (confirm "ต้องการปิดหน้าจอนี้ใช่หรือไม่" ใช่/ไม่ใช่). Function text per group: TraderPlant เอกสารเกี่ยวกับโรงงาน, TraderPlantTech เอกสารเทคโนโลยีการผลิต, TraderOpen ประวัติสายการผลิตอาวุธ, TraderExpand ประวัติขยายสายการผลิต, TraderOpenExt ประวัติขยายระยะเวลาตั้งโรงงาน, TraderStop ประวัติการหยุดหรือยกเลิกสายการผลิตอาวุธ, TraderChange ประวัติการเปลี่ยนแปลงโรงงานทำอาวุธ, TraderRevoke ประวัติการเพิกถอนใบอนุญาตประกอบกิจการโรงงานทำอาวุธ, LicenseInform เอกสารแนบนำเรียนต่างๆ, TraderReopen ประวัติการเปิดดำเนินการ, TraderDoc **"0"** (bug), RequestDoc "RequestDoc", License "License", else เอกสารผู้ประกอบการ. | `AttachFileController.cs:969-1029`, `Views/Shared/_DataControlPanel.cshtml:36-65`, `Scripts/cdss.js` CloseDataWindow |
| Add row: text box ชื่อเอกสาร (500px) + button `เพิ่มเอกสาร`. Empty name → swal "กรุณากรอกชื่อเอกสาร". Typing `\ / : * ? " < > \|` blocked with "คำเตือน" / "ห้ามใช้อักษรพิเศษ  \\ / : * ? \" < > \| ทั้งหมดนี้". | `Views/AttachFile/UploadFile.cshtml:30-38,101-109,140-155` |
| POST creates an empty attachment row (server ignores client Id/path/size/ext) then redirects back. Re-validates permission with bound values (401 on mismatch). | `AttachFileController.cs:1071-1123,1159-1211` |
| Grid read `_Upload(AttachGroup, AttachRecordId1[, Request])`: where-clause built server-side `ATTACH_GROUP = g AND ATTACH_RECORD_ID1 = id`; unknown group or missing id → no rows. | `AttachFileController.cs:866-902`, `../BL/Transaction/AttachFileScope.cs:19-45` |
| Columns: (view icon only if `FileSizeMb != 0` → `ReviewPDF` in new window; delete icon), ชื่อเอกสาร, ขนาดไฟล์ (MB) shown as "<n> (MB)", ประเภทไฟล์, วันที่ Upload, (upload icon → popup "อัพโหลดไฟล์" 500×250). | `UploadFile.cshtml:49-79,111-113`, `Scripts/cdss.js:115-119`, `../BC/Resources/DisplayName.resx:2700-2725` |
| Close button returns: Trader group → `Trader/Edit?id=<TraderId>`; LicenseInform → `<Request>/Entry?traderId=&requestId=<AttachRecordId1>`; else `<AttachGroup>/Edit?id=<AttachRecordId1>&TraderId=`. | `UploadFile.cshtml:90-99` |
| Bug: the grid delete icon (`a.delete`) has no click handler (the binding in `onGridBound` is commented out) → inert. | `UploadFile.cshtml:51`, `Scripts/cdss.js:127-151` |
| Bug: `UploadFile` GET uses group name "TraderPlant"/"TraderPlantTech" → BackToIndex "Trader"; but list-filter mapping treats "Trader" as group 1 only on the list. | `AttachFileController.cs:1043-1051` |

### 7.3 Upload popup (`_Upload` / `_UploadRequestDoc`)

| Rule | `_Upload` (generic) | `_UploadRequestDoc` (request documents) | Source |
|---|---|---|---|
| Heading | "กรุณาเลือกไฟล์ที่อัพโหลด*" | same | `Views/AttachFile/_Upload.cshtml:6`, `_UploadRequestDoc.cshtml:6`, `App_GlobalResources/DisplayName.resx:729` |
| Control | Kendo Upload, single file, auto-upload | same | `_Upload.cshtml:10-24`, `_UploadRequestDoc.cshtml:10-23` |
| Accept hint | `application/msword,application/pdf` (docx not in hint) | `.pdf,.docx` | `_Upload.cshtml:23`, `_UploadRequestDoc.cshtml:22` |
| Save URL | `Events_Save(Id, DocumentId, TraderId)` | `Events_Save_RequestDoc(Id, DocumentId, RequestId)` | |
| Server type check | magic bytes: pdf, docx, **doc allowed**; empty file rejected | magic bytes: pdf, docx only; empty rejected | `AttachFileController.cs:344-358,97-111`, `../BC/Constants/FileUploadPolicy.cs:151-169` |
| Invalid file message | Content "กรุณา Upload File PDF,Word เท่านั้น" (Kendo shows as error) | intends same text but returns `View(model)` with no such view → server error | `AttachFileController.cs:349-356,103-109` |
| Stored name | `<DocumentName>.pdf` if PDF else `<DocumentName>.docx` (a .doc is saved as .docx — bug) | same | `AttachFileController.cs:400-429,226-255` |
| Replace semantics | existing files in the document folder are deleted first (one file per document) | same | `AttachFileController.cs:379-395,205-221` |
| Size | no app-level limit (only IIS 50 MB); size stored in MB | same | `Web.config:214`, `AttachFileController.cs:236,410` |
| Other server messages | "ไม่พบข้อมูลไฟล์แนบ", "ชื่อเอกสารไม่ถูกต้อง" | + RequestDoc row auto-created/updated | `AttachFileController.cs:113-185,339-377` |
| Client result | success → reload grid, close popup, swal "อัพโหลดสำเร็จ"; error → "คำเตือน" + "อัพโหลด <file (n KB)>ไม่สำเร็จ :: <server text>" (UploadFile) / "อัพโหลดไม่สำเร็จ :: <file>" (UploadFileRequest, RequestDoc) | | `UploadFile.cshtml:117-138`, `Views/RequestDoc/Upload.cshtml:345-370` |
| Remove (Kendo X) | `Events_Remove(Id)`: deletes the stored file only if its path resolves under the group root; always resets row to `N/A`, size 0 | | `AttachFileController.cs:446-482` |
| Request-scope recheck | — | bound `RequestId` re-checked with `RequestAccessPolicy` (401) | `AttachFileController.cs:85-89,606-610` |

### 7.4 View / download / missing file

| Rule | Source |
|---|---|
| `ReviewPDF(Id)` (used by grids): read permission by the row's group; legacy rows (`SystemVersion=0`) use `root\GROUP\ID_n\DocumentName\FileName`, new rows flat; content type from allowlist of the file name (pdf/jpg/jpeg/png/gif/doc/docx); streamed with `File(path, type)` (no disposition → browser decides: PDF/images inline). Row missing → 404. | `Controllers/AttachFileController.cs:509-530`, `Security/AttachFileViewer.cs:22-62` |
| `ReviewAttachFile(Id)`: flat layout variant (InformMove). | `AttachFileController.cs:532-552` |
| File not found / path rejected / disallowed type → redirect `NoFileExist?fileName=<DocumentName>` → popup layout page "ไม่พบไฟล์ที่ต้องการค้นหา : <name>". | `AttachFileController.cs:529,551,554-558`, `Views/Shared/NoFileExist.cshtml:1-20`, `App_GlobalResources/DisplayName.resx:705` |
| `NoIdFileExist(Id)` → "ไม่พบไอดี {Id}" (format "ไม่พบไอดี {1}" with arg 0 = "0"). | `AttachFileController.cs:560-564`, `Views/Shared/NoIdFileExist.cshtml:17`, `DisplayName.resx:708` |

### 7.5 Delete

| Rule | Source |
|---|---|
| `Delete(selectedRecord[])` and `deleteFileRequestDoc(selectedRecord[])`: POST + anti-forgery, `RQ01 DELE`; **all-or-nothing** check per row (row exists, group 9 for the request variant, group permission Remove, request scope); any denial → `unauthorizeMessage` "ไม่มีสิทธิลบข้อมูล" (client shows "ผู้ใช้นี้ไม่มีสิทธิในการลบข้อมูล"); invalid → `Unsuccess`. | `AttachFileController.cs:625-751`, `Security/AttachFileAccess.cs:56-91`, `Scripts/cdss.js:76-89` |
| Generic delete removes the document folder (only if it resolves under root) and the DB row; for group 0 also deletes the matching TRADER_DOC row. Request-doc delete calls `BLAttachFile.DeleteAttachFile` with the REQUEST_DOC row. | `AttachFileController.cs:653-663,708-732` |

### 7.6 Lookups used by type Entry pages

| Action | Rule | Source |
|---|---|---|
| `Request/_GetRequestByLicenseNo(licenseNo)` (POST) | returns `{requestId}` or `""`; no permission attribute (login only) | `Controllers/RequestController.cs:373-379` |
| `Request/_GetAttachFileByLicenseNo(licenseNo, AttachGroup, traderId)` | TraderExpand / TraderOpen → `{licenseNo: <record id>}` (misnamed), else `{result:"fail"}`; login only | `RequestController.cs:380-397` |
| `Request/_GetRequestByDocumentNo(DocumentNo)` | `{requestId}`; login only | `RequestController.cs:398-404` |

---

## 8. Request documents page — `/RequestDoc/Upload` ("เอกสาร…ประกอบคำขอ")

Opened from each type's Entry page (new tab or same tab) with `TraderId, RequestId, RequestMode, AttachGroup=<controller>, Type` (`Views/RequestImport/Entry.cshtml:774` Type 2, `Views/RequestMove/Entry.cshtml:1212` Type 5, `Views/RequestSaleDom/Entry.cshtml:2000` Type 3, `Views/RequestSaleInt/Entry.cshtml:1130` Type 1, `Views/RequestPlantEst/Entry.cshtml:1599` and `Views/RequestLocChk/Entry.cshtml:487` **without RequestMode/Type**).

### 8.1 Rules

| Rule | Source |
|---|---|
| Class-level `RequestAccessFilter(RecordKind=RequestDoc)`; GET `RQ01 ACCE`, POST `RQ01 INST`. | `Controllers/RequestDocController.cs:58,238,302` |
| Header: "<TraderName> >> ข้อมูลเอกสาร" (title overwritten; earlier "เอกสารของผู้ประกอบการ"); `ปิด` returns to `<AttachGroup>/Entry?traderId=&requestId=` only if AttachGroup ∈ {RequestImport, RequestLocChk, RequestMove, RequestPlantEst, RequestSaleDom, RequestSaleInt}, else Home/Index. | `RequestDocController.cs:204-232,252-263`, `App_GlobalResources/DisplayName.resx:624` |
| Section 1 "เอกสารนำเรียน": grid of group-10 attachments of this request (`_UploadLicenseInform`, request-scoped, page size clamped): view icon (if size ≠ 0) → `RequestDoc/ReviewAttachmentFilePath`, ชื่อเอกสาร, ขนาดไฟล์ (MB), ประเภทไฟล์, column titled "มีข้อมูล" showing `ไม่มีข้อมูล`/`มีข้อมูล`. | `Views/RequestDoc/Upload.cshtml:41-90`, `RequestDocController.cs:506-541` |
| Section 2 "เอกสารประกอบคำขอ": Type 3 (SaleDom) shows radio "ประเภทการขอซื้อ": `ขอซื้อกระสุนปืน` (P3 → Type 3) / `ขอซื้อวัตถุระเบิด` (P5 → Type 4); initial choice from existing request documents (option Document_P3/P5). | `Upload.cshtml:96-106,372-390,414-429`, `RequestDocController.cs:269-287` |
| Document checklist = master `Document` rows with `DOCUMENT_PURPOSE in (1,9,<Type>)` ordered by purpose, id; each row merged with the latest REQUEST_DOC (not deleted) and its attachment. | `RequestDocController.cs:103-201` |
| Columns: view icon (if `FileSizeMb != 0`) → `RequestDoc/ReviewAttachFile`, ลำดับ (row no.), ชื่อเอกสาร, วันที่เอกสาร, วันหมดอายุ (`dd/MM/yyyy` via GetThaiDate), สถานที่ออกเอกสาร ("จังหวัด : X ออกโดย : Y"), "มีข้อมูล" column (`ไม่มีข้อมูล`/`มีข้อมูล`), page size 30. | `Upload.cshtml:111-168` |
| **Lock rule**: read-only grid (no delete, no upload) when `RequestStatus >= 20 (Inform)` or `RequestMode == 1` (submitted via internet) or `RequestStatus == 5 (Sending)`; otherwise adds delete icon (→ `AttachFile/deleteFileRequestDoc`) and upload icon (popup `AttachFile/UploadRequestList`). | `Upload.cshtml:108,173-241,340-344` |
| Section 3 "ข้อมูลผู้ประกอบการ": trader documents (`TraderDoc/_TraderDoc`), page size 100, view icon → `ReviewAttachmentFilePath`. | `Upload.cshtml:245-304` |
| View endpoints: `ReviewAttachFile(Id)` only group 9; `ReviewAttachmentFilePath(Id)` only groups 0 and 10; other groups/unknown → `NoFileExist` (empty name); not found on disk → `NoFileExist?fileName=`. Both also enforce `AttachFileAuthorize(Read)`. | `RequestDocController.cs:442-501` |
| `_UpDate(DocumentId, RequestId)`: `NoDocument` / `Success` / `UnSuccess` → client messages "กรุณาเลือกชื่อเอกสาร", "ไม่พบไฟล์" + "กรุณาอัพโหลดไฟล์ก่อน". | `RequestDocController.cs:368-383`, `Upload.cshtml:311-339` |

### 8.2 Bugs

1. PlantEst and LocChk open the page without `RequestMode` → non-nullable `long RequestMode` binding fails → error page (`RequestDocController.cs:239`, `Views/RequestPlantEst/Entry.cshtml:1599`).
2. Missing/unknown `Type` → document query becomes `" ORDER BY …"` with no condition (invalid where) → empty/failed grid (`RequestDocController.cs:112-134`).
3. `_RequestDoc` requires `MA18` (TRADER_DOC) instead of `RQ01`; returns the whole list with no paging (`RequestDocController.cs:102,195-200`).
4. `fnSave` / `#DocumentRequestList` / `#TraderDoc` are referenced but never rendered → the metadata POST `Upload(model)` is unreachable from the UI; if called with no existing row it throws twice (NRE in try and in catch) (`Upload.cshtml:311-339,392-397`, `RequestDocController.cs:331-365`).
5. Delete icon `a.delete` is inert (no handler; binding commented out) (`Upload.cshtml:187,452-476`).
6. `ViewBag.DocumentRequest` / `ViewBag.Province` built but unused (`RequestDocController.cs:257-258`).

### 8.3 Generic CRUD screens (scaffolded, unlinked)

`RequestDoc/Index` (grid with edit/delete icons, columns Id, RequestId, DocumentId, ชื่อเอกสาร, เลขที่เอกสาร, issue district/province, issue/expiry date, create/update user & date; signer-scoped list), `Create`, `Edit`, `Delete` exist with `RQ01` permissions but no screen links to them (`Controllers/RequestDocController.generated.cs:55-322`, `Views/RequestDoc/Index.cshtml:35-118`, `Views/RequestDoc/Create.cshtml:24-80`, `Edit.cshtml`). `Delete` has no request-scope check beyond the class filter on `selectedRecord` (`RequestDocController.generated.cs:292-313`).

---

## 9. Inbox (`กล่องรับ`, "สถานะข้อมูลรับ") and Outbox (`กล่องส่ง`, "สถานะข้อมูลส่ง")

**Semantics:** these are **ebXML message-exchange logs** (data exchange with external agencies, e.g. customs), not a user notification inbox. There is no read/unread concept. Inbox = rows of the e-Licensing `Inbox` table with `DEPARTMENT_ID = 0`; Outbox = `VFoutbox` with `DEPARTMENT_ID = 1` (`Controllers/InboxController.cs:204`, `Controllers/OutboxController.cs:378`). Not in the live menu (§0.1). Entities and column labels come from the external `CDSS.DID.ELicensing.*` assemblies.

| Rule | Inbox | Outbox | Source |
|---|---|---|---|
| Permission | `IN01 ACCE` (all actions) | `OU01 ACCE` (incl. Resend/Retry) | `InboxController.cs:70,89,115,157`; `OutboxController.cs:103,122,146,200,257,289` |
| Search panel (MessageExchange mode) | ข้อมูลจากวันที่ / ถึงวันที่ (RECEIVED_DATE), ข้อมูลเลขที่ (`KEY_FIELD1 LIKE`), ชนิดข้อมูล (MESSAGE_TYPE LIKE), สถานะข้อมูล (STATUS LIKE), `ค้นหา`; default item "-- เลือกทั้งหมด --" | same on SENT_DATE | `Views/Shared/_BrowseControlPanel.cshtml:56-75`, `InboxController.cs:202-230`, `OutboxController.cs:376-407`, `App_GlobalResources/DisplayName.resx:486` |
| Sort | `Received_Date DESC` | `Create_Date desc` | `InboxController.cs:124`, `OutboxController.cs:154` |
| Columns | ReceivedDate, MessageTypeDescription, KeyField1, KeyField2, EbxmlSenderId, FileName (XML icon link → `InboxViewXml` new tab when FileName ≠ null), FileSizeKb, MessageStatusDescription, ReceivingPkiTimestamp, ReceivingPkiError | checkbox (+check-all), SentDate, MessageTypeDescription, KeyField1 (labelled ReferenceId), EbxmlRecipientId, FileName (XML link → `OutboxViewXml`), FileSizeKb, MessageStatus, SentDate again (`dd/MM/yyyy h:mm:ss`), ErrorCode | `Views/Inbox/Index.cshtml:41-94`; `Views/Outbox/Index.cshtml:53-106` |
| Actions | — | Toolbar `สร้างข้อมูลเพื่อส่งใหม่` (Resend) and `ส่งข้อมูลเดิมซ้ำ` (Retry): none selected → "กรุณาระบุข้อมูลที่ต้องการ"; confirm (Yes/Cancel); cancel → "ยกเลิก"; result swal shows "Success." or per-row errors ("Invalid record.", "Record not found: n"); unauthorized → "ผู้ใช้นี้ไม่มีสิทธิทำรายการ" | `Views/Outbox/Index.cshtml:45-49,131-264`, `OutboxController.cs:257-320`, `App_GlobalResources/DisplayName.resx:699-703`, `MessageDisplay.resx:375-385` |
| View XML | `text/xml` from `FilePath\FileName`; missing → `NoFileExist`; bad/unknown id → `NoIdFileExist`. No DEPARTMENT check. | same, but only rows with `DepartmentId == 1` | `InboxController.cs:157-197`; `OutboxController.cs:200-252` |
| Missing page | Both branches show "ไม่พบไอดี {name}" (`Exchange_NoIdFileExist_NotFoundFile`) — the "file not found" branch shows the wrong message. | same | `Views/Inbox/NoFileExist.cshtml:10-18`, `Views/Outbox/NoFileExist.cshtml:10-18` |

Bugs: POST resets the search form (`ViewData.Model = new SearchModel()`) so filters appear cleared after searching (`InboxController.cs:95`, `OutboxController.cs:128`); Outbox dropdowns use the **Inbox** message-type and status lists (outbox-specific builders exist but are unused) (`OutboxController.cs:61-80` vs `477-491`); Retry confirm title uses the Resend text "ต้องการ สร้างข้อมูลเพื่อส่งใหม่ ใช่หรือไม่?" (`Views/Outbox/Index.cshtml:145`); `SearchValue`/`MessageType`/`Status` concatenated into SQL; Inbox `beforeOpenReportPreview` references a non-existent `WebReportInbox.aspx` and is never called (`Views/Inbox/Index.cshtml:107-123`); Inbox source is TIS-620 encoded with mojibake in `GetTimeList` (`InboxController.cs:242-244`).

---

## 10. Request-type controllers — how each enters approval/signing

Common pattern for all type Entry pages: `Entry(traderId, requestId)` is guarded by `RequestAccessFilter(SignerScopeOnly=true)`; for types with e-sign support the controller looks up the current user's latest `T_T_REQUEST_APPROVAL` row (by `AUTHORIZE_PERSON_ID`, `ORDER BY REVISION_NO DESC`), puts its id in `ViewBag.requestApprovalId`, and sets `EnableSign = true` only when that row's `ApprovalStatus == 0` (pending). `_DataControlPanel` then shows `ตรวจสอบ/ลงนาม` which calls `SignRequest()` → `RequestApproval/_ReviewSignRequest` (`Views/Shared/_DataControlPanel.cshtml:85-136`, `Views/RequestMove/Entry.cshtml:2209-2214`). License PDFs are Stimulsoft `.mrt` reports; when `Request.SignatureType == 1` and the level-20 approver (`ผู้ตรวจสอบและลงนาม`) has `ApprovalStatus == 1`, the signer's `AuthorizePerson` (incl. signature image) is injected into the license report; otherwise an empty AuthorizePerson. Report actions require `RP01 PRIN` but have **no request-scope filter** (listed as an open follow-up in `../Tests/SPF.SSPF.Tests/Authorization/R04_SspfRequestScopeSweepTests.cs:21-83`).

| Code | Thai name | Controller (program) | Entry access | Signer can sign here? | Documents/PDFs generated (report file) | Type-specific signing condition | Sources |
|---|---|---|---|---|---|---|---|
| 0 | คำขอรับหนังสือตรวจสอบประวัติ กรรมการ และผู้ถือหุ้น | RequestBgChk (RQ02) | SignerScopeOnly | No (no approval lookup) | `rptRequestBgChkPer.mrt` (พิมพ์คำขอตรวจสอบประวัติ), `rptRequestBgChk.mrt` (พิมพ์หนังสือขอตรวจสอบประวัติ) | none; staff status dropdown + `ปรับปรุงสถานะคำขอ` in panel | `Controllers/RequestBgChkController.cs:375-376,957-1080`, `_DataControlPanel.cshtml:95-98,158-172` |
| 1 | คำขอตรวจโรงงานผลิตอาวุธของเอกชน | RequestLocChk (RQ03) | SignerScopeOnly | No | `rptRequestLocChk.mrt` (พิมพ์คำขอตรวจสอบโรงงาน) | none | `Controllers/RequestLocChkController.cs:177-178,618-658`, `_DataControlPanel.cshtml:99-101` |
| 2 | คำขอรับใบอนุญาตประกอบกิจการโรงงานฯ (อ.1, อ.3, อ.20) | RequestPlantEst (RQ04) | SignerScopeOnly | Yes (`EnableSign` when pending) | Request: `rptRequestPlantEst1/3/20.mrt` (by form); License (อ.2): `rptRequestPlantEst2.mrt` or `rptRequestPlantEst2ForSubstitute.mrt`; receipt `rptReceipt1.mrt`; checklist `rptRequestPlantEstChecklist.mrt` | License report does **not** embed the e-signer (no SignatureType branch). Signature-process choice for renew (`RENEW_OPTION R`) / substitute exists only in RequestController's list builder. | `Controllers/RequestPlantEstController.cs:883-884,1074-1084,1537-1874`, `Controllers/RequestController.cs:323-331` |
| 3 | คำขออนุญาตขนย้ายวัตถุหรืออาวุธฯ (อ.9) | RequestMove (RQ06) | SignerScopeOnly | Yes | Request `rptRequestPlantEst9.mrt`; License (อ.10) `rptRequestMove10.mrt`; inform checklist `rptChecklistMove.mrt` | **Only type with the in-SSPF signing-method popup** (§6). License embeds signer if SignatureType=1 and level-20 approved; if two requests share the ReferenceNo (move created from a SaleDom), the signer is taken from the **type 5** request's approval. | `Controllers/RequestMoveController.cs:601-602,847-857,1297-1615`, `Views/RequestMove/Entry.cshtml:1569-1607` |
| 4 | คำขออนุญาตสั่งหรือนำเข้ามาฯ (อ.4) | RequestImport (RQ05) | SignerScopeOnly | Yes | Request `rptRequestImport4.mrt`; License `rptRequestImport8.mrt`; item list `rptVRequestDtlImport.mrt` | License embeds level-20 signer when SignatureType=1 & approved | `Controllers/RequestImportController.cs:89-90,258-268,1052-1248,1282-1301` |
| 5 | คำขออนุญาตขายหรือจำหน่ายฯ ในราชอาณาจักร (อ.15) | RequestSaleDom (RQ08) | SignerScopeOnly | Yes | Request `rptRequestPlantEst15.mrt` + move request `rptRequestPlantEst9.mrt`; License `rptRequestPlantEst17.mrt` (อ.17) + move license `rptRequestMove10.mrt`; checklist `rptChecklistMove.mrt` | License (17) and paired move license (10) embed level-20 signer when SignatureType=1 & approved. Panel buttons "พิมพ์แบบคำขอ อ.9,อ.15" / "พิมพ์หนังสืออนุญาต อ.10,อ.17". | `Controllers/RequestSaleDomController.cs:620-621,846-856,1405-1702,1838-2056`, `_DataControlPanel.cshtml:113-120` |
| 6 | คำขออนุญาตขายหรือจำหน่ายฯ โดยการส่งออกไปนอกราชอาณาจักร (อ.14) | RequestSaleInt (RQ07) | SignerScopeOnly | Yes | Request `rptRequestSaleInt14.mrt` + `rptRequestPlantEst9.mrt`; License `rptLicenseSaleInt16.mrt` (อ.16) + `rptRequestMove10.mrt`; checklist `rptChecklistImportSaleInt.mrt` | same as 5. Panel "พิมพ์แบบคำขอ อ.9,อ.14" / "พิมพ์หนังสืออนุญาต อ.10,อ.16". | `Controllers/RequestSaleIntController.cs:94-95,309-319,1455-1970,2003-2010`, `_DataControlPanel.cshtml:129-136` |
| 7 | รายงานแสดงบัญชีรับจ่าย (อ.11) | RequestLedger (RQ09) | SignerScopeOnly | No | `rptRequestLedger11.mrt` (print button text from `PrintLedgerText`) | none | `Controllers/RequestLedgerController.cs:164-165,753-798`, `_DataControlPanel.cshtml:102-104` |
| — | Sub-records | RequestPer (persons, RQ01), RequestDtl (items, RQ01), RequestDtlSaleDom/RequestDtlProducer (RQ08), RequestDtlSaleInt (RQ07), RequestBgChkRef (RQ02) | class/action `RequestAccessFilter` with RecordKind mapping | n/a | none | none | `Controllers/RequestPerController.cs:50`, `Controllers/RequestDtlController.cs:61`, `Controllers/RequestDtlProducerController.cs:78-463`, `Controllers/RequestDtlSaleDomController.cs:51`, `Controllers/RequestDtlSaleIntController.cs:81`, `Controllers/RequestBgChkRefController.cs:102` |

Other per-type facts the signer sees in the Entry header (`_DataControlPanel` status box): "ฟอร์มคำขออนุญาต: อ.9 / อ.4 / อ.15 / อ.14 / @FormName" and "สถานะ: <type status desc>" (`Views/Shared/_DataControlPanel.cshtml:181-230`); audit box "สร้างเมื่อ" / "ปรับปรุงล่าสุด" (`_DataControlPanel.cshtml:151-157`).

Types 8/9/50–53 (open/expand production line, plant change, committee change) appear only in the new `RequestInfo` page (form types 4–7) via the back-end API; SSPF has no Entry controller for them.

---

## 11. Dead / orphan code in scope (do not port as-is)

| Item | Why dead | Source |
|---|---|---|
| `Views/Request/Edit.cshtml` | Edit actions commented out | `Controllers/RequestController.generated.cs:172-265` |
| `Views/Request/RequestBgCheck.cshtml` | No `RequestBgCheck`/`_RequestBgChk`/`RequestBgCheckEdit` action; still linked from CompanyFactory/ControlOfficer index (would 404) | `Views/CompanyFactory/Index.cshtml:71`, `Views/ControlOfficer/Index.cshtml:71` |
| `Views/Request/_SearchRequest.cshtml` | Reads non-existent `Request/_SearchRequest`; data function name mismatch (`additionalRequestParams` vs defined `additionalLicenseParams`) | `Views/Request/_SearchRequest.cshtml:23,67-72` |
| `Views/Request/_PaymentTypeSelection.cshtml` + `_EPaymentTypeSelect` | Not referenced; calls undefined `registerWithPayment`. (`_GetPaymentType` itself is used by Import/Move: เงินสด/เช็ค=0, NSW E-Payment=1, Bill Payment=2.) | `Views/Request/_PaymentTypeSelection.cshtml:21-36`, `Controllers/RequestController.cs:1321-1332`, `../BC/Resources/DisplayName.resx:6886-6893` |
| `_DocumentControlPanel`, `_RequestControlPanel`, `_RefLicenseControlPanel` | Not used by any view; contain hard-coded test data (e.g. "บริษัท อัสพรรณ เอ็กซ์โพลซีฟ", "1/2560") | `Views/Shared/_DocumentControlPanel.cshtml:15-22`, `_RequestControlPanel.cshtml:21-31` |
| `RequestController.GetWhereClauseReguestPlantEst`, `GetFormType` | Unused; malformed SQL | `Controllers/RequestController.cs:527-575` |
| `RequestInfo.cshtml` helpers `bindTable`, `bindEach` (typos `roor`, `bindDataToFileds`) | Never called | `Views/Request/RequestInfo.cshtml:665-697` |

---

## 12. Consolidated bug / inconsistency list (for test cases)

| # | Area | Issue | Source |
|---|---|---|---|
| B1 | Request list | POST adds `REQUEST_TYPE='0'` → search returns only background-check requests | `Controllers/RequestController.cs:1383-1384`, `Models/SearchModel.cs:25` |
| B2 | Request list | GET vs POST form filter differ | `RequestController.cs:1385-1393` |
| B3 | Request list | End date excludes same-day records | `RequestController.cs:1377-1378` |
| B4 | Request list | Unescaped search text in SQL | `RequestController.cs:1355-1369` |
| B5 | Request list | Labels swapped/confusing (DocumentDate="วันที่รับเรื่อง", RegisterDate="วันที่คำขอ"); "อนุมัต" typo; contradictory "อนุมัติ ( ไม่อนุมัต )" | `Views/Request/Index.cshtml:88-99`, `../BC/Resources/DisplayName.resx:5608,5619` |
| B6 | Request list | `pageSize` used as pager ButtonCount | `Views/Request/Index.cshtml:122` |
| B7 | ViewRequest | Ledger → PlantEst; BgChk/LocChk blank; null id → 500 | `RequestController.cs:80-96` |
| B8 | RequestInfo | Form type fixed to 1 / "แบบ อ.1" | `RequestController.cs:1468,1488` |
| B9 | RequestInfo | Print buttons send `request_id=undefined`; `checking`/`endorse` endpoints missing; Back button also triggers print | `Views/Request/shared/_RequestDesc.cshtml:662-703`, `Views/Request/RequestInfo.cshtml:7` |
| B10 | RequestInfo | Only "other documents" grid previews; other doc icons inert | `_RequestDesc.cshtml:182,336,429,529,585` |
| B11 | RequestInfo | Duplicate column title "วันหมดอายุ" for issuer | `_RequestDesc.cshtml:177-179` |
| B12 | RequestInfo | Wrong/empty field bindings (`.capital_amount`, `data-field=""`, A3 uses `objective` for license numbers) | `_RequestDesc.cshtml:134`, `description/_descA3.cshtml:19,28,60` |
| B13 | RequestInfo | Signature timeline grid id collides with BG-check grid | `shared/_ApproveCheck.cshtml:4`, `shared/_ResultCheck.cshtml:98` |
| B14 | RequestInfo | Meeting header fields never loaded; default meeting result "ไม่เห็นชอบ" | `RequestInfo.cshtml:566-627`, `_ResultCheck.cshtml:446-451` |
| B15 | RequestInfo | Change-factory/committee: license and endorsement icons open the same token; raw token in onclick | `description/_descChangeFactory.cshtml:42-53` |
| B16 | Sign popup | Process grid not filtered; `closeEntryWindow` uses undefined `data`; `onSignatureProcessChange` undefined `e`; substitute filter wrong column | `Views/RequestMove/Entry.cshtml:1550-1563,2194-2200`, `RequestController.cs:329-330` |
| B17 | Attach | `.doc` accepted but stored as `.docx`; `_Upload` accept hint lacks docx | `Controllers/AttachFileController.cs:349,415-424`, `Views/AttachFile/_Upload.cshtml:23` |
| B18 | Attach | Request-doc invalid-file path returns a non-existent view (500) instead of the Thai message | `AttachFileController.cs:103-109` |
| B19 | Attach | Grid delete icons have no handler | `Views/AttachFile/UploadFile.cshtml:51`, `Views/RequestDoc/Upload.cshtml:187` |
| B20 | Attach | Function text for TraderDoc is "0" | `AttachFileController.cs:973-976` |
| B21 | RequestDoc | PlantEst/LocChk open without `RequestMode` → error; missing `Type` → bad SQL | `Controllers/RequestDocController.cs:113-134,239` |
| B22 | RequestDoc | `_RequestDoc` uses MA18 permission; unpaged | `RequestDocController.cs:102,195-200` |
| B23 | Inbox/Outbox | Search form cleared after POST; Outbox uses Inbox lists; Retry confirm text says Resend; "file not found" page shows "ไม่พบไอดี" | `Controllers/InboxController.cs:95`, `Controllers/OutboxController.cs:61-80,128`, `Views/Outbox/Index.cshtml:145`, `Views/Inbox/NoFileExist.cshtml:10-18` |
| B24 | Security | Type report actions (`ReportRpt*`/`GetReport*`) not request-scoped for signers; `Request/_GetRequestBy*` and `ViewRequest` have login-only checks | `../Tests/SPF.SSPF.Tests/Authorization/R04_SspfRequestScopeSweepTests.cs:21-83`, `Controllers/RequestController.cs:74,373-404` |
| B25 | Data | `RequestTypeDescription` throws for unregistered types (8/9/50–53) | `../BC/View/Transaction/VRequest/VRequest.cs:75-81` |

---

## 13. Notes for the Next.js redesign (derived, not legacy behaviour)

- One request-detail route should replace both ViewRequest→Entry and RequestInfo; derive the form type from the request (legacy hard-codes 1).
- Keep: signer scoping (list + detail), back-end-decided file permission with the two fixed messages ("ไม่พบไฟล์เอกสาร", "ไม่มีสิทธิ์ดูไฟล์นี้"), magic-byte + allowlist preview rules, inline only for PDF/JPEG/PNG/GIF, attachment+CSP sandbox for others, PDF-only reports.
- Make every document row previewable in the side pane (legacy: only "อื่นๆ"); show "กรุณาเลือกไฟล์เพื่อเปิดดู" as the empty state.
- Signature timeline: columns ลำดับ / วันที่อนุมัติ / สถานะการอนุมัติ / ชื่อ-นามสกุล ผู้อนุมัติ / ตำแหน่ง / ลำดับการลงนาม / รายละเอียด; status 0/1/2 = รออนุมัติ/อนุมัติ/ไม่อนุมัติ; level 20 = ผู้ตรวจสอบและลงนาม. Sign button only when the current user's latest-revision row is pending (status 0).
- Inbox/Outbox are system message-exchange monitors, not user inboxes; scope them out of the signer UI unless required.
