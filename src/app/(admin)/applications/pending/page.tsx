import { ApplicationListContent } from "@/components/partials/ApplicationList";

export const metadata = { title: "รอการอนุมัติ" };

export default function PendingApplicationsPage() {
  return <ApplicationListContent variant="pending" />;
}
