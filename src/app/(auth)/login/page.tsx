import { Suspense } from "react";
import { LoginContent } from "@/components/partials/Login";

export const metadata = { title: "เข้าสู่ระบบ" };

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  );
}
