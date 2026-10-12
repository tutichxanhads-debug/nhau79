"use client";
import { useRouter, useParams } from "next/navigation";
import { CustomerApp } from "@/components/QuanNhauKit";

export default function MenuPage() {
  const router = useRouter();
  const params = useParams();
  const navigate = (path) => router.push(path === "" ? "/" : path);
  return <CustomerApp tableId={params.table} navigate={navigate} />;
}
