"use client";
import { useRouter } from "next/navigation";
import { StaffApp, PinGate } from "@/components/QuanNhauKit";

export default function StaffPage() {
  const router = useRouter();
  const navigate = (path) => router.push(path === "" ? "/" : path);
  return (
    <PinGate storageKey="qn_unlocked_staff" title="Đăng nhập Nhân viên">
      <StaffApp navigate={navigate} />
    </PinGate>
  );
}
