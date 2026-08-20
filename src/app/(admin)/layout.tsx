import { AdminLayout } from "@/components/layout/AdminLayout";

export default function AdminGroupLayout({ children }: LayoutProps<"/">) {
  return <AdminLayout>{children}</AdminLayout>;
}
