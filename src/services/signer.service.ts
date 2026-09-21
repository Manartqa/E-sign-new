import { isAxiosError } from "axios";
import { USE_MOCK } from "@/lib/env";
import { sortRows } from "@/lib/sort";
import {
  checkSignerCertificateApi,
  createSignerApi,
  deleteSignerApi,
  getSignerApi,
  getPositionsApi,
  getSignersApi,
  updateSignerApi,
} from "@/lib/api/api-main";
import { readCertificate } from "@/lib/pkcs12";
import { MOCK_PROFILE } from "@/mocks/profile.mock";
import { MOCK_POSITIONS, MOCK_SIGNERS } from "@/mocks/signers.mock";
import { MOCK_SIGNING_WORKFLOWS } from "@/mocks/signingWorkflows.mock";
import {
  SIGNING_METHOD,
  SignerInUseError,
  type CertificateCheckResult,
  type Signer,
  type SignerInput,
  type SignerListParams,
  type SignerListResult,
} from "@/types/app/signers";

const DEFAULT_LIMIT = 10;

/**
 * ── Backend swap point ────────────────────────────────────────────────────
 * Mock branches edit MOCK_SIGNERS in memory: changes survive navigation but
 * reset on a page reload. Uploaded files are never read in mock mode.
 */

/** multipart body for create / update — files can't travel as JSON */
function toFormData({ certificate, signatureImage, ...fields }: SignerInput) {
  const body = new FormData();
  Object.entries(fields).forEach(([key, value]) =>
    body.append(key, String(value)),
  );
  if (certificate) {
    body.append("certificateFile", certificate.file);
    body.append("certificatePin", certificate.pin);
  }
  if (signatureImage) body.append("signatureImage", signatureImage);
  // explicit flag: an absent file means "keep", not "remove"
  if (signatureImage === null) body.append("removeSignatureImage", "true");
  return body;
}

/** mock stand-in for what the server derives from the submitted fields */
function applyMockInput(target: Signer, input: SignerInput) {
  const { certificate, signatureImage, ...fields } = input;
  Object.assign(target, fields, {
    name: `${fields.prefix}${fields.firstName} ${fields.lastName}`,
  });
  if (fields.signingMethod !== SIGNING_METHOD.CERTIFICATE_FILE)
    target.certificateFileName = null;
  else if (certificate) target.certificateFileName = certificate.file.name;
  if (signatureImage === null) target.signatureImageUrl = null;
  else if (signatureImage)
    target.signatureImageUrl = URL.createObjectURL(signatureImage);
}

export async function getSigners(
  params: SignerListParams = {},
): Promise<SignerListResult> {
  const page = params.page ?? 1;
  const limit = params.limit ?? DEFAULT_LIMIT;

  if (USE_MOCK) {
    const keyword = params.keyword?.trim().toLowerCase() ?? "";
    // newest first unless a column is picked
    const filtered = sortRows(
      MOCK_SIGNERS.filter(
      (s) =>
        (!params.activeOnly || s.isActive) &&
        (!keyword ||
          s.name.toLowerCase().includes(keyword) ||
          s.position.toLowerCase().includes(keyword)),
    ).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
      params,
      (signer, key) => signer[key as keyof Signer],
    );
    return {
      items: filtered.slice((page - 1) * limit, page * limit),
      total: filtered.length,
      page,
      limit,
    };
  }

  const res = await getSignersApi({ ...params, page, limit });
  return {
    items: res.data.data,
    total: res.data.total,
    page: res.data.page,
    limit: res.data.limit,
  };
}

/** null when the id doesn't exist */
export async function getSigner(id: string): Promise<Signer | null> {
  if (USE_MOCK) return MOCK_SIGNERS.find((s) => s.id === id) ?? null;
  const res = await getSignerApi(id);
  return res.data.data;
}

export async function createSigner(input: SignerInput): Promise<Signer> {
  if (USE_MOCK) {
    const now = new Date().toISOString();
    const nextId =
      Math.max(0, ...MOCK_SIGNERS.map((s) => Number(s.id.slice(3)))) + 1;
    const created = {
      id: `SG-${String(nextId).padStart(3, "0")}`,
      certificateFileName: null,
      signatureImageUrl: null,
      createdBy: MOCK_PROFILE.firstName,
      createdAt: now,
      updatedBy: MOCK_PROFILE.firstName,
      updatedAt: now,
    } as Signer;
    applyMockInput(created, input);
    MOCK_SIGNERS.push(created);
    return created;
  }
  const res = await createSignerApi(toFormData(input));
  return res.data.data;
}

export async function updateSigner(
  id: string,
  input: SignerInput,
): Promise<Signer> {
  if (USE_MOCK) {
    const target = MOCK_SIGNERS.find((s) => s.id === id);
    if (!target) throw new Error("ไม่พบผู้มีอำนาจลงนามนี้");
    applyMockInput(target, input);
    target.updatedBy = MOCK_PROFILE.firstName;
    target.updatedAt = new Date().toISOString();
    return target;
  }
  const res = await updateSignerApi(id, toFormData(input));
  return res.data.data;
}

/** ตำแหน่ง choices for the signer form */
export async function getPositions(): Promise<string[]> {
  if (USE_MOCK) return MOCK_POSITIONS;
  const res = await getPositionsApi();
  return res.data.data;
}

/** ตรวจสอบ Certificate — opens the file with the PIN without saving either */
export async function checkSignerCertificate(
  file: File,
  pin: string,
): Promise<CertificateCheckResult> {
  // no stand-in: the uploaded file is opened with the PIN right here
  if (USE_MOCK) return readCertificate(file, pin);
  const body = new FormData();
  body.append("certificateFile", file);
  body.append("certificatePin", pin);
  const res = await checkSignerCertificateApi(body);
  return res.data.data;
}

/** throws SignerInUseError when a signing workflow still has the signer */
export async function deleteSigner(id: string): Promise<void> {
  if (USE_MOCK) {
    const inUse = MOCK_SIGNING_WORKFLOWS.some((w) =>
      w.steps.some((step) => step.signerId === id),
    );
    if (inUse) throw new SignerInUseError();
    const index = MOCK_SIGNERS.findIndex((s) => s.id === id);
    if (index >= 0) MOCK_SIGNERS.splice(index, 1);
    return;
  }
  try {
    await deleteSignerApi(id);
  } catch (error) {
    if (isAxiosError(error) && error.response?.status === 409)
      throw new SignerInUseError();
    throw error;
  }
}
