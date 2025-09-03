"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import TodoDashboard from "@/components/TodoDashboard";

export default function TasksPage() {
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('auth_token');
      if (!token) router.replace('/');
    }
  }, [router]);

  return <TodoDashboard />;
}
