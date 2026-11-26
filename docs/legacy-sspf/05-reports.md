# E. Reports (SSPF staff web app)

Source root for every citation: `D:\AI\E-sign\Old source code\did-spf\SSPF` (paths below are relative to it; `../BC/...` means the sibling `did-spf\BC` project).
Citations are `path:line` or `path:start-end`. "mrt" = Stimulsoft report template under `Content/Report/`.

Read in full: `Controllers/ReportController.cs` (1773 lines), all 36 files in `Views/Report/`, both files in `Models/Report/`, all 8 `Report/WebReport*.aspx(.cs/.designer.cs)`, the 19 `.mrt` templates the controller loads, plus the supporting menu, auth, binder, layout and config files cited.

---

## E.1 Summary for the redesign team

| # | Finding | Evidence |
|---|---|---|
| 1 | In the SSPF menu the **"รายงาน"** group has **one** item: **รายงานสรุปการตรวจสอบและลงนาม** (`Report/ReportSignatureVerification`). This is the only report a staff user can reach from the UI. | `Menu.th-TH.sitemap:5-7`, `Menu.sitemap:5-7`, `Global.asax.cs:71` |
| 2 | `ReportController` has 17 more report filter screens (form summaries อ.1/อ.3/อ.20, อ.4, อ.9, อ.14, อ.15, ทะเบียนรับ/ส่งเรื่อง, อ.8, อ.10, อ.12, อ.13, buyer units, invoice, receipt, and fee reports) plus a trader-history viewer. No SSPF menu item or link points to any of them; you can only open them by typing the URL. They look like copies from the ISPF/UI.Web apps (ISPF's menu lists `ReportSumLedgerRawMaterial`/`ReportSumLedgerWeapon`). | `../ISPF/Menu.th-TH.sitemap:15-16`; no other `controller="Report"` node in SSPF sitemaps |
| 3 | The 8 `Report/WebReport*.aspx` pages, including **WebReportApprovalProcess**, are dead scaffolding. They are not in `UI.Web.csproj`. Their `.mrt` files do not exist. Their code-behind has a syntax error. They cannot run. | E.4 |
| 4 | Signature report access uses an **allow-list of logins** in `T_S_OPTIONS` (`Sspf_Admin_Group`), not role/program permissions. Every other report uses program `RP01` + action `PRINT`. | `Controllers/ReportController.cs:1598,1610,1626`; `Constants/OptionCode.cs:10`; `Constants/ProgramCode.cs:118` |
| 5 | No report limits data by the user's department or by the traders the signer is assigned to. The trader dropdown lists all traders. | `Controllers/ReportController.cs:78-91` |
| 6 | Several legacy reports have bugs that break them in normal use (for example, the default state of รายงานสรุปการชำระค่าธรรมเนียม produces invalid SQL). See E.8. | E.8 |

---

## E.2 Report inventory and reachability

| Report (screen H3 title, verbatim) | Filter action / view | Viewer action / view | Data action | Template | In SSPF menu? |
|---|---|---|---|---|---|
| รายงานสรุปการตรวจสอบและลงนาม | `ReportSignatureVerification` / `Views/Report/ReportSignatureVerification.cshtml` | in-page Kendo grid (`_ReportSignatureVerification`) | `PrintReportSignatureVerification` (PDF stream) | `rptSignatureVerification.mrt` | **Yes**, `Menu.th-TH.sitemap:6` |
| แบบรายงานการสั่งหรือนำเข้ามาในราชอาณาจักรและเข้าโรงงานผลิต ซึ่งวัตถุเพื่อใช้ในการผลิตอาวุธ (monthly อ.1/อ.3/อ.20; the H3 title is wrong, see E.8) | `ReportSumRequestPlantEst` (`ReportController.cs:195`) | `ReportRptSumRequestPlantEst` | `GetReportSumRequestPlantEst` | `rptSumRequestPlant.mrt` | No |
| รายงานสรุปการขออนุญาต อ.1/ขอต่ออายุ อ.3/ขอรับใบแทน อ.20 สำหรับใบอนุญาตประกอบกิจการโรงงานผลิตอาวุธรายปี | `ReportSumPlantEst` (`:285`) | `ReportRptSumRequestPlantforYear` | `GetReportSumRequestPlantforYear` | `rptSumRequestPlantForYear.mrt` | No |
| รายงานสรุปการขออนุญาตสั่งหรือนำเข้ามาในราชอาณาจักรซึ่งวัตถุ สำหรับหน่วยงานมาตรา 7 (อ. 4) รายเดือน | `ReportSumRequestImport` (`:382`) | `ReportSumRptRequestImport` | `GetReportSumRequestImport` | `rptSumRequestImport.mrt` | No |
| รายงานสรุปทะเบียนรับเรื่อง | `ReportSumRequest` (`:466`) | `ReportRptSumRequest` (Type=1) | `GetReportSumRequest` | `rptSumRequestIn.mrt` or `rptSumRequestOut.mrt` | No |
| รายงานสรุปทะเบียนส่งเรื่อง | `ReportRequestSum` (`:479`) | `ReportRptSumRequest` (Type=2) | `GetReportSumRequest` | `rptSumRequestOut.mrt` | No |
| รายงานสรุปการขออนุญาตขนย้ายวัตถุหรืออาวุธที่ใช้ในการผลิตอาวุธ หรืออาวุธที่ผลิตขึ้นออกจากโรงงานหรือสถานที่เก็บ (อ.9) | `ReportSumRequestMove` (`:578`) | `ReportRptSumRequestMove` | `GetReportSumRequestMove` | `rptSumRequestMove.mrt` | No |
| รายงานสรุปการขออนุญาตให้ขาย หรือจำหน่ายอาวุธให้แก่บุคคลอื่นนอกจากหน่วยงานตามมาตรา 7 โดยการส่งออกไปนอกราชอาณาจักร (อ.14) | `ReportSumRequestSaleInt` (`:658`) | `ReportRptSumRequestSaleInt` | `GetReportSumRequestSaleInt` | `rptSumRequestSaleInt.mrt` | No |
| รายงานสรุปการขออนุญาตให้ขายจำหน่ายอาวุธให้แก่บุคคลอื่นนอกจากหน่วยงานตามมาตรา 7 ในราชอาณาจักร (อ.15) | `ReportSumRequestSaleDom` (`:739`) | `ReportRptSumRequestSaleDom` | `GetReportSumRequestSaleDom` | `rptSumRequestSaleDom.mrt` | No |
| รายงานสรุปการขออนุญาตให้ขาย … (อ.14) รายปี (the H3 says อ.14 but the data is อ.4 yearly, see E.8) | `ReportSumRequestImportForYear` (`:820`) | `ReportRptSumRequestImportforYear` | `GetReportSumRequestImportforYear` | `rptSumRequestImportForYear.mrt` | No |
| (trader history, no filter screen) | — | `ViewRptTraderHist` (`:907`) | `GetReportTraderHist` | `rptTraderHistory.mrt` | No (see E.8 #14) |
| รายงานสรุปหน่วยงานผู้ซื้อ | `ReportBuyerAuthority` (`:970`) | `ViewReportBuyerAuthority` | `GetReportBuyerAuthority` | `BuyerAuthority.mrt` | No |
| รายงานการออกหนังสืออนุญาตนำเข้าวัตถุหรืออาวุธ (แบบ อ.8) | `ReportSumLicenseImport` (`:1029`) | `ViewReportLicenseImport` | `GetReportSumLicenseImport` | `rptSumLicenseImport.mrt` | No |
| รายงานการออกหนังสืออนุญาตขนย้ายอาวุธ (แบบ อ.10) | `ReportSumLicenseMove` (`:1096`) | `ViewReportLicenseMove` | `GetReportSumLicenseMove` | `rptSumLicenseMove.mrt` | No |
| ตารางสรุปชนิด, ปริมาณการผลิต, ทดสอบ, เสียหาย, ใช้ไม่ได้ และคงคลังสุทธิ (อ.12) | `ReportSumLedgerRawMaterial` (`:1172`) | `ViewReportRptSumLedgerRawMaterial` | `GetReportSumLedgerRawMaterial` | `rptSumLedgerRawMaterial12.mrt` | No |
| ตารางสรุปชนิด, ปริมาณการผลิต, ทดสอบ, เสียหาย, ใช้ไม่ได้, ขนย้าย และคงคลังสุทธิ (อ.13) | `ReportSumLedgerWeapon` (`:1259`) | `ViewReportSumLedgerWeapon` | `GetReportSumLedgerWeapon` | `rptSumLedgerWeapon13.mrt` | No |
| รายงานสรุปข้อมูลใบแจ้งหนี้ | `ReportPaymentInformSummary` (`:1346`) | `ViewReportPaymentInformSummary` | `GetReportPaymentInformSummary` | `rptPaymentInformSummary.mrt` | No |
| รายงานสรุปข้อมูลใบเสร็จรับเงิน | `ReportReceiptSummary` (`:1413`) | `ViewReportReceiptSummary` | `GetReportReceiptSummary` | `rptReceiptSummary.mrt` | No |
| รายงานสรุปการชำระค่าธรรมเนียม | `ReportPaymentSummary` (`:1487`) | `ViewReportPaymentSummary` | `GetReportPaymentSummary` | `rptPaymentSummary.mrt` | No |

Menu mechanics:
- The menu is a Kendo Menu bound to the sitemap `Menu-<lang>` with `SecurityTrimming(true)` (`Views/Shared/_Menu.cshtml:7,18-25`). Trimming runs the action's `CustomAuthorize`, so users outside the allow-list should not see the item. A jQuery block then removes top-level items left with no children (`Views/Shared/_Menu.cshtml:29-41`) and hides the whole navbar if the menu is empty (`:42-45`).
- `Mvc.sitemap` (with "การเข้าใช้งานระบบ", "RptAuditLogon", …) is not registered. Only `Menu-en-US` and `Menu-th-TH` are (`Global.asax.cs:70-71`). Its Report actions do not exist in SSPF and can be ignored.

---

## E.3 รายงานสรุปการตรวจสอบและลงนาม (Signature Verification Summary): full specification

### E.3.1 Purpose
For **one** signing officer (เจ้าหน้าที่ตรวจสอบ/ลงนาม) and a date range, the report lists every approval step that officer **completed** (approved or rejected) at **any** approval level ("ผู้ตรวจสอบ" or "ผู้ตรวจสอบและลงนาม"). It counts passes and failures (`Controllers/ReportController.cs:1675-1678`). Results show in an on-screen grid, and the user can export a PDF.

### E.3.2 Access and entry

| Rule | Detail | Evidence |
|---|---|---|
| Menu path | รายงาน › รายงานสรุปการตรวจสอบและลงนาม | `Menu.th-TH.sitemap:5-6` |
| Page title / `<title>` | `รายงานสรุปการตรวจสอบและลงนาม` (also shown as the green H3) | `Views/Report/ReportSignatureVerification.cshtml:5,9,13` |
| Authorization (page, grid data, PDF) | `CustomAuthorize(OptionUserGroup = OPTION_CODE.SSPF_ADMIN_GROUP, ActionCode = PRINT)` on all three actions | `Controllers/ReportController.cs:1598,1610,1626` |
| Allow-list source | `T_S_OPTIONS` value for key `Sspf_Admin_Group`: a comma-separated list of logins | `Constants/OptionCode.cs:10`; `Attributes/CustomAuthorizeAttribute.cs:24-25` |
| Match rule | Trimmed, **case-insensitive** comparison against `User.Identity.Name` (the login name). The `ActionCode` (PRINT) is **ignored** for option groups: membership grants everything. | `Attributes/CustomAuthorizeAttribute.cs:182-188` |
| Comment vs code | The controller comment says "USER_ID" but the code compares the login name | `Controllers/ReportController.cs:1595` vs `Attributes/CustomAuthorizeAttribute.cs:186-187` |
| Not in list | The code first sets a redirect to `Account/Unauthorize` with `ไม่มีสิทธิสั่งพิมพ์ข้อมูล`, then overwrites it with a bare `HttpUnauthorizedResult` (401). The user lands on the forms-auth login redirect, not the message page. | `Attributes/CustomAuthorizeAttribute.cs:75-92,202-234`; `App_GlobalResources/MessageDisplay.th-TH.resx:180-181` |
| Password expired | Non-AJAX requests redirect to `Account/ChangePassword`. AJAX (grid) requests get JSON `{unauthorizeMessage:"กรุณาเปลี่ยนรหัสผ่าน"}`. | `Attributes/CustomAuthorizeAttribute.cs:97-118` |
| Global filters | The user must be logged in. POST requests (the grid read) pass the anti-forgery check by same-origin Origin/Referer; the page has no token input. Grid page size is capped at 100. | `App_Start/FilterConfig.cs:16,18,23`; `Scripts/cdss.csrf.js:1-3` |

### E.3.3 Filter fields

| Order | Label (verbatim) | Control / id | Type & source | Default | Required | Client rule & message (verbatim) | Evidence |
|---|---|---|---|---|---|---|---|
| 1 | วันที่ตรวจสอบลงนาม | Kendo DatePicker `StartDate` | date; max 31/12/5000, no min | **today** (`DateTime.Today`) | Yes | empty → `กรุณาเลือกวันที่ตรวจสอบลงนามให้ครบ` | view `:16-17`, `:106-108`; controller `:1602` |
| 2 | ถึง | Kendo DatePicker `EndDate` | date; max 31/12/5000 | **today** | Yes | empty → same message; StartDate > EndDate → `วันที่ตรวจสอบลงนามเริ่มต้นต้องไม่มากกว่าวันที่สิ้นสุด` | view `:18-19`, `:110-112`; controller `:1603` |
| 3 | ประเภทคำขอ | Kendo DropDownList `RequestType` (350 px) | int. Options: `ทั้งหมด`(0); 2 `คำขอรับใบอนุญาตประกอบกิจการโรงงานฯ (อ.1, อ.3, อ.20)`; 3 `คำขออนุญาตขนย้ายวัตถุหรืออาวุธฯ (อ.9)`; 4 `คำขออนุญาตสั่งหรือนำเข้ามาฯ (อ.4)`; 5 `คำขออนุญาตขายหรือจำหน่ายฯ ในราชอาณาจักร (อ.15)`; 6 `คำขออนุญาตขายหรือจำหน่ายฯ โดยการส่งอกไปนอกราชอาณาจักร (อ.14)` (resource typo "ส่งอก") | `ทั้งหมด` (model 0) | No | — | view `:21-27`; controller `:1715-1726`; `../BC/Enumerates/RequestType.cs:12-16`; `../BC/Resources/DisplayName.resx:2736-2749` |
| 4 | เจ้าหน้าที่ตรวจสอบ/ลงนาม | Kendo DropDownList `AuthorizePersonId` (300 px), `Filter("contains")` (type-ahead) | long. First option `-- กรุณาเลือก --`(0), then **all** `AuthorizePerson` rows, **including inactive** ("people who have left still have signing history"). Text = `PersonNamePrefix+PersonName+" "+PersonSurname`. Sorted by name+surname, **ignoring rank/prefix**, with Thai culture collation (Oracle ORDER BY puts leading vowels เ แ โ ใ ไ last). | `-- กรุณาเลือก --` | Yes | 0 or empty → `กรุณาเลือกเจ้าหน้าที่ตรวจสอบ/ลงนาม` | view `:28-35`, `:114-117`; controller `:1729-1742`; `../BC/Master/AuthorizePerson/AuthorizePerson.cs:38-44` |
| — | ค้นหา | button `#SearchSignatureButton` | — | — | — | runs validation (order: dates, then range, then officer) | view `:37`, `:125-130` |
| — | print icon (`print.png`, alt `พิมพ์รายงาน`, tooltip `Export Report (PDF)`) | link `#PrintSignatureReport`, right-aligned | — | — | — | runs the same validation, then opens the PDF in a new window | view `:44-46`, `:132-137` |

Validation popups use `swal(...)` (SweetAlert). Validation runs in the order shown and stops at the first failure (view `:102-119`).

### E.3.4 Search flow and grid

- The grid starts unbound (`AutoBind(false)`), so it stays empty until the user clicks ค้นหา (view `:51`).
- When ค้นหา passes validation, the heading `เจ้าหน้าที่ตรวจสอบ/ลงนาม : <name>` is filled with the dropdown's text (view `:42`, `:128`) and the grid reloads at page 1 (view `:129`).
- The grid read is a Kendo AJAX POST to `Report/_ReportSignatureVerification`. Its body is `{StartDate, EndDate, RequestType, AuthorizePersonId}`, with dates converted to Gregorian `yyyy-MM-dd` (view `:55`, `:84-100`, `:121-123`).
- Page size comes from `appSettings.pageSize` = **10** (`Controllers/ReportController.cs:1606`; `Web.config:35`). The pager shows 10 page buttons. The empty-grid message is `ไม่มีข้อมูล` (`DisplayName.Shared_NoRecord`) (view `:77`; `App_GlobalResources/DisplayName.th-TH.resx:426-427`).
- Paging happens **in memory on the server**. The server fetches all matching rows, then applies `Skip/Take` and returns `Total = list.Count` (`Controllers/ReportController.cs:1611-1624`). The grid has no sorting or filtering. Columns can be resized, and a single row can be selected, but selecting does nothing (view `:78-79`).
- Row key: `RequestApprovalId` (view `:54`).

Grid columns, in screen order:

| # | Header (verbatim) | Field | Format / notes | Evidence |
|---|---|---|---|---|
| 1 | ลำดับ | `RowNo` | centered, 60 px; continuous 1..N across the **whole result set** (computed before paging) | view `:59-61`; controller `:1683,1689` |
| 2 | ประเภทคำขอ | `RequestTypeName` (= view `REQUEST_TYPE_DESC`) | 300 px | view `:62`; controller `:1696` |
| 3 | เลขที่รับเรื่อง | `DocumentNo` | 130 px | view `:63`; controller `:1697` |
| 4 | วันที่คำขอ | `DocumentDateTH` | `dd/MM/yyyy`, Buddhist year | view `:64-65`; controller `:1699,1745-1750` |
| 5 | ผู้ประกอบการ | `TraderName` | flexible width | view `:66` |
| 6 | ผลการอนุมัติ | `ApprovalStatusName` | `ผ่าน` in **green** if `ApprovalStatus==1`, `ไม่ผ่าน` in **red** otherwise; centered | view `:67-70`; controller `:1686,1693` |
| 7 | เลขที่คำขอ | `RegisterNo` | 110 px | view `:71`; controller `:1700` |
| 8 | วันที่รับเรื่อง | `RegisterDateTH` | `dd/MM/yyyy` BE | view `:72-73`; controller `:1702` |
| 9 | ส่งไปยัง/ขายให้กับ | `BuyerName` | null shows as empty | view `:74-75`; controller `:1704` |

Remark (`ApprovalDescription`) is **not** shown in the grid. It is printed in the PDF only.

### E.3.5 Server data rules (shared by grid and PDF)

`GetSignatureVerificationList` (`Controllers/ReportController.cs:1666-1712`):

| Rule | Detail | Evidence |
|---|---|---|
| Guard | Returns an **empty list** (no error) when the model is null, `AuthorizePersonId <= 0`, or either date is `DateTime.MinValue`. The server does **not** reject start > end; that case just returns nothing. | `:1669-1670` |
| BE-year safety net | Any date with year > 2400 has `YearOffset` (543) subtracted | `:1672-1673`, `:1753-1759` |
| Source | `BLRequestApproval.FindVRequestApproval(where, "APPROVAL_DATE, DOCUMENT_DATE", 0)` → view `V_REQUEST_APPROVAL` | `:1682`; `../BL/Transaction/BLRequestApproval.cs:111-115` |
| Filter: officer | `AUTHORIZE_PERSON_ID = <selected>` | `:1677` |
| Filter: status | `APPROVAL_STATUS IN (1,2)`: Approve and Reject only. `Wait (0)` is excluded. | `:1677-1678`; `../BC/Enumerates/ApprovalStatus.cs:10-12` |
| Filter: date | `APPROVAL_DATE` between `StartDate 00:00:00` and `EndDate 23:59:59` (inclusive whole days) | `:1677` |
| Filter: type | `REQUEST_TYPE = n` only when n > 0. `ทั้งหมด` applies no filter, so other types in the view (BgCheck 0, LocCheck 1, ledger 7, …) also appear. | `:1679-1680` |
| Order | `APPROVAL_DATE, DOCUMENT_DATE` ascending | `:1682` |
| Derived fields | `ApprovalStatusName` = `ผ่าน`/`ไม่ผ่าน`; `PassCount`/`RejectCount` = 1/0 for totals; `ApprovalDateKey` = `yyyyMMdd` for grouping; `*TH` = `dd/MM/yyyy` with Buddhist year | `:1686-1708` |
| Row model | `RptSignatureVerificationModel` (20 props). The same class is used for the grid and the mrt. | `Models/Report/RptSignatureVerificationModel.cs:11-33` |
| Filter model | `ReportModel` (`StartDate`, `EndDate`, `RequestType`, `AuthorizePersonId`, …) | `Models/Report/ReportModel.cs:17-23` |
| Max range | **None**. Any span is allowed and all rows load into memory. | — |

### E.3.6 PDF export (`PrintReportSignatureVerification`)

| Aspect | Behaviour | Evidence |
|---|---|---|
| Trigger | Print icon → `window.open($urlBase + "Report/PrintReportSignatureVerification?" + $.param(filter))`, a **GET with the filter in the query string**, in a new tab/window. It uses the current filter values even if ค้นหา was never clicked, so the PDF can differ from the grid. | view `:132-137` |
| Rendering | Loads `rptSignatureVerification.mrt`, registers the list, `Render(false)`, exports to PDF with default settings | controller `:1632-1654` |
| Response | `application/pdf`, `Content-Disposition: inline; filename=รายงานสรุปการตรวจสอบและลงนาม.pdf` (URL-path-encoded). The browser shows it inline; it is not downloaded. | controller `:1655-1656` |
| Error | Plain text `ไม่สามารถสร้างรายงานสรุปการตรวจสอบและลงนามได้ : ` + `ClientError.Message(ex)` (generic `เกิดข้อผิดพลาดในระบบ กรุณาติดต่อผู้ดูแลระบบ (รหัสอ้างอิง XXXXXXXX)` for system errors) | controller `:1659-1662`; `../BC/Constants/ClientError.cs:19,24-46` |
| Licence/fonts | Stimulsoft licence is set once in `Global.asax` (a comment warns that setting an old key here makes the PDF watermarked "Trial"). TTF fonts in `Content/ReportFonts` are registered at startup so PDFs look the same on every server. | controller `:1631`; `Global.asax.cs:46,58-63` |
| Variables | `vStartDate`, `vEndDate` = `dd/MM/yyyy` BE; `vRequestTypeName` = selected option text (`ทั้งหมด` for 0); `vAuthorizePersonName` = full name with prefix; `vPrintUser` = **login name** (`User.Identity.Name`), not the display name; `vPrintDate` = `dd/MM/yyyy(BE) HH:mm:ss` server time | controller `:1636-1648` |
| Paper | A4 **landscape**, margins 0.39 in, font TH SarabunPSK 14 (title 20 bold) | `Content/Report/rptSignatureVerification.mrt:67,780-783` (mrt Page1 block) |

PDF layout (`Content/Report/rptSignatureVerification.mrt`):

| Band | Content (verbatim) | Evidence (mrt line) |
|---|---|---|
| Page header (every page) | Title `รายงานสรุปการตรวจสอบและลงนาม`; `วันที่ตรวจสอบลงนาม {vStartDate} ถึง {vEndDate}`; `ประเภทคำขอ {vRequestTypeName}`; `ผู้ตรวจสอบและลงนาม {vAuthorizePersonName}` (the label differs from the screen's "เจ้าหน้าที่ตรวจสอบ/ลงนาม") | 74, 91-142, 159-176, 193-210 |
| Column header (page header band, repeats every page) | ลำดับ · ผลการอนุมัติ · เลขที่รับเรื่อง · ประเภทใบคำขอ · เลขที่คำขอ · วันที่ใบคำขอ · ผู้ประกอบการ · ส่งไปยัง/ขายให้กับ · หมายเหตุ | 241-409 |
| Group header, grouped by `ApprovalDateKey` (one group per approval day) | `วันที่ {ApprovalDateTH}` | 499, 507 |
| Data row | `{Line}` · `ApprovalStatusName` · `DocumentNo` · `RequestTypeName` · `RegisterNo` · `DocumentDateTH` · `TraderName` · `BuyerName` · `Remark` | 532-696 |
| Data sort | `ApprovalDateKey ASC, RowNo ASC` | DataBand1 `<Sort>` (≈ line 708-713) |
| Group footer | `รวม {Count} คำขอ [ผ่าน {Sum PassCount} ไม่ผ่าน {Sum RejectCount}]` (per day) | 733 |
| Report summary | `รวมทั้งหมด {Count} คำขอ [ผ่าน … ไม่ผ่าน …]` (grand total) | 761 |
| Page footer | `วันที่: {vPrintDate}` · `พิมพ์โดย: {vPrintUser}` · `หน้าที่ {PageNumber} จาก {TotalPageCount}` (right-aligned) | 436, 453, 471 |

How the grid and the PDF differ (decide deliberately in the redesign):
- The PDF has `หมายเหตุ` (the approval remark). The grid does not.
- The grid has `วันที่รับเรื่อง`. The PDF does not.
- Column order differs.
- The PDF groups rows by approval date and shows subtotals. The grid is a flat list.
- The PDF row number `{Line}` follows Stimulsoft's per-band line counter, which normally restarts in each group. The grid's `RowNo` runs continuously.
- The PDF calls the type column `ประเภทใบคำขอ` and the date column `วันที่ใบคำขอ`; the grid uses `ประเภทคำขอ` and `วันที่คำขอ`.

### E.3.7 Buddhist-year (พ.ศ.) handling, specific to this screen

| Layer | Behaviour | Evidence |
|---|---|---|
| App config | `YearType=BE`, `YearOffset=543`; `_yearOffset` is exposed to JS | `Web.config:48,50`; `Views/Shared/_Layout.cshtml:17-24`; `Global.asax.cs:45` |
| DatePicker | Custom `cdss.kendo.datepicker/calendar` shows BE years in the calendar while holding Gregorian `Date` objects; culture `th-TH` | `App_Start/BundleConfig.cs:44,49`; `Views/Shared/_Layout.cshtml:108`; `Scripts/kendo/2024/cdss.kendo.calendar.2024.js:17-19,448` |
| Client → server | `toGregorianIsoDate` subtracts 543 when year > 2400 (a typed BE year) and always sends `yyyy-MM-dd` CE | view `:83-91` |
| Server | `ToGregorianYear` subtracts `YearOffset` again when year > 2400 (the comment says `CustomModelBinder` only converts when the UI culture is th-TH) | controller `:1752-1759`; `Binder/CustomModelBinder.cs:92-103` |
| Output | All dates printed as `dd/MM/yyyy` with Buddhist year via `FormatDate.ToDateFormat(..., TH, BC)` | controller `:1744-1750` |

### E.3.8 Empty / error behaviour

| Case | Result | Evidence |
|---|---|---|
| No rows (grid) | Pager text `ไม่มีข้อมูล` | view `:77` |
| No rows (PDF) | Headers only, with an empty data band. The summary band should print `รวมทั้งหมด 0 คำขอ [ผ่าน 0 ไม่ผ่าน 0]` (Stimulsoft prints a ReportSummaryBand even with no data; not verified at runtime). | mrt 761 |
| Officer not chosen but URL called directly | Empty grid/PDF, no message | controller `:1669-1670` |
| AJAX unauthorized | 401 (the intended JSON `unauthorizeMessage` is overwritten, see E.3.2) | `Attributes/CustomAuthorizeAttribute.cs:89-92` |

### E.3.8a Behaviour to keep or change in Next.js
- Keep: default range = today..today; officer required; type optional (`ทั้งหมด`); inclusive whole-day range on approval date; inactive officers selectable; Thai-collation officer sort that ignores rank; pass/fail colouring; PDF grouping by approval day with per-day and grand totals; print footer (date, user, page n of m).
- Consider changing: server-side paging (instead of loading all rows and paging in memory); a maximum range; using the same columns in grid and PDF; printing the user's display name instead of the login; returning a proper 403 page.

---

## E.4 WebReportApprovalProcess and the other `Report/*.aspx` web reports

Files: `Report/WebReportApprovalProcess`, `WebReportBank`, `WebReportBankBranch`, `WebReportLicense`, `WebReportRequest`, `WebReportRequestBgChk`, `WebReportRequestLocChk`, `WebReportRequestPlantEst` (each `.aspx` + `.aspx.cs` + `.aspx.designer.cs`). All 8 code-behinds are the same template; they differ only in the BL class, entity, `.mrt` name and `RegData` alias.

| Aspect | WebReportApprovalProcess (others identical except entity) | Evidence |
|---|---|---|
| Page | WebForms page with one `StiWebViewer` (`stiPreview`), toolbar shown, zoom 100 %, `RenderMode=AjaxWithCache`, `CacheMode=Session` | `Report/WebReportApprovalProcess.aspx:13-22` |
| Export buttons | **Only CSV, PDF and Excel** are enabled; every other format is explicitly hidden | `Report/WebReportApprovalProcess.aspx:15-22` |
| Parameters | One query-string parameter `whereClauseEncode`, URL-decoded and passed **raw** as a SQL WHERE (`BLApprovalProcess.Find(searchValue)`). If absent → `GetAll()`. | `Report/WebReportApprovalProcess.aspx.cs:26,75-82` |
| Data | `ApprovalProcess` **master configuration** (`ApprovalProcessName`, `ProductTypeCode`, `LicenseFormId`, `Note1`, `IsActive`, `RenewOption`, `SubstituteOption`, audit fields). This is not the signing history. | `Report/WebReportApprovalProcess.aspx.cs:72-85`; `../BC/Master/ApprovalProcess/ApprovalProcess.generated.cs:143-742` |
| Report variables | `systemNameTh`, `systemNameEng`, `userName` (= login) | `Report/WebReportApprovalProcess.aspx.cs:87-89` |
| Template | `Content/Report/RptApprovalProcess.mrt`. **The file does not exist** (nor RptBank, RptBankBranch, RptLicense, RptRequest, RptRequestPlantEst). | `Report/WebReportApprovalProcess.aspx.cs:45`; `Content/Report/` listing |
| Error handling | Exceptions show a JS `alert()` of the sanitised message, or `MessageDisplay.TransferDataOverLimit` for HTTP-receive errors. `SetNoRecordMessageScript` (alert `No Record Found`) exists but is **never called**. | `Report/WebReportApprovalProcess.aspx.cs:52-61,100-107,121-130` |
| Status | **Dead / cannot run**: (a) not listed in `UI.Web.csproj` (no `Report\WebReport*` entries), so the code-behind is never compiled; (b) a stray `\` after `;` on line 26 of every `.aspx.cs` is a C# syntax error; (c) the namespace is `CDSS.DID.SPF.UI.Web.Report` (UI.Web project), not `SSPF`; (d) the `.mrt` files are missing; (e) no MVC auth filter would apply to a WebForms page. | `Report/WebReport*.aspx.cs:26`; `Report/WebReportApprovalProcess.aspx.cs:14`; `UI.Web.csproj` |

Redesign note: do **not** port these pages. If a printable "approval process configuration" list is wanted, specify it as a new feature with server-built filters (never a raw WHERE from the URL).

---

## E.5 Shared patterns of the legacy Stimulsoft reports (all 17 non-signature screens)

### E.5.1 Interaction pattern
1. The filter page renders inside the main layout. Its form `Html.BeginForm(..., Post)` with an anti-forgery token is **never submitted**; the only button is `type="button"` (`Views/Report/ReportSumRequestPlantEst.cshtml:6-8,47`, same in all filter views).
2. The button label is always `พิมพ์ใบสรุปรายงาน` (e.g. `Views/Report/ReportSumRequestPlantEst.cshtml:47`).
3. On click, jQuery reads the values, applies a minimal check, and opens a **new window** to the viewer action with query-string parameters (e.g. `Views/Report/ReportSumRequestPlantEst.cshtml:52-60`).
4. The viewer page shows `<h2>กรุณารอสักครู่</h2>` and an `StiMvcViewer` (e.g. `Views/Report/ReportRptSumRequestPlantEst.cshtml:9-39`). Page title is `ใบอนุญาตประกอบกิจการโรงงาน` (wrong for most reports) or `"ประวัติ" + ViewBag.HistoryType` (never set) (`Views/Report/ReportRptSumRequestPlantEst.cshtml:6`; `Views/Report/ViewReportLicenseImport.cshtml:6`).
5. The viewer calls `GetReport…` (data), `ViewerInteraction…` and `PrintReport…`. `ViewerEvent` is wired to the **GetReport** action, so viewer events re-run the query. No `ExportReport` action is set (e.g. `Views/Report/ReportRptSumRequestPlantEst.cshtml:15-21`).

### E.5.2 Viewer toolbar (identical in all 17 viewer views)
| Option | Value | Effect | Evidence |
|---|---|---|---|
| Theme | `Office2013WhiteViolet`, background #E8E8E8 | — | `Views/Report/ReportRptSumRequestPlantEst.cshtml:14,24` |
| FullScreenMode | true | Viewer fills the window | `:25` |
| ShowDesignButton | **true** | Shows a "Design" button (no designer action is configured) | `:32` |
| ShowPrintButton / PrintDestination | true / **Pdf** | Print = generate a PDF and print from the PDF viewer | `:33-34` |
| ViewMode | Continuous | Pages scroll continuously | `:35` |
| Export | Stimulsoft default Save menu (all formats; none restricted). Not verified at runtime: Stimulsoft 2019.3.6 with `ViewerEvent` mapped to GetReport. | `UI.Web.csproj:117-127` |

### E.5.3 Shared dropdown sources

| Dropdown | Options (verbatim) | Default | Evidence |
|---|---|---|---|
| ผู้ประกอบการ (`TraderId`) | `--กรุณาเลือก--` (null) + **all** traders by `TRADER_NAME ASC`; no scoping. The "please select" entry also means **all traders**. Type-ahead `contains`. | `--กรุณาเลือก--` | `Controllers/ReportController.cs:78-91`; `App_GlobalResources/DisplayName.resx:600-601` |
| เดือน (`Month`) | `--กรุณาเลือก--`(0), `มกราคม`(1) … `ธันวาคม`(12): **calendar** months | `--กรุณาเลือก--` | `Controllers/ReportController.cs:92-109` |
| ปี (`Year`) | `--กรุณาเลือก--`(null), then 22 entries from the current year down to current-21; **value = CE year, text = BE year** | `--กรุณาเลือก--` (no current-year default; no fiscal year) | `Controllers/ReportController.cs:111-126` |
| ประเภทคำขอ (`FormId`) | `เลือกทั้งหมด`(0) + `FormCode` of `LicenseForm` IDs 1, 3, 20 (the "all" entry is only added when forms exist) | first item (`SelectedIndex(0)`) | `Controllers/ReportController.cs:63-77,198` |
| ประเภทหน่วยงาน (`AuthorityGroupNo`) | `-กรุณาเลือก-`(0), `ทหาร`(1), `ตำรวจ`(2), `สมาคม`(3), `อื่นๆ`(9). Items 3 and 9 contain a trailing soft hyphen U+00AD. | `-กรุณาเลือก-` | `Controllers/ReportController.cs:127-136` |
| แบบฟอร์มสรุปรับเรื่อง (`TypeRegister`) | `แบบฟอร์มทะเบียน`(FormOut), `แบบฟอร์มภายในกอง กคร.`(FormIn) | first (FormOut) | `Controllers/ReportController.cs:137-143` |
| ช่องทางการชำระเงิน, invoice report | `--กรุณาเลือก--`("All"), `NSW`(N), `Bill-payment`(B) (cash commented out) | All | `Controllers/ReportController.cs:144-152` |
| ช่องทางการชำระเงิน, receipt report | `--กรุณาเลือก--`("All"), `เงินสด`(CSH), `เช็ค`("CHQ " with trailing space), `ใบสำคัญ`(DOC), `NSW`(NSW), `Bill-payment`(BIL) | All | `Controllers/ReportController.cs:153-163` |

### E.5.4 Date-range rules
| Pattern | Rule | Evidence |
|---|---|---|
| Month + Year reports (อ.1/3/20 monthly, อ.4, อ.9, อ.14, อ.15) | `DOCUMENT_DATE` from the 1st to the last day of the chosen **calendar** month. If month = 0 and year > 0, the whole calendar year (1 Jan–31 Dec). The report header variables `startDate`/`endDate` are always built with `new DateTime(year, month, 1)`, so **month 0 throws** → blank report. | `Controllers/ReportController.cs:168-190,245-248,421-424,619-622,697-700,778-781` |
| Year-only reports (อ.1/3/20 yearly, อ.4 yearly) | Crosstab from `Date1 = 1 Jan year` to `Date2 = Date1 + 12 months` (calendar year; **not** the Thai fiscal year Oct–Sep) | `Controllers/ReportController.cs:314-317,849-852` |
| From/To date reports (ทะเบียนรับ/ส่ง, อ.8, อ.10, อ.12, อ.13, invoice, receipt, fees) | DatePickers `ข้อมูลจากวันที่` / `ถึงวันที่`, max 31/12/5000, sent as `yyyy/MM/dd` with `kendo.toString`. **No start ≤ end check** and no maximum span. | e.g. `Views/Report/ReportSumLicenseImport.cshtml:22-25,37-38` |
| Inclusive end | Invoice, receipt and fee reports use `00:00:00`–`23:59:59`. The others compare `TO_DATE('yyyyMMdd')`, which is midnight, so rows with a time component on the end date are missed if the column has a time part. | `Controllers/ReportController.cs:1367,1434,1508` vs `:519,1054,1122,1195` |
| Defaults | `ReportModel.StartDate/EndDate` are never set for these screens (`DateTime.MinValue`), so the pickers start empty (below the Kendo minimum). Unlike the signature screen, there is no "today" default. | `Models/Report/ReportModel.cs:17-18` |
| Validation message | Every screen uses one message: `กรุณาเลือกข้อมูลให้ครบ` (swal) | e.g. `Views/Report/ReportSumRequestPlantEst.cshtml:60` |
| Ineffective date check | `kendo DatePicker.value()` returns `null` when empty, and `null != ""` is true, so the "required" check **never fires**. The URL gets an empty date, the non-nullable `DateTime` binding fails, and the new window shows an error page. | e.g. `Views/Report/ReportSumRequest.cshtml:44-48` |

### E.5.5 Buddhist-year handling in legacy reports
- Year dropdown: the user sees a BE year and the server receives a CE year (`Controllers/ReportController.cs:114-121`).
- Date pickers send `kendo.toString(date,"yyyy/MM/dd")` with **no** BE correction (unlike the signature screen). `CustomModelBinder` only fixes `dd/MM/yyyy` strings with year > 2500 (`Binder/CustomModelBinder.cs:24-33`), so a typed BE year would reach SQL as year 25xx.
- All printed dates are formatted in the mrt `GetValueEvent` with `FormatDate.ToDateFormat(..., TH, BC)`. Formats: `dd/MMM/yy` (request summaries), `MMM yy` / `yyyy` (period headers), `d MMMM yyyy` (range headers in อ.4, อ.15, อ.8, อ.10, อ.12, อ.13, invoice, receipt, fee), `d/MM/yyyy` (licence dates), `dd/MM/yyyy` (receipt dates) (`Content/Report/rptSumRequestPlant.mrt:77-99,360-370`, others per E.7).

### E.5.6 Access, scoping, empty and error behaviour
| Aspect | Rule | Evidence |
|---|---|---|
| Permission | Every action (filter, viewer, data, interaction, print) has `CustomAuthorize(ProgramCode = "RP01" REPORT_SUMMARY, ActionCode = PRINT)` | `Controllers/ReportController.cs:194-1589`; `Constants/ProgramCode.cs:118` |
| Department / signer scoping | **None.** All traders are listed, and the queries filter only by trader when one is chosen. | `Controllers/ReportController.cs:82` |
| Trader filter (monthly) | Appended to SQL (`TRADER_ID = n`); trader name printed as `{SortBy}` | `:223-227` |
| Trader filter (yearly) | Applied **in memory** after loading every trader | `:323-328,858-863` |
| Empty result | An empty list is registered, so the report renders with headers and no rows. There is no "no data" message. BuyerAuthority and License reports may register `null`. | e.g. `:230-233`; `:990-996`; `:1051-1062` |
| Exception | `catch { return null; }` → the viewer gets nothing (blank/error inside the viewer), and the user gets no message | e.g. `:258-262` |

---

## E.6 Report catalogue (legacy screens, one row each)

Columns: **Filters** list label (control, required?, default, client check). "All" = choosing `--กรุณาเลือก--`/`เลือกทั้งหมด` means no filter. Output = Stimulsoft viewer in a new window (print → PDF, Save/export via viewer) unless noted.

| Report (screen title) | View | Filters | Client validation | Data source (BL / view / rule) | Output | Evidence |
|---|---|---|---|---|---|---|
| Monthly อ.1/อ.3/อ.20 summary | `ReportSumRequestPlantEst.cshtml` | ผู้ประกอบการ (DDL, opt, All); ประเภทคำขอ (DDL FormId, opt, เลือกทั้งหมด); เดือน (DDL, req); ปี (DDL, req) | `Year != "" && Month != ""`, else `กรุณาเลือกข้อมูลให้ครบ`. Month "0" passes the check, then the server throws. | `BLRequest.FindRptSumRequestPlant(where)`; DOCUMENT_DATE in month; FORM_ID; header by formId (4 variants) | Viewer, A4 landscape | view `:13-61`; ctrl `:212-263` |
| Yearly อ.1/อ.3/อ.20 summary | `ReportSumPlantEst.cshtml` | ผู้ประกอบการ (opt); ประเภทคำขอ (req, **must not be เลือกทั้งหมด**); ปี (req) | `Year != "" && FormId != 0` | `BLRequestImport.FindPlantEstCtab(Date1, Date2, formId)`: per-trader × 12-month crosstab; trader filtered in memory | Viewer | view `:13-62`; ctrl `:303-358` |
| อ.4 monthly | `ReportSumRequestImport.cshtml` | ผู้ประกอบการ (opt); เดือน (req); ปี (req) | `Year && Month` | `BLRequest.FindRptSumRequestImport(where)`; DOCUMENT_DATE in month | Viewer | view `:18-61`; ctrl `:400-438` |
| อ.4 yearly (screen title says อ.14) | `ReportSumRequestImportForYear.cshtml` | ผู้ประกอบการ (opt); ปี (req) | `Year != ""` | `BLRequestImport.FindImportCtab(Date1, Date2)`; crosstab; trader filtered in memory | Viewer | view `:27-60`; ctrl `:838-881` |
| ทะเบียนรับเรื่อง | `ReportSumRequest.cshtml` | ผู้ประกอบการ (opt); แบบฟอร์มสรุปรับเรื่อง (DDL, default แบบฟอร์มทะเบียน); ข้อมูลจากวันที่ / ถึงวันที่ (req) | ineffective (E.5.4) | `BLRequest.FindRptSumRequestIn`; REGISTER_DATE in range AND REGISTER_DATE NOT NULL; FormIn → `rptSumRequestIn.mrt`, else `rptSumRequestOut.mrt`; header `รายงานสรุปทะเบียนรับเรื่อง` | Viewer | view `:13-52`; ctrl `:497-535` |
| ทะเบียนส่งเรื่อง | `ReportRequestSum.cshtml` | ผู้ประกอบการ (opt); dates (req) | ineffective | Same action, Type=2: REGISTER_DATE in range **AND INFORM_DATE NOT NULL** (range is on the register date, not the send date); always `rptSumRequestOut.mrt`; header `รายงานสรุปทะเบียนส่งเรื่อง` | Viewer | view `:13-41`; ctrl `:505-511,531-535` |
| อ.9 summary | `ReportSumRequestMove.cshtml` | ผู้ประกอบการ (opt); เดือน (req); ปี (req) | `Year && Month` | `BLRequestMove.FindRptSumRequestMove(where)` | Viewer | view `:19-62`; ctrl `:596-636` |
| อ.14 summary | `ReportSumRequestSaleInt.cshtml` | ผู้ประกอบการ; เดือน; ปี | `Year && Month` | `BLRequestSaleInt.FindRptSumRequestInt(where)` | Viewer | view `:18-61`; ctrl `:676-715` |
| อ.15 summary | `ReportSumRequestSaleDom.cshtml` | ผู้ประกอบการ; เดือน; ปี | `Year && Month` | `BLRequestSaleDom.FindRptSumRequestDom(where)` | Viewer | view `:18-61`; ctrl `:757-796` |
| Trader history | `ViewRptTraderHist.cshtml` (viewer only) | `histType`, `traderId` from the caller | — | `BLTraderOpen.FindVRptTraderHistory("TRADER_ID=… AND HIST_TYPE='…'", "ISSUE_DATE")` | Viewer | ctrl `:907-946`; `Views/Trader/IndexTrader.cshtml:485-490` |
| รายงานสรุปหน่วยงานผู้ซื้อ | `ReportBuyerAuthority.cshtml` | ประเภทหน่วยงาน (DDL, **req**) | `!= "0"` | `BLBuyerAuthority.Find("AUTHORITY_GROUP_NO = n", "AUTHORITY_NAME ASC")` | Viewer | view `:13-34`; ctrl `:984-1007` |
| อ.8 issued (import) | `ReportSumLicenseImport.cshtml` | ผู้ประกอบการ (opt); dates (req) | ineffective | `BLLicense.FindRptSumLicenseImport("LICENSE_NO IS NOT NULL AND ISSUE_DATE in range", "ITEM_NO ASC")` | Viewer | view `:13-41`; ctrl `:1045-1074` |
| อ.10 issued (move) | `ReportSumLicenseMove.cshtml` | ผู้ประกอบการ (opt); ประเภทหน่วยงาน (opt, `-กรุณาเลือก-`=All); dates (req) | ineffective | `BLLicense.FindRptSumLicenseMove(...)`, plus `AUTHORITY_GROUP_NO` when not 0 | Viewer | view `:13-53`; ctrl `:1113-1146` |
| อ.12 raw-material ledger summary | `ReportSumLedgerRawMaterial.cshtml` | ผู้ประกอบการ (**server-required**, client optional); dates (req) | ineffective; no trader check | `BLLedgerRawMaterial.FindVLedgerRawMaterial` → `TempLedgerSnapshot.Run` (per-trader temp rows inside one transaction, always rolled back) → `VSumLedgerRawMaterial`. Empty trader → exception → blank. | Viewer | view `:13-44`; ctrl `:1186-1234` |
| อ.13 weapon ledger summary | `ReportSumLedgerWeapon.cshtml` | as อ.12 | as อ.12 | `BLLedgerWeapon.FindVLedgerWeapon` → `TempLedgerSnapshot` → `VSumLedgerWeapon` | Viewer | view `:13-44`; ctrl `:1273-1321` |
| รายงานสรุปข้อมูลใบแจ้งหนี้ | `ReportPaymentInformSummary.cshtml` | ข้อมูลจากวันที่/ถึงวันที่ (req); ช่องทางการชำระเงิน (DDL, default All) | ineffective | `BLPaymentInform.FindVPaymentInform`; PAYMENT_INFORM_DATE whole days; `E_PAYMENT_METHOD` when not All | Viewer | view `:13-40`; ctrl `:1360-1388` |
| รายงานสรุปข้อมูลใบเสร็จรับเงิน | `ReportReceiptSummary.cshtml` | dates (req); ช่องทางการชำระเงิน (default All) | ineffective | `BLReceipt.FindRptReceipt`; RECEIPT_DATE whole days; `PAID_BY` when not All; computes NSW/BIL/CSH sums | Viewer | view `:13-40`; ctrl `:1427-1462` |
| รายงานสรุปการชำระค่าธรรมเนียม | `ReportPaymentSummary.cshtml` | dates (req); checkbox group `โปรดระบุข้อมูลที่ต้องการค้นหา*` T1–T6, **all checked on load** | ineffective; no "at least one" check | `BLReceiptDtl.FindVRptReceiptDtl`; RECEIPT_DATE whole days; FORM_ID sets: T1 {1,2,3,21,22,23}, T2 {9,10}, T3 {4,18}, T4 {15,17}, T5 {14,16}, T6 {20} OR-ed (broken, E.8 #1) | Viewer | view `:13-58`; ctrl `:1501-1573` |

Checkbox labels on the fee screen (verbatim, typos kept): T1 `คำขอนุญาตจัดตั้งโรงาน(อ.1)และหนังสืออนุญาตจัดตั้งโรงงาน(อ.2)`; T2 `คำขออนุญาตขนย้าย(อ.9)และหนังสืออนุญาตขนย้าย(อ.10)`; T3 `คำขออนุญาตสั่งนำเข้ามา(อ.4)และหนังสืออนุญาตนำเข้ามา(อ.8)`; T4 `คำขออนุญาตขายในราชณาอาจักร(อ.15)และหนังสืออนุญาตขายในราชณาอาจักร(อ.17)`; T5 `คำขออนุญาตขายนอกราชณาอาจักร(อ.14)และหนังสืออนุญาตขายนอกราชณาอาจักร(อ.16)`; T6 `คำขอใบแทนใบอนุญาต(อ.20)` (`Views/Report/ReportPaymentSummary.cshtml:21-31`).

---

## E.7 Printed layouts of legacy templates (key columns, grouping, sort)

| Template | Title / header text | Printed columns (verbatim) | Grouping / totals | Sort | Evidence |
|---|---|---|---|---|---|
| `rptSumRequestPlant.mrt` | `{Header}` + `ประจำเดือน` + month (`MMM yy` BE) | ลำดับที่ · เลขที่คำขอ · วันที่คำขอ · เลขทะเบียนรับ · วันที่รับ · ผู้ขออนุญาต · ขออนุญาตเพื่อ · เลขที่นำเรียน · วันที่นำเรียน · เลขที่ใบอนุญาต · วันที่ออกใบอนุญาต | none; row no. `{LineThrough}` | none | `Content/Report/rptSumRequestPlant.mrt:58-99,130-198,339-542` |
| `rptSumRequestPlantForYear.mrt` / `rptSumRequestImportForYear.mrt` | `{Header}` (or fixed อ.4 title) + `ประจำปี` + year (`yyyy` BE) | ลำดับที่ · ผู้ขออนุญาต · ม.ค. … ธ.ค. (each `จำนวน`) · รวม | footer `รวม` with sums per month | none | `rptSumRequestPlantForYear.mrt:59-921`; `rptSumRequestImportForYear.mrt:57-927` |
| `rptSumRequestImport.mrt` | อ.4 title (two lines), range `d MMMM yyyy`, `{SortBy}` | ลำดับที่ · เลขที่คำขอ · วันที่คำขอ · เลขทะเบียนรับ · วันที่รับ · ผู้ขออนุญาต · เลขที่นำเรียน · วันที่นำเรียน · เลขที่ใบอนุญาต · วันที่ออกใบอนุญาต | none | DocumentDate DESC, DocumentNo DESC | `rptSumRequestImport.mrt:61-487` |
| `rptSumRequestIn.mrt` (FormIn) | `{header}` + `ระหว่างวันที่` | ลำดับ · เลขที่รับเรื่อง · วันที่รับเรื่อง · เลขที่คำขอ · วันที่คำขอ · ประเภทขออนุญาต · ผู้ขออนุญาต · ผู้ซื้อ/ผู้รับ · การปฏิบัติ · หมายเหตุ | none | Id DESC | `rptSumRequestIn.mrt:60-478` |
| `rptSumRequestOut.mrt` | `{header}` + `ระหว่างวันที่` | ลำดับ · เลขทะเบียนรับเรื่อง · วันที่รับเรื่อง · ประเภทขออนุญาต · ผู้ขออนุญาต · การปฏิบัติ · หมายเหตุ | none | Id DESC | `rptSumRequestOut.mrt:61-288` |
| `rptSumRequestMove.mrt` | อ.9 title + `ห้วงวันที่` | ลำดับที่ · เลขที่คำขอ · วันที่คำขอ · เลขทะเบียนรับ · วันที่รับ · ผู้ขออนุญาต · ประเภทการขนย้าย · เลขที่นำเรียน · วันที่นำเรียน · เลขที่ใบอนุญาต · วันที่ออกใบอนุญาต | none | DocumentDate DESC, DocumentNo DESC | `rptSumRequestMove.mrt:58` |
| `rptSumRequestSaleInt.mrt` | อ.14 title + `ประจำเดือน` | ลำดับที่ · เลขที่คำขอ · วันที่คำขอ · เลขทะเบียนรับ · วันที่รับ · ผู้ขออนุญาต · ผู้ซื้อ · เลขที่นำเรียน · วันที่นำเรียน · เลขที่ใบอนุญาต · วันที่ออกใบอนุญาต | none | none | `rptSumRequestSaleInt.mrt:57` |
| `rptSumRequestSaleDom.mrt` | อ.15 title + range | … · ผู้ขออนุญาต · หน่วยผู้ซื้อ (`VBuyerNameList`) · … | none | DocumentDate DESC, DocumentNo DESC | `rptSumRequestSaleDom.mrt:58` |
| `rptTraderHistory.mrt` | `traderName` | ลำดับ · หนังสือที่ · อนุญาตให้ | group by IssueDate | IssueDate DESC | `rptTraderHistory.mrt:186` |
| `BuyerAuthority.mrt` | `ตารางหน่วยผู้ซื้ออาวุธ`, `หน้าที่ {PageNumberThrough} ใน {TotalPageCountThrough} หน้า` | ลำดับที่ · ชื่อหน่วยงานผู้ซื้อ (ชื่อย่อ / ชื่อเต็ม) · ที่อยู่ · ผู้มีอำนาจ/เจ้าของหน่วย | none | none | `BuyerAuthority.mrt:61` |
| `rptSumLicenseImport.mrt` | `รายงานการออกหนังสืออนุญาตนำเข้าวัตถุหรืออาวุธ (แบบ อ.8)` | เลขที่ อ.8 · วันที่อนุญาต · วันที่หมดอายุ · วัตถุที่อนุญาต · ประเภทสั่งนำเข้า · หมายเหตุ · ชื่อผู้ผลิต · ประเทศผู้ผลิต · ประเภท | group trader → (trader+licence) | LicenseNo DESC, ItemNo ASC | `rptSumLicenseImport.mrt:96,154,334` |
| `rptSumLicenseMove.mrt` | `รายงานการออกหนังสืออนุญาตขนย้ายอาวุธ (แบบ อ.10)` | เลขที่ อ.10 · วันที่อนุญาต · วันที่หมดอายุ · วัตถุที่อนุญาต · ที่อยู่ผู้รับอาวุธ · หน่วยผู้รับอาวุธ · หน่วยผู้ซื้อ | group trader → authority group → licence; quantity sums per group, `รวมทั้งหมด` | LicenseNo DESC, ItemNo ASC | `rptSumLicenseMove.mrt:105,163,209,354` |
| `rptSumLedgerRawMaterial12.mrt` | `รายละเอียดสรุป บัญชีเกี่ยวกับชนิด ปริมาณ และการรับจ่ายประจำวันของวัตถุหรืออาวุธที่ใช้ในการผลิตอาวุธ ตามแบบ อ.12` + trader | (1) ลำดับที่ … (16) หมายเหตุ (ยอดยกมา, รับเข้าคลัง, รวมรับ, จ่ายออก, ใช้ไป, เสียหาย, ใช้ไม่ได้, ไม่ได้ใช้, คงเหลือ, คงคลังสุทธิ, สถานที่เก็บ) + footnote definitions | none | ProductName, ProductControlId | `rptSumLedgerRawMaterial12.mrt:101` |
| `rptSumLedgerWeapon13.mrt` | `… ของอาวุธที่ผลิตขึ้น ตามแบบ อ.13` + trader | (2) ชื่ออาวุธ … (14) หมายเหตุ incl. ผลิต / ขนย้าย split | group by ProductGroupName, `รวม` | ProductName, ProductControlId | `rptSumLedgerWeapon13.mrt:101,521` |
| `rptPaymentInformSummary.mrt` | `รายงานสรุปใบแจ้งหนี้` / `การชำระค่าธรรมเนียมคำขอและใบอนุญาต ของ กคร.อท.ศอพท.` | ลำดับ · วัน/เดือน/ปี · หมายเลขใบแจ้งหนี้ · ชื่อบัญชี บริษัท/ห้างหุ้นส่วน/บุคคล · ช่องทางการชำระ · จำนวนเงินที่ต้องชำระ (THB) · สถานะการชำระเงิน (checkboxes รอการชำระ / ชำระแล้ว) | `รวมเป็นเงิน` | PaymentInformDate DESC, Code DESC | `rptPaymentInformSummary.mrt:61` |
| `rptReceiptSummary.mrt` | `รายงานสรุปข้อมูลใบเสร็จรับเงิน` | หมายเลขใบเสร็จรับเงิน · ใบแจ้งหนี้ · ชื่อบัญชี (บริษัท/ห้างหุ้นส่วน/บุคคล) · ช่องทางการชำระ (NSW / Bill-payment / เงินสด (CASH)) | `รวนเป็นเงิน` (typo), `โอนเข้าบัญชี`, `เงินสด (CASH)` totals | ReceiptDate DESC, ReceiptNo DESC | `rptReceiptSummary.mrt:68,533` |
| `rptPaymentSummary.mrt` | `รายงานสรุปการชำระค่าธรรมเนียม` / `คำขอและใบอนุญาต ของ กคร.อท.ศอพท.` | ประเภทใบอนุญาต ฯ (`Description เลขที่ DocumentNo`) · ราคา/ฉบับ (THB) · จำนวน (ฉบับ) · จำนวนเงิน (THB) | grand sum | ReceiptDate DESC, FormId ASC | `rptPaymentSummary.mrt:56` |

---

## E.8 Bugs and inconsistencies

| # | Issue | Impact | Evidence |
|---|---|---|---|
| 1 | Fee report WHERE builder: T1 and T5 append `"... or"` with **no trailing space**, producing `orFORM_ID` (invalid SQL) whenever T1 or T5 is followed by another checked box. All six boxes are checked by default, so **the default run fails**. All boxes unchecked produces `and()`, also invalid. | Blank report; no message | `Controllers/ReportController.cs:1510-1552`; `Views/Report/ReportPaymentSummary.cshtml:41-48` |
| 2 | Receipt report option value `"CHQ "` has a trailing space, so `PAID_BY='CHQ '` never matches | Cheque filter always empty | `Controllers/ReportController.cs:158,1436` |
| 3 | Month dropdown "please select" (0) passes the client check (`Month != ""`), then `new DateTime(year, 0, 1)` throws | Blank report | `Views/Report/ReportSumRequestPlantEst.cshtml:57`; `Controllers/ReportController.cs:245` |
| 4 | Date "required" checks compare `value()` to `""`, but Kendo returns `null`, so the check never fires | Error page in new window | e.g. `Views/Report/ReportSumRequest.cshtml:48` |
| 5 | No start ≤ end validation on any legacy date-range report | Silent empty report | E.5.4 |
| 6 | Ledger reports (อ.12/อ.13) need a trader on the server but not on the client | Blank report when the trader is left at "please select" | `Controllers/ReportController.cs:1193-1194,1280-1281`; `Views/Report/ReportSumLedgerRawMaterial.cshtml:40` |
| 7 | Yearly อ.1/3/20 rejects `เลือกทั้งหมด` (FormId 0) on the client, although the server has a header for "all" | Feature unreachable | `Views/Report/ReportSumPlantEst.cshtml:58`; `Controllers/ReportController.cs:330-331` |
| 8 | ทะเบียนส่งเรื่อง filters the **register** date range and only requires INFORM_DATE not null; it does not filter by send (inform) date | Wrong period semantics | `Controllers/ReportController.cs:519,531-535` |
| 9 | Screen titles wrong: monthly อ.1/3/20 screen shows the import-to-factory title; อ.4 yearly screen says `(อ.14) รายปี` | User confusion | `Views/Report/ReportSumRequestPlantEst.cshtml:10`; `Views/Report/ReportSumRequestImportForYear.cshtml:10` |
| 10 | Viewer page titles hard-coded `ใบอนุญาตประกอบกิจการโรงงาน` or `ประวัติ` + an unset ViewBag | Wrong tab title | `Views/Report/ReportRptSumRequestPlantEst.cshtml:6`; `Views/Report/ViewReportLicenseImport.cshtml:6` |
| 11 | Empty-data fallbacks register the wrong entity type (`TList<RptSumRequestInt>` for SaleDom and TraderHistory) | Harmless when empty; sloppy | `Controllers/ReportController.cs:776,933` |
| 12 | Every `GetReport…` swallows exceptions and returns `null` | No user feedback on any failure | e.g. `Controllers/ReportController.cs:258-262` |
| 13 | `rptPaymentInformSummary.mrt`, `rptReceiptSummary.mrt` and `rptPaymentSummary.mrt` are not in `UI.Web.csproj` Content items (their views are) | May be missing after publish, which gives a blank report | `UI.Web.csproj:3094-3101` (views only) |
| 14 | Trader-history report is wired to `input[data-histType]` buttons, but no such buttons exist in SSPF views | Dead code | `Views/Trader/IndexTrader.cshtml:485-490` |
| 15 | Unauthorized handling: the friendly redirect/JSON message is overwritten by a bare 401 | User sees the login page instead of `ไม่มีสิทธิสั่งพิมพ์ข้อมูล` | `Attributes/CustomAuthorizeAttribute.cs:89-92` |
| 16 | Signature report: grid and PDF columns, labels and numbering differ (E.3.6) | Inconsistent outputs | view `:59-75`; mrt 241-409 |
| 17 | Number/date labels are inconsistent across reports. The signature grid labels `DocumentNo` as `เลขที่รับเรื่อง` but `DocumentDate` as `วันที่คำขอ`, and `RegisterNo` as `เลขที่คำขอ` but `RegisterDate` as `วันที่รับเรื่อง`. `rptSumRequestPlant` labels `DocumentNo` as `เลขที่คำขอ` and `RegisterNo` as `เลขทะเบียนรับ`. | Business must confirm which number is the "request no." and which is the "receipt/registration no." | `Views/Report/ReportSignatureVerification.cshtml:63-73`; `Content/Report/rptSumRequestPlant.mrt:130-164,358,402` |
| 18 | Signature PDF label `ผู้ตรวจสอบและลงนาม` vs screen `เจ้าหน้าที่ตรวจสอบ/ลงนาม` | Wording | mrt 193; view `:28` |
| 19 | Signature `ทั้งหมด` (0) shares the numeric value of `RequestBgCheck` (0); BgCheck/LocCheck/ledger types cannot be picked individually but are included under "all" | Possibly unexpected rows | `Controllers/ReportController.cs:1719-1724`; `../BC/Enumerates/RequestType.cs:10-17` |
| 20 | Typos in printed/screen text: `ส่งอก` (resource), `ผลิคอาวุธ`/`สภานที่เก็บ` (อ.9 mrt), `รวนเป็นเงิน` (receipt mrt), `โรงาน`, `ราชณาอาจักร` (fee checkboxes), `ผลิดได้` (อ.12 footnote) | Cosmetic | `../BC/Resources/DisplayName.resx:2748-2749`; `Content/Report/rptSumRequestMove.mrt:58`; `Content/Report/rptReceiptSummary.mrt:533`; `Views/Report/ReportPaymentSummary.cshtml:21-29` |
| 21 | Buyer-type options `สมาคม`/`อื่นๆ` contain a hidden soft hyphen (U+00AD) | Search/compare mismatch if text is reused | `Controllers/ReportController.cs:133-134` |
| 22 | Viewer toolbar shows a **Design** button | Exposes the report designer UI to staff | e.g. `Views/Report/ReportRptSumRequestPlantEst.cshtml:32` |
| 23 | Legacy SQL is built by string concatenation (values escaped via `SqlText`); the dead aspx pages accept a raw WHERE | Security; never port | `Controllers/ReportController.cs:168-190`; `Report/WebReportApprovalProcess.aspx.cs:26,77` |
| 24 | Reports have no department/signer scoping; any RP01 PRINT holder sees all traders (flagged by the project's own security review) | Data exposure | `Controllers/ReportController.cs:78-91`; `../.security-audit/2026-11-16_180649/3-review/review.json:891` |

---

## E.9 Open questions for the business
1. Should the Next.js app expose any of the 17 legacy reports, given that the SSPF menu exposes only the signature report?
2. Signature report: is the audience "admins see every officer" (current allow-list), or should an officer see only their own history?
3. Which label is correct for `DocumentNo` vs `RegisterNo` (เลขที่รับเรื่อง vs เลขที่คำขอ)? See E.8 #17.
4. Should the signature PDF include `วันที่รับเรื่อง`, and should the grid show `หมายเหตุ`?
5. Should year filters default to the current (fiscal or calendar) year, and should yearly reports follow the Thai fiscal year (Oct–Sep) instead of the calendar year?
