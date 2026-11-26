import { redirect } from "next/navigation";
import { ROUTES } from "@/constant/routes";

/**
 * รายงาน is a sidebar sub menu with no page of its own; a direct visit (and
 * every link to the old /reports) lands on its first entry.
 */
export default function ReportsPage() {
  redirect(ROUTES.reportsOverview);
}
