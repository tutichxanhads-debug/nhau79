"use client";
import { useRouter } from "next/navigation";
import { AdminApp, PinGate } from "@/components/QuanNhauKit";

export default function AdminPage() {
  const router = useRouter();
  const navigate = (path) => router.push(path === "" ? "/" : path);
  return (
    <PinGate storageKey="qn_unlocked_admin" title="Đăng nhập Chủ quán">
      <AdminApp navigate={navigate} />
    </PinGate>
  );
}
