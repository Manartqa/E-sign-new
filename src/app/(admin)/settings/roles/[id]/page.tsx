import { RoleFormContent } from "@/components/partials/Role";

export const metadata = { title: "แก้ไขบทบาท" };

export default async function EditRolePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // Next 16: params is always a Promise
  const { id } = await params;
  return <RoleFormContent id={id} />;
}
