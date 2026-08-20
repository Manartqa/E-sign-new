import { ApplicationDetailContent } from "@/components/partials/ApplicationDetail";

export const metadata = { title: "รายละเอียดคำขอ" };

export default async function ApplicationDetailPage({
  params,
}: PageProps<"/applications/[id]">) {
  // Next 16: params is always a Promise
  const { id } = await params;
  return <ApplicationDetailContent id={id} />;
}
