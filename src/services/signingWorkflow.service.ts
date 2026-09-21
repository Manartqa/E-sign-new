import { USE_MOCK } from "@/lib/env";
import { sortRows } from "@/lib/sort";
import {
  createSigningWorkflowApi,
  deleteSigningWorkflowApi,
  getSigningWorkflowApi,
  getSigningWorkflowsApi,
  updateSigningWorkflowApi,
} from "@/lib/api/api-main";
import { MOCK_PROFILE } from "@/mocks/profile.mock";
import { MOCK_SIGNERS } from "@/mocks/signers.mock";
import { MOCK_SIGNING_WORKFLOWS } from "@/mocks/signingWorkflows.mock";
import type {
  SigningWorkflow,
  SigningWorkflowInput,
  SigningWorkflowListParams,
  SigningWorkflowListResult,
} from "@/types/app/signingWorkflows";

const DEFAULT_LIMIT = 10;

/**
 * ── Backend swap point ────────────────────────────────────────────────────
 * Mock branches edit MOCK_SIGNING_WORKFLOWS in memory: changes survive
 * navigation but reset on a page reload.
 */

/**
 * mock stand-in for the server resolving each step's signer on read. The stored
 * order is the signing order, so it is left alone.
 */
const withCurrentSigners = (workflow: SigningWorkflow): SigningWorkflow => ({
  ...workflow,
  steps: workflow.steps.map((step) => {
    const signer = MOCK_SIGNERS.find((s) => s.id === step.signerId);
    return signer
      ? {
          ...step,
          signerName: signer.name,
          position: signer.position,
          approvalLevel: signer.approvalLevel,
        }
      : step;
  }),
});

export async function getSigningWorkflows(
  params: SigningWorkflowListParams = {},
): Promise<SigningWorkflowListResult> {
  const page = params.page ?? 1;
  const limit = params.limit ?? DEFAULT_LIMIT;

  if (USE_MOCK) {
    const keyword = params.keyword?.trim().toLowerCase() ?? "";
    // newest first unless a column is picked
    const filtered = sortRows(
      MOCK_SIGNING_WORKFLOWS.map(withCurrentSigners)
      .filter(
        (w) =>
          !keyword ||
          w.name.toLowerCase().includes(keyword) ||
          w.steps.some(
            (s) =>
              s.position.toLowerCase().includes(keyword) ||
              s.signerName.toLowerCase().includes(keyword),
          ),
      )
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
      params,
      (workflow, key) =>
        key === "steps"
          ? workflow.steps.length
          : key === "scope"
            ? `${workflow.weaponCategory} ${workflow.licenseType}`
            : workflow[key as keyof SigningWorkflow],
    );
    return {
      items: filtered.slice((page - 1) * limit, page * limit),
      total: filtered.length,
      page,
      limit,
    };
  }

  const res = await getSigningWorkflowsApi({ ...params, page, limit });
  return {
    items: res.data.data,
    total: res.data.total,
    page: res.data.page,
    limit: res.data.limit,
  };
}

/** null when the id doesn't exist */
export async function getSigningWorkflow(
  id: string,
): Promise<SigningWorkflow | null> {
  if (USE_MOCK) {
    const workflow = MOCK_SIGNING_WORKFLOWS.find((w) => w.id === id);
    return workflow ? withCurrentSigners(workflow) : null;
  }
  const res = await getSigningWorkflowApi(id);
  return res.data.data;
}

export async function createSigningWorkflow(
  input: SigningWorkflowInput,
): Promise<SigningWorkflow> {
  if (USE_MOCK) {
    const now = new Date().toISOString();
    const nextId =
      Math.max(0, ...MOCK_SIGNING_WORKFLOWS.map((w) => Number(w.id.slice(3)))) +
      1;
    const created: SigningWorkflow = {
      ...input,
      id: `SW-${String(nextId).padStart(3, "0")}`,
      createdBy: MOCK_PROFILE.firstName,
      createdAt: now,
      updatedBy: MOCK_PROFILE.firstName,
      updatedAt: now,
    };
    MOCK_SIGNING_WORKFLOWS.push(created);
    return created;
  }
  const res = await createSigningWorkflowApi(input);
  return res.data.data;
}

export async function updateSigningWorkflow(
  id: string,
  input: SigningWorkflowInput,
): Promise<SigningWorkflow> {
  if (USE_MOCK) {
    const target = MOCK_SIGNING_WORKFLOWS.find((w) => w.id === id);
    if (!target) throw new Error("ไม่พบกระบวนการลงนามนี้");
    Object.assign(target, input, {
      updatedBy: MOCK_PROFILE.firstName,
      updatedAt: new Date().toISOString(),
    });
    return target;
  }
  const res = await updateSigningWorkflowApi(id, input);
  return res.data.data;
}

export async function deleteSigningWorkflow(id: string): Promise<void> {
  if (USE_MOCK) {
    const index = MOCK_SIGNING_WORKFLOWS.findIndex((w) => w.id === id);
    if (index >= 0) MOCK_SIGNING_WORKFLOWS.splice(index, 1);
    return;
  }
  await deleteSigningWorkflowApi(id);
}
