import { USE_MOCK } from "@/lib/env";
import {
  getApplicationTypesApi,
  getDecisionReasonsApi,
  getPersonTypesApi,
  getPrefixesApi,
  getWeaponCategoriesApi,
} from "@/lib/api/api-main";
import { APPLICATION_TYPE_OPTIONS } from "@/mocks/applications.mock";
import {
  MOCK_DECISION_REASONS,
  MOCK_PERSON_TYPES,
  MOCK_PREFIXES,
  MOCK_WEAPON_CATEGORIES,
} from "@/mocks/master.mock";
import type { DecisionAction } from "@/types/app/applications";
import type { MasterOption } from "@/types/app/master";

/**
 * ── Backend swap point ────────────────────────────────────────────────────
 * Option lists the backend owns. None of them carries an "all" entry — the
 * screens that filter add their own.
 */

/** ประเภทคำขอ / ประเภทใบอนุญาต — `value` is an application `type` */
export async function getApplicationTypes(): Promise<MasterOption[]> {
  if (USE_MOCK) return APPLICATION_TYPE_OPTIONS;
  const res = await getApplicationTypesApi();
  return res.data.data;
}

/** เหตุผลไม่อนุมัติ / ส่งคืนเพื่อแก้ไข — `value` is the reasonCode sent back */
export async function getDecisionReasons(
  action: DecisionAction,
): Promise<MasterOption[]> {
  if (USE_MOCK) return MOCK_DECISION_REASONS[action];
  const res = await getDecisionReasonsApi(action);
  return res.data.data;
}

/** ประเภทยุทธภัณฑ์ */
export async function getWeaponCategories(): Promise<MasterOption[]> {
  if (USE_MOCK) return MOCK_WEAPON_CATEGORIES;
  const res = await getWeaponCategoriesApi();
  return res.data.data;
}

/** ประเภทบุคคล */
export async function getPersonTypes(): Promise<MasterOption[]> {
  if (USE_MOCK) return MOCK_PERSON_TYPES;
  const res = await getPersonTypesApi();
  return res.data.data;
}

/** คำนำหน้าชื่อ / ยศ */
export async function getPrefixes(): Promise<MasterOption[]> {
  if (USE_MOCK) return MOCK_PREFIXES;
  const res = await getPrefixesApi();
  return res.data.data;
}
