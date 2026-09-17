import { SigningWorkflowFormContent } from "@/components/partials/SigningWorkflow";

export const metadata = { title: "เพิ่มกระบวนการลงนาม" };

export default async function NewSigningWorkflowPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  // ?copyFrom=<id> — the list's สำเนา action prefills from that workflow
  const { copyFrom } = await searchParams;
  return (
    <SigningWorkflowFormContent
      copyFromId={typeof copyFrom === "string" ? copyFrom : undefined}
    />
  );
}
