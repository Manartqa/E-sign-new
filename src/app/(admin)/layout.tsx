import { AdminLayout } from "@/components/layout/AdminLayout";
import { AuthGuard } from "@/context/auth/AuthGuard";

export default function AdminGroupLayout({ children }: LayoutProps<"/">) {
  return (
    <AuthGuard>
      <AdminLayout>{children}</AdminLayout>
    </AuthGuard>
  );
}
