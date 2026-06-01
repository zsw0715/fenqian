"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Download, LogOut, Mars, Venus } from "lucide-react";
import api from "@/utils/api";
import { clearAuth } from "@/utils/token";

const tabs = ["记账", "等付款", "历史记录"];
const mealOptions = ["午饭", "晚饭"];

type BillRecord = {
    id: string;
    dining_type: string;
    original_amount: number;
    discount_amount: number;
    already_paid: boolean;
    created_at: string;
};

function formatDateLabel(dateStr: string): string {
    const d = new Date(dateStr.replace(" ", "T"));
    return `${d.getMonth() + 1}月${d.getDate()}日`;
}

function groupByDate(bills: BillRecord[]): { label: string; items: BillRecord[] }[] {
    const groups: { label: string; items: BillRecord[] }[] = [];
    for (const b of bills) {
        const label = formatDateLabel(b.created_at);
        const last = groups[groups.length - 1];
        if (last && last.label === label) {
            last.items.push(b);
        } else {
            groups.push({ label, items: [b] });
        }
    }
    return groups;
}

export default function StudentBillingPage() {
    const router = useRouter();
    const [selectedMeal, setSelectedMeal] = useState(0);
    const [activeTab, setActiveTab] = useState(0);
    const [amount, setAmount] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [username, setUsername] = useState("");
    const [gender, setGender] = useState("");
    const [billList, setBillList] = useState<BillRecord[]>([]);
    const today = new Date().toLocaleDateString("zh-CN", {
        year: "numeric",
        month: "long",
        day: "numeric",
        weekday: "long",
    });

    const fetchBills = async () => {
        try {
            const res = await api.get("/api/billing/list_by_username");
            setBillList(res.data);
        } catch {}
    };

    useEffect(() => {
        api.get("/api/auth/me").then((res) => {
            setUsername(res.data.username);
            setGender(res.data.gender);
        }).catch(() => {});
        fetchBills();
    }, []);

    const handleSubmit = async () => {
        if (!amount || Number(amount) <= 0) {
            toast.error("请输入有效金额");
            return;
        }
        setSubmitting(true);
        try {
            await api.post("/api/billing/add", {
                original_amount: Number(amount),
                dining_type: selectedMeal === 0 ? "lunch" : "dinner",
            });
            toast.success("提交成功");
            setAmount("");
            fetchBills();
        } catch {
            toast.error("提交失败，请重试");
        } finally {
            setSubmitting(false);
        }
    };

    const handleExport = () => {
        if (billList.length === 0) {
            toast.error("暂无数据可导出");
            return;
        }
        const weeks = new Map<string, BillRecord[]>();
        for (const b of billList) {
            const d = new Date(b.created_at.replace(" ", "T"));
            const day = d.getDay();
            const diff = day === 0 ? -6 : 1 - day;
            const monday = new Date(d);
            monday.setDate(monday.getDate() + diff);
            const key = `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, "0")}-${String(monday.getDate()).padStart(2, "0")}`;
            if (!weeks.has(key)) weeks.set(key, []);
            weeks.get(key)!.push(b);
        }

        const weekdayLabels = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
        const sortedWeeks = Array.from(weeks.entries()).sort(([a], [b]) => a.localeCompare(b));
        const header = "餐次,原价,优惠,实付,已付款,时间";
        const sections: string[] = [];

        for (const [key, weekItems] of sortedWeeks) {
            const [y, m, d] = key.split("-").map(Number);
            const monday = new Date(y, m - 1, d);
            const sunday = new Date(monday);
            sunday.setDate(sunday.getDate() + 6);
            const wkLabel = `${monday.getMonth() + 1}月${monday.getDate()}日（${weekdayLabels[monday.getDay()]}） --- ${sunday.getMonth() + 1}月${sunday.getDate()}日（${weekdayLabels[sunday.getDay()]}）`;
            sections.push(wkLabel);
            sections.push(header);
            for (const b of weekItems) {
                const meal = b.dining_type === "lunch" ? "午饭" : "晚饭";
                const final = (b.original_amount - b.discount_amount).toFixed(2);
                sections.push(`${meal},${b.original_amount},${b.discount_amount},${final},${b.already_paid ? "是" : "否"},${b.created_at}`);
            }
            sections.push("");
        }

        const csv = "\uFEFF" + sections.join("\n");
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `billing_${username || "me"}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success("导出成功");
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center px-4 py-8">
            <div className="w-full max-w-md max-h-[calc(100vh-128px)] flex-1 flex flex-col">

                {/* Top: User Block */}
                <div className="flex items-center justify-between gap-4 mb-6">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-full bg-gray-900 flex items-center justify-center">
                            <span className="text-white text-xl font-semibold">{username ? username.charAt(0) : ""}</span>
                        </div>
                        <div className="flex flex-col gap-0.5">
                            <span className="text-base font-semibold text-gray-900">{username || "加载中..."}</span>
                            <span className="text-sm text-gray-500 flex items-center gap-1">
                                {gender === "male" ? (
                                    <><Mars size={14} className="text-blue-500" /> 男</>
                                ) : gender === "female" ? (
                                    <><Venus size={14} className="text-pink-500" /> 女</>
                                ) : null}
                            </span>
                            <span className="text-xs text-gray-400">{today}</span>
                        </div>
                    </div>
                    <button
                        onClick={() => { clearAuth(); router.replace("/"); }}
                        className="p-2.5 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                        title="退出登录"
                    >
                        <LogOut size={18} strokeWidth={2} />
                    </button>
                </div>

                {/* Middle: Content Area with horizontal slide */}
                {/* 修复关键点：添加 min-h-0 强制约束内部高度 */}
                <div className="flex-1 overflow-hidden relative min-h-0">
                    <div
                        className="flex h-full transition-transform duration-300 ease-out"
                        style={{ transform: `translateX(-${activeTab * 100}%)` }}
                    >

                        {/* Tab 1: 记账 */}
                        {/* 修复关键点：添加 overflow-y-auto */}
                        <div className="w-full flex-shrink-0 h-full overflow-y-auto px-1">
                            <div className="bg-white border border-gray-200 shadow-sm p-6 space-y-5 w-full">
                                {/* 原价输入 */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700">原价</label>
                                    <input
                                        type="number"
                                        placeholder="请输入金额"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        className="w-full mt-2 px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                                    />
                                </div>
                                {/* 午饭/晚饭滑块 */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700">午饭/晚饭？</label>
                                    <div className="relative flex bg-gray-100 rounded-lg p-1 mt-2">
                                        <div
                                            className="absolute top-1 bottom-1 w-1/2 bg-white rounded-md shadow-sm transition-transform duration-300 ease-out"
                                            style={{ transform: `translateX(${selectedMeal * 95}%)` }}
                                        />
                                        {mealOptions.map((option, index) => (
                                            <button
                                                key={option}
                                                onClick={() => setSelectedMeal(index)}
                                                className={`relative z-10 flex-1 py-2 text-sm font-medium rounded-md transition-colors duration-300 ${selectedMeal === index ? "text-gray-900" : "text-gray-500 hover:text-gray-700"
                                                    }`}
                                            >
                                                {option}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                {/* 提交按钮 */}
                                <button
                                    onClick={handleSubmit}
                                    disabled={submitting}
                                    className="w-full py-2.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {submitting ? "提交中..." : "提交"}
                                </button>
                            </div>
                        </div>

                        {/* Tab 2: 等付款 */}
                        <div className="w-full flex-shrink-0 max-h-[calc(100vh-128px)] overflow-y-auto px-1">
                            <div className="bg-white border border-gray-200 shadow-sm p-6 w-full space-y-4 mb-82">
                                {billList.filter((b) => !b.already_paid).length === 0 ? (
                                    <p className="text-sm text-gray-400 text-center py-6">暂无待付款账单 🎉</p>
                                ) : (
                                    <>
                                        {groupByDate(billList.filter((b) => !b.already_paid)).map((group) => (
                                            <div key={group.label}>
                                                <div className="flex items-center gap-3 py-2">
                                                    <div className="flex-1 h-px bg-gray-100" />
                                                    <span className="text-xs text-gray-400 whitespace-nowrap">{group.label}</span>
                                                    <div className="flex-1 h-px bg-gray-100" />
                                                </div>
                                                {group.items.map((item, index) => (
                                                    <div key={item.id} className={`flex items-center justify-between py-3 ${index === group.items.length - 1 ? "" : "border-b border-gray-100"}`}>
                                                        <div className="flex flex-col gap-0.5">
                                                            <span className="text-sm font-medium text-gray-900">{item.dining_type === "lunch" ? "午饭" : "晚饭"}</span>
                                                            <span className="text-xs text-gray-400">{item.created_at}</span>
                                                        </div>
                                                        <div className="text-right">
                                                            <span className="text-sm font-mono font-semibold text-red-500">¥{(item.original_amount - item.discount_amount).toLocaleString()}</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ))}
                                        <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                                            <span className="text-sm font-medium text-gray-500">待付合计</span>
                                            <span className="text-lg font-mono font-bold text-red-500">
                                                ¥{billList.filter((b) => !b.already_paid).reduce((sum, b) => sum + b.original_amount - b.discount_amount, 0).toLocaleString()}
                                            </span>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Tab 3: 历史记录 */}
                        {/* 修复关键点：添加 overflow-y-auto */}
                        <div className="w-full flex-shrink-0 max-h-[calc(100vh-128px)] overflow-y-auto px-1">
                            <div className="bg-white border border-gray-200 shadow-sm p-6 w-full space-y-4 mb-82">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-semibold text-gray-900">历史账单</h3>
                                    <button
                                        onClick={handleExport}
                                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors"
                                    >
                                        <Download size={14} strokeWidth={2} /> 导出
                                    </button>
                                </div>
                                {billList.length === 0 ? (
                                    <p className="text-sm text-gray-400 text-center py-6">暂无账单记录</p>
                                ) : (
                                    groupByDate(billList).map((group) => (
                                        <div key={group.label}>
                                            <div className="flex items-center gap-3 py-2">
                                                <div className="flex-1 h-px bg-gray-100" />
                                                <span className="text-xs text-gray-400 whitespace-nowrap">{group.label}</span>
                                                <div className="flex-1 h-px bg-gray-100" />
                                            </div>
                                            {group.items.map((item, index) => (
                                                <div key={item.id} className={`flex items-center justify-between py-3 ${index === group.items.length - 1 ? "" : "border-b border-gray-100"}`}>
                                                    <div className="flex flex-col gap-0.5">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-sm font-medium text-gray-900">{item.dining_type === "lunch" ? "午饭" : "晚饭"}</span>
                                                            {item.already_paid && (
                                                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-100 text-green-700 font-medium">已付</span>
                                                            )}
                                                        </div>
                                                        <span className="text-xs text-gray-400">{item.created_at}</span>
                                                    </div>
                                                    <div className="text-right">
                                                        {item.discount_amount > 0 ? (
                                                            <>
                                                                <span className="text-xs text-gray-400 line-through font-mono">¥{item.original_amount.toLocaleString()}</span>
                                                                <br />
                                                                <span className="text-sm font-mono font-semibold text-orange-600">¥{(item.original_amount - item.discount_amount).toLocaleString()}</span>
                                                            </>
                                                        ) : (
                                                            <span className="text-sm font-mono font-semibold text-gray-900">¥{item.original_amount.toLocaleString()}</span>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom: Toggle */}
                <div className="relative flex bg-white rounded-xl border border-gray-200 shadow-sm p-1 mt-6">
                    <div
                        className="absolute top-1 bottom-1 w-1/3 bg-gray-900 rounded-lg transition-transform duration-300 ease-out"
                        style={{ transform: `translateX(${activeTab * 97}%)` }}
                    />
                    {tabs.map((tab, index) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(index)}
                            className={`relative z-10 flex-1 py-2.5 text-sm font-medium rounded-lg transition-colors duration-300 ${activeTab === index ? "text-white" : "text-gray-500 hover:text-gray-700"
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}