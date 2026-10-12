"use client";
import { useRouter } from "next/navigation";
import { RoleGate } from "@/components/QuanNhauKit";

export default function HomePage() {
  const router = useRouter();
  const navigate = (path) => router.push(path === "" ? "/" : path);
  return <RoleGate navigate={navigate} />;
}
