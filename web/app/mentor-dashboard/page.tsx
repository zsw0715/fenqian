"use client";

import { useState, useEffect } from "react";
import { Download } from "lucide-react";
import { toast } from "sonner";
import MentorSidebar from "@/components/mentor-sidebar";
import StudentList from "@/components/student-list";
import RecentBillings from "@/components/recent-billings";
import api from "@/utils/api";

type DateItem = { value: string; label: string };

type ExportItem = {
    student_name: string;
    dining_type: string;
    original_amount: number;
    discount_amount: number;
    already_paid: boolean;
    created_at: string;
};

function getWeekdayLabel(date: Date): string {
    const labels = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
    return labels[date.getDay()];
}

function getMonday(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    d.setDate(d.getDate() + diff);
    d.setHours(0, 0, 0, 0);
    return d;
}

function getSunday(monday: Date): Date {
    const d = new Date(monday);
    d.setDate(d.getDate() + 6);
    return d;
}

function formatDateShort(d: Date): string {
    return `${d.getMonth() + 1}月${d.getDate()}日`;
}

function formatWeekHeader(monday: Date): string {
    const sunday = getSunday(monday);
    return `${formatDateShort(monday)}（${getWeekdayLabel(monday)}） --- ${formatDateShort(sunday)}（${getWeekdayLabel(sunday)}）`;
}

export default function MentorDashboardPage() {
    const [username, setUsername] = useState("");
    const [gender, setGender] = useState("");
    const [dates, setDates] = useState<DateItem[]>([]);
    const [exporting, setExporting] = useState(false);

    useEffect(() => {
        api.get("/api/auth/me").then((res) => {
            setUsername(res.data.username);
            setGender(res.data.gender);
        }).catch(() => { });
        api.get("/api/billing/dates").then((res) => {
            setDates(res.data);
        }).catch(() => { });
    }, []);

    const handleExportAll = async () => {
        setExporting(true);
        try {
            const res = await api.get("/api/billing/export_all");
            const items: ExportItem[] = res.data.items;
            if (items.length === 0) {
                toast.error("暂无数据可导出");
                return;
            }

            const weeks = new Map<string, ExportItem[]>();
            for (const item of items) {
                const d = new Date(item.created_at.replace(" ", "T"));
                const monday = getMonday(d);
                const key = `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, "0")}-${String(monday.getDate()).padStart(2, "0")}`;
                if (!weeks.has(key)) weeks.set(key, []);
                weeks.get(key)!.push(item);
            }

            const sortedWeeks = Array.from(weeks.entries()).sort(([a], [b]) => a.localeCompare(b));

            const header = "学生,餐次,原价,优惠,实付,已付款,时间";
            const sections: string[] = [];

            for (const [key, weekItems] of sortedWeeks) {
                const [y, m, d] = key.split("-").map(Number);
                const monday = new Date(y, m - 1, d);
                sections.push(formatWeekHeader(monday));
                sections.push(header);
                for (const b of weekItems) {
                    const meal = b.dining_type === "lunch" ? "午饭" : "晚饭";
                    const final = (b.original_amount - b.discount_amount).toFixed(2);
                    sections.push(`${b.student_name},${meal},${b.original_amount},${b.discount_amount},${final},${b.already_paid ? "是" : "否"},${b.created_at}`);
                }
                sections.push("");
            }

            const csv = "\uFEFF" + sections.join("\n");
            const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "billing_full.csv";
            a.click();
            URL.revokeObjectURL(url);
            toast.success(`导出成功，${sortedWeeks.length} 周共 ${items.length} 条`);
        } catch {
            toast.error("导出失败");
        } finally {
            setExporting(false);
        }
    };

    return (
        <div className="flex h-screen bg-gray-50">
            <MentorSidebar username={username} gender={gender} dates={dates} />

            <main className="flex-1 flex flex-col p-8 overflow-hidden">
                <div className="flex items-center justify-between mb-8 flex-shrink-0">
                    <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                    <button
                        onClick={handleExportAll}
                        disabled={exporting}
                        className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Download size={16} />
                        {exporting ? "导出中..." : "导出全部 CSV"}
                    </button>
                </div>

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
