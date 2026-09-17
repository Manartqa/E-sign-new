import { redirect } from "next/navigation";
import { ROUTES } from "@/constant/routes";

/**
 * ตั้งค่าระบบ is a sidebar sub menu with no page of its own; a direct visit
 * lands on its first entry.
 */
export default function SettingsPage() {
  redirect(ROUTES.signers);
}
