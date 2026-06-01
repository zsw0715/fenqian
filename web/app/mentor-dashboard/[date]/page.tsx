"use client";

import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { Gift, Moon, Utensils } from "lucide-react";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import MentorSidebar from "@/components/mentor-sidebar";
import RecentBillings from "@/components/recent-billings";
import api from "@/utils/api";

type DateItem = { value: string; label: string };

const LUNCH_DISCOUNT = 16;

export default function MentorDateDetailPage() {
    const params = useParams();
    const date = (params.date as string) || "";

    const [username, setUsername] = useState("");
    const [gender, setGender] = useState("");
    const [dates, setDates] = useState<DateItem[]>([]);
    const [mealType, setMealType] = useState<"lunch" | "dinner">("lunch");
    const [eaterCount, setEaterCount] = useState(0);
    const [pushCount, setPushCount] = useState(0);
    const [pushing, setPushing] = useState(false);

    const perPersonDiscount = eaterCount > 0
        ? (LUNCH_DISCOUNT / eaterCount).toFixed(2)
        : "0.00";

    useEffect(() => {
        api.get("/api/auth/me").then((res) => {
            setUsername(res.data.username);
            setGender(res.data.gender);
        }).catch(() => {});
        api.get("/api/billing/dates").then((res) => {
            setDates(res.data);
        }).catch(() => {});
    }, []);

    useEffect(() => {
        if (!date) return;
        api.get("/api/billing/recent", {
            params: { page: 0, page_size: 1000, date, dining_type: mealType },
        }).then((res) => {
            setEaterCount(res.data.total);
        }).catch(() => {});
    }, [date, mealType, pushCount]);

    const handleExport = async () => {
        try {
            const res = await api.get("/api/billing/recent", {
                params: { page: 0, page_size: 1000, date },
            });
            const items = res.data.items as { student_name: string; dining_type: string; original_amount: number; discount_amount: number; already_paid: boolean; created_at: string }[];
            if (items.length === 0) {
                toast.error("暂无数据可导出");
                return;
            }
            const header = "学生,餐次,原价,优惠,实付,已付款,日期";
            const rows = items.map((b) => {
                const meal = b.dining_type === "lunch" ? "午饭" : "晚饭";
                const final = (b.original_amount - b.discount_amount).toFixed(2);
                return `${b.student_name},${meal},${b.original_amount},${b.discount_amount},${final},${b.already_paid ? "是" : "否"},${b.created_at}`;
            });
            const csv = "\uFEFF" + header + "\n" + rows.join("\n");
            const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `billing_${date}.csv`;
            a.click();
            URL.revokeObjectURL(url);
            toast.success("导出成功");
        } catch {
            toast.error("导出失败");
        }
    };

    const handlePush = async () => {
        setPushing(true);
        try {
            const res = await api.post("/api/billing/push_coupon", {
                date,
                dining_type: mealType,
            });
            const { eater_count, per_person_discount } = res.data;
            toast.success(`发放成功！${eater_count} 人，每人优惠 ¥${per_person_discount}`);
            setPushCount((c) => c + 1);
            setEaterCount(eater_count);

            confetti({
                particleCount: 120,
                spread: 80,
                origin: { y: 0.6 },
                colors: ["#f97316", "#fbbf24", "#ec4899", "#a855f7", "#06b6d4"],
            });
            setTimeout(() => {
                confetti({
                    particleCount: 60,
                    angle: 60,
                    spread: 55,
                    origin: { x: 0 },
                });
                confetti({
                    particleCount: 60,
                    angle: 120,
                    spread: 55,
                    origin: { x: 1 },
                });
            }, 300);
        } catch (err: unknown) {
            const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
            toast.error(detail || "发放失败");
        } finally {
            setPushing(false);
        }
    };

    return (
        <div className="flex h-screen bg-gray-50">
            <MentorSidebar username={username} gender={gender} dates={dates} />

            <main className="flex-1 flex flex-col p-8 overflow-hidden">
                <h1 className="text-2xl font-bold text-gray-900 mb-8 flex-shrink-0">Daily Detail</h1>

                <div className="flex flex-col gap-6 flex-1 min-h-0">
                    <div className="flex-shrink-0">
                        <RecentBillings date={date} key={pushCount} onExport={handleExport} />
                    </div>

                    <div className="bg-white border border-gray-200 shadow-sm flex-shrink-0">
                        <div className="flex items-center gap-6 px-6 py-3.5 border-b border-gray-100">
                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Split</span>

                            <div className="relative flex bg-gray-100 rounded-lg p-0.5 w-44">
                                <div
                                    className="absolute top-0.5 bottom-0.5 w-1/2 bg-white rounded-md shadow-sm transition-transform duration-300 ease-out"
                                    style={{ transform: `translateX(${mealType === "lunch" ? 0 : 100}%)` }}
                                />
                                <button
                                    onClick={() => setMealType("lunch")}
                                    className={`relative z-10 flex-1 flex items-center justify-center gap-1 py-1.5 text-xs font-medium rounded-md transition-colors ${mealType === "lunch" ? "text-gray-900" : "text-gray-500 hover:text-gray-700"}`}
                                >
                                    <Utensils size={12} className={mealType === "lunch" ? "text-orange-500" : "text-gray-400"} />
                                    午饭
                                </button>
                                <button
                                    onClick={() => setMealType("dinner")}
                                    className={`relative z-10 flex-1 flex items-center justify-center gap-1 py-1.5 text-xs font-medium rounded-md transition-colors ${mealType === "dinner" ? "text-gray-900" : "text-gray-500 hover:text-gray-700"}`}
                                >
                                    <Moon size={12} className={mealType === "dinner" ? "text-indigo-500" : "text-gray-400"} />
                                    晚饭
                                </button>
                            </div>

                            <span className={`text-xs border rounded px-2 py-1 flex items-center gap-1 ${mealType === "lunch" ? "text-orange-600 bg-orange-50 border-orange-200" : "text-indigo-600 bg-indigo-50 border-indigo-200"}`}>
                                <Gift size={11} />
                                ¥{LUNCH_DISCOUNT} off
                            </span>

                            <div className="flex-1" />

                            <div className="flex items-center gap-6">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-gray-400 uppercase tracking-wider">{mealType === "lunch" ? "吃午饭人数" : "吃晚饭人数"}</span>
                                    <span className="text-base font-semibold text-gray-900 font-mono">{eaterCount}</span>
                                </div>
                                <div className="w-px h-4 bg-gray-200" />
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-gray-400 uppercase tracking-wider">每人应付</span>
                                    <span className="text-base font-semibold text-gray-300 font-mono">--</span>
                                </div>
                                <div className="w-px h-4 bg-gray-200" />
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-gray-400 uppercase tracking-wider">每人优惠</span>
                                    <span className="text-base font-semibold text-orange-600 font-mono">¥{perPersonDiscount}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white border border-gray-200 shadow-sm flex-shrink-0 p-6 text-center space-y-3">
                        <h3 className="text-lg font-bold text-gray-900">Coupon Push</h3>
                        <p className="text-sm text-gray-400">
                            🍚 感谢您的饭卡，让我们每个人今天都省了一大笔伙食费！
                        </p>
                        <button
                            onClick={handlePush}
                            disabled={pushing}
                            className={`w-full py-4 text-white text-base font-bold rounded-lg hover:scale-[1.01] active:scale-[0.98] transition-all duration-300 hover:animate-pulse flex items-center justify-center gap-2.5 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:animate-none ${
                                mealType === "lunch"
                                    ? "bg-gradient-to-r from-amber-500 via-orange-500 to-pink-500 shadow-orange-500/25 hover:shadow-orange-500/40"
                                    : "bg-gradient-to-r from-violet-600 via-indigo-500 to-blue-500 shadow-indigo-500/25 hover:shadow-indigo-500/40"
                            }`}
                        >
                            <Gift size={20} />
                            {pushing ? "发放中..." : "Coupon Push!"}
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
}
