"use client";

import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { Gift, Menu, Moon, Utensils, X } from "lucide-react";
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
    const [totalAmount, setTotalAmount] = useState(0);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const isSixDiscount = totalAmount > 0 && totalAmount <= 40;
    const perPersonDiscount = eaterCount > 0
        ? (LUNCH_DISCOUNT / eaterCount).toFixed(2)
        : "0.00";

    useEffect(() => {
        api.get("/api/fenqian/auth/me").then((res) => {
            setUsername(res.data.username);
            setGender(res.data.gender);
        }).catch(() => { });
        api.get("/api/fenqian/billing/dates").then((res) => {
            setDates(res.data);
        }).catch(() => { });
    }, []);

    useEffect(() => {
        if (!date) return;
        api.get("/api/fenqian/billing/recent", {
            params: { page: 0, page_size: 1000, date, dining_type: mealType },
        }).then((res) => {
            setEaterCount(res.data.total);
            const items = res.data.items as { original_amount: number }[];
            setTotalAmount(items.reduce((s, i) => s + i.original_amount, 0));
        }).catch(() => { });
    }, [date, mealType, pushCount]);

    const handleExport = async () => {
        try {
            const res = await api.get("/api/fenqian/billing/recent", {
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
            const res = await api.post("/api/fenqian/billing/push_coupon", {
                date,
                dining_type: mealType,
            });
            const { eater_count, per_person_discount, mode } = res.data;
            if (mode === "six_discount") {
                toast.success(`发放成功！${eater_count} 人，总优惠 ¥${per_person_discount}（每人六折）`);
            } else {
                toast.success(`发放成功！${eater_count} 人，每人优惠约 ¥${per_person_discount}`);
            }
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
            {/* Desktop sidebar */}
            <div className="hidden md:flex">
                <MentorSidebar username={username} gender={gender} dates={dates} />
            </div>

            {/* Mobile drawer overlay */}
            {sidebarOpen && (
                <div className="fixed inset-0 z-50 md:hidden">
                    <div
                        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                        onClick={() => setSidebarOpen(false)}
                    />
                    <div className="absolute left-0 top-0 bottom-0 w-64 bg-white shadow-2xl flex flex-col animate-in slide-in-from-left duration-200">
                        <div className="flex items-center justify-between p-4 border-b border-gray-100 flex-shrink-0">
                            <span className="text-sm font-semibold text-gray-700">导航</span>
                            <button
                                onClick={() => setSidebarOpen(false)}
                                className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400"
                            >
                                <X size={18} />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto">
                            <MentorSidebar username={username} gender={gender} dates={dates} />
                        </div>
                    </div>
                </div>
            )}

            <main className="flex-1 flex flex-col p-4 md:p-8 overflow-y-auto md:overflow-hidden">
                {/* Header row: hamburger + title */}
                <div className="flex items-center gap-3 mb-6 md:mb-8 flex-shrink-0">
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="md:hidden p-2 -ml-2 rounded-lg hover:bg-gray-200 text-gray-600"
                    >
                        <Menu size={20} />
                    </button>
                    <h1 className="text-xl md:text-2xl font-bold text-gray-900">Daily Detail</h1>
                </div>

                <div className="flex flex-col gap-4 md:gap-6 flex-1 min-h-0">
                    <div className="flex-shrink-0">
                        <RecentBillings date={date} key={pushCount} mealType={mealType} onExport={handleExport} />
                    </div>

                    {/* Split bar */}
                    <div className="bg-white border border-gray-200 shadow-sm flex-shrink-0">
                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-6 px-4 md:px-6 py-3 md:py-3.5 border-b border-gray-100">
                            {/* Row 1: Split + toggle + tag */}
                            <div className="flex items-center gap-3">
                                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Split</span>

                                <div className="relative flex bg-gray-100 rounded-lg p-0.5 w-40 md:w-44">
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
                                    {!isSixDiscount ? (
                                        <span>¥{LUNCH_DISCOUNT} off</span>
                                    ) : (
                                        <span>六折 off</span>
                                    )}
                                </span>
                            </div>

                            {/* Row 2: stats grid */}
                            <div className="flex items-center justify-between md:justify-end md:flex-1 md:gap-6">
                                <div className="flex items-center gap-1.5 md:gap-2">
                                    <span className="text-xs text-gray-400">{mealType === "lunch" ? "吃饭人数" : "吃饭人数"}</span>
                                    <span className="text-sm md:text-base font-semibold text-gray-900 font-mono">{eaterCount}</span>
                                </div>
                                <div className="hidden md:block w-px h-4 bg-gray-200" />
                                <div className="flex items-center gap-1.5 md:gap-2">
                                    <span className="text-xs text-gray-400">总价</span>
                                    <span className="text-sm md:text-base font-semibold text-gray-900 font-mono">¥{totalAmount.toFixed(2)}</span>
                                </div>
                                <div className="hidden md:block w-px h-4 bg-gray-200" />
                                {isSixDiscount ? (
                                    <div className="flex items-center gap-1.5 md:gap-2">
                                        <span className="text-xs text-gray-400">每人优惠</span>
                                        <span className="text-sm md:text-base font-semibold text-orange-600 font-mono">六折</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-1.5 md:gap-2">
                                        <span className="text-xs text-gray-400">每人优惠</span>
                                        <span className="text-sm md:text-base font-semibold text-orange-600 font-mono">¥{perPersonDiscount}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="bg-white border border-gray-200 shadow-sm flex-shrink-0 p-4 md:p-6 text-center space-y-3">
                        <h3 className="text-base md:text-lg font-bold text-gray-900">Coupon Push</h3>
                        <p className="text-xs md:text-sm text-gray-400">
                            🍚 感谢您的饭卡，让我们每个人今天都省了一大笔伙食费！
                        </p>
                        <button
                            onClick={handlePush}
                            disabled={pushing}
                            className={`w-full py-3 md:py-4 text-white text-sm md:text-base font-bold rounded-lg hover:scale-[1.01] active:scale-[0.98] transition-all duration-300 hover:animate-pulse flex items-center justify-center gap-2.5 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:animate-none ${mealType === "lunch"
                                    ? "bg-gradient-to-r from-amber-500 via-orange-500 to-pink-500 shadow-orange-500/25 hover:shadow-orange-500/40"
                                    : "bg-gradient-to-r from-violet-600 via-indigo-500 to-blue-500 shadow-indigo-500/25 hover:shadow-indigo-500/40"
                                }`}
                        >
                            <Gift size={18} className="md:w-5 md:h-5" />
                            {pushing ? "发放中..." : "Coupon Push!"}
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
}
