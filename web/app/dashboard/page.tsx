"use client";

import MentorSidebar from "@/components/mentor-sidebar";
import StudentList from "@/components/student-list";
import RecentBillings from "@/components/recent-billings";

export default function DashboardPage() {
  return (
    <div className="flex h-screen bg-gray-50">
      <MentorSidebar />

      <main className="flex-1 overflow-y-auto p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">Dashboard</h1>

        <div className="flex flex-col gap-6">
          <StudentList />
          <RecentBillings />
        </div>
      </main>
    </div>
  );
}
