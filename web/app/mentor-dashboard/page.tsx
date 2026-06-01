"use client";

import { useState, useEffect } from "react";
import MentorSidebar from "@/components/mentor-sidebar";
import StudentList from "@/components/student-list";
import RecentBillings from "@/components/recent-billings";
import api from "@/utils/api";

type DateItem = { value: string; label: string };

export default function MentorDashboardPage() {
    const [username, setUsername] = useState("");
    const [gender, setGender] = useState("");
    const [dates, setDates] = useState<DateItem[]>([]);

    useEffect(() => {
        api.get("/api/auth/me").then((res) => {
            setUsername(res.data.username);
            setGender(res.data.gender);
        }).catch(() => { });
        api.get("/api/billing/dates").then((res) => {
            setDates(res.data);
        }).catch(() => { });
    }, []);

    return (
        <div className="flex h-screen bg-gray-50">
            <MentorSidebar username={username} gender={gender} dates={dates} />

            <main className="flex-1 flex flex-col p-8 overflow-hidden">
                <h1 className="text-2xl font-bold text-gray-900 mb-8 flex-shrink-0">Dashboard</h1>

                <div className="flex flex-col gap-6 flex-1 min-h-0">
                    <div className="flex-shrink-0">
                        <StudentList />
                    </div>
                    <div className="flex-1 min-h-0">
                        <RecentBillings />
                    </div>
                </div>
            </main>
        </div>
    );
}
