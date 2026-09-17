import type {
  SigningWorkflow,
  SigningWorkflowInput,
} from "@/types/app/signingWorkflows";

/**
 * /api/signing-workflows — not in the handoff; mirrors the settings screens
 * until the backend defines its own contract.
 */
export type SigningWorkflowResponse = SigningWorkflow;
export type SigningWorkflowRequest = SigningWorkflowInput;
