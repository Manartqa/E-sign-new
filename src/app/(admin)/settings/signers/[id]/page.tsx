import { SignerFormContent } from "@/components/partials/Signer";

export const metadata = { title: "แก้ไขผู้มีอำนาจลงนาม" };

export default async function EditSignerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // Next 16: params is always a Promise
  const { id } = await params;
  return <SignerFormContent id={id} />;
}
