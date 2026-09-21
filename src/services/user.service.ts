import { isAxiosError } from "axios";
import { USE_MOCK } from "@/lib/env";
import { sortRows } from "@/lib/sort";
import {
  checkCertificateApi,
  createUserApi,
  deleteUserApi,
  getPositionsApi,
  getUserApi,
  getUsersApi,
  updateUserApi,
} from "@/lib/api/api-main";
import { readCertificate } from "@/lib/pkcs12";
import { MOCK_PROFILE } from "@/mocks/profile.mock";
import { rolesOf } from "@/mocks/roles.mock";
import { MOCK_SIGNING_WORKFLOWS } from "@/mocks/signingWorkflows.mock";
import { MOCK_POSITIONS, MOCK_USERS, type MockUser } from "@/mocks/users.mock";
import {
  SIGNING_METHOD,
  type CertificateCheckResult,
} from "@/types/app/signers";
import {
  UserInUseError,
  type User,
  type UserInput,
  type UserListParams,
  type UserListResult,
} from "@/types/app/users";

const DEFAULT_LIMIT = 10;

/**
 * ── Backend swap point ────────────────────────────────────────────────────
 * Mock branches edit MOCK_USERS in memory: changes survive navigation but
 * reset on a page reload. Uploaded files are never read in mock mode.
 */

const toUser = ({ roleIds, ...user }: MockUser): User => ({
  ...user,
  roles: rolesOf(roleIds).roles,
});

/** multipart body for create / update — files can't travel as JSON */
function toFormData({
  certificate,
  signatureImage,
  roleIds,
  ...fields
}: UserInput) {
  const body = new FormData();
  Object.entries(fields).forEach(([key, value]) =>
    body.append(key, String(value)),
  );
  // absent = leave the roles alone; the server checks ROLES:UPDATE
  roleIds?.forEach((id) => body.append("roleIds", id));
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
function applyMockInput(target: MockUser, input: UserInput) {
  const { certificate, signatureImage, roleIds, ...fields } = input;
  Object.assign(target, fields, {
    name: `${fields.prefix}${fields.firstName} ${fields.lastName}`,
  });
  if (roleIds) target.roleIds = roleIds;
  if (fields.signingMethod !== SIGNING_METHOD.CERTIFICATE_FILE)
    target.certificateFileName = null;
  else if (certificate) target.certificateFileName = certificate.file.name;
  if (signatureImage === null) target.signatureImageUrl = null;
  else if (signatureImage)
    target.signatureImageUrl = URL.createObjectURL(signatureImage);
}

export async function getUsers(
  params: UserListParams = {},
): Promise<UserListResult> {
  const page = params.page ?? 1;
  const limit = params.limit ?? DEFAULT_LIMIT;

  if (USE_MOCK) {
    const keyword = params.keyword?.trim().toLowerCase() ?? "";
    // newest first unless a column is picked
    const filtered = sortRows(
      MOCK_USERS.map(toUser)
        .filter(
          (user) =>
            (!params.activeOnly || user.isActive) &&
            (!keyword ||
              user.name.toLowerCase().includes(keyword) ||
              user.email.toLowerCase().includes(keyword) ||
              user.position.toLowerCase().includes(keyword)),
        )
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
      params,
      (user, key) =>
        key === "roles"
          ? user.roles.map((role) => role.name).join(", ")
          : user[key as keyof User],
    );
    return {
      items: filtered.slice((page - 1) * limit, page * limit),
      total: filtered.length,
      page,
      limit,
    };
  }

  const res = await getUsersApi({ ...params, page, limit });
  return {
    items: res.data.data,
    total: res.data.total,
    page: res.data.page,
    limit: res.data.limit,
  };
}

/** null when the id doesn't exist */
export async function getUser(id: string): Promise<User | null> {
  if (USE_MOCK) {
    const user = MOCK_USERS.find((item) => item.id === id);
    return user ? toUser(user) : null;
  }
  const res = await getUserApi(id);
  return res.data.data;
}

export async function createUser(input: UserInput): Promise<User> {
  if (USE_MOCK) {
    const now = new Date().toISOString();
    const nextId =
      Math.max(0, ...MOCK_USERS.map((user) => Number(user.id.slice(4)))) + 1;
    const created = {
      id: `OFF-${String(nextId).padStart(3, "0")}`,
      roleIds: [],
      certificateFileName: null,
      signatureImageUrl: null,
      lastLoginAt: null,
      createdBy: MOCK_PROFILE.firstName,
      createdAt: now,
      updatedBy: MOCK_PROFILE.firstName,
      updatedAt: now,
    } as unknown as MockUser;
    applyMockInput(created, input);
    MOCK_USERS.push(created);
    return toUser(created);
  }
  const res = await createUserApi(toFormData(input));
  return res.data.data;
}

export async function updateUser(id: string, input: UserInput): Promise<User> {
  if (USE_MOCK) {
    const target = MOCK_USERS.find((user) => user.id === id);
    if (!target) throw new Error("ไม่พบผู้ใช้งานนี้");
    applyMockInput(target, input);
    target.updatedBy = MOCK_PROFILE.firstName;
    target.updatedAt = new Date().toISOString();
    return toUser(target);
  }
  const res = await updateUserApi(id, toFormData(input));
  return res.data.data;
}

/** throws UserInUseError when a signing workflow still has the user */
export async function deleteUser(id: string): Promise<void> {
  if (USE_MOCK) {
    const inUse = MOCK_SIGNING_WORKFLOWS.some((workflow) =>
      workflow.steps.some((step) => step.signerId === id),
    );
    if (inUse) throw new UserInUseError();
    const index = MOCK_USERS.findIndex((user) => user.id === id);
    if (index >= 0) MOCK_USERS.splice(index, 1);
    return;
  }
  try {
    await deleteUserApi(id);
  } catch (error) {
    if (isAxiosError(error) && error.response?.status === 409)
      throw new UserInUseError();
    throw error;
  }
}

/** ตำแหน่ง choices for the user form */
export async function getPositions(): Promise<string[]> {
  if (USE_MOCK) return MOCK_POSITIONS;
  const res = await getPositionsApi();
  return res.data.data;
}

/** ตรวจสอบ Certificate — opens the file with the PIN without saving either */
export async function checkCertificate(
  file: File,
  pin: string,
): Promise<CertificateCheckResult> {
  // no stand-in: the uploaded file is opened with the PIN right here
  if (USE_MOCK) return readCertificate(file, pin);
  const body = new FormData();
  body.append("certificateFile", file);
  body.append("certificatePin", pin);
  const res = await checkCertificateApi(body);
  return res.data.data;
}
