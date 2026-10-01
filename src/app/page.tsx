"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Dashboard } from "@/components/dashboard/Dashboard";
import { useSession } from "@/lib/session";

export default function HomePage() {
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "signed-out") router.replace("/login");
  }, [status, router]);

  if (status !== "signed-in") return <main aria-busy="true" style={{ minHeight: "100vh" }} />;
  return (
    <main>
      <Dashboard />
    </main>
  );
}
