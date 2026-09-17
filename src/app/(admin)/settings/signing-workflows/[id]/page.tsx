import { SigningWorkflowFormContent } from "@/components/partials/SigningWorkflow";

export const metadata = { title: "แก้ไขกระบวนการลงนาม" };

export default async function EditSigningWorkflowPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // Next 16: params is always a Promise
  const { id } = await params;
  return <SigningWorkflowFormContent id={id} />;
}
