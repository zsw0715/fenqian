"use client";

import AuthGuard from "@/components/AuthGuard";

export default function StudentBillingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard requiredIdentity="student">
      <div className="min-h-screen flex flex-col bg-slate-50">
        {children}
      </div>
    </AuthGuard>
  );
}
