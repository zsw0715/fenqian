"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, ChevronLeft, ChevronRight, Moon, Utensils, Download, Pencil } from "lucide-react";
import { toast } from "sonner";
import api from "@/utils/api";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const PAGE_SIZE = 8;

function EditDialog({
    open,
    item,
    onClose,
    onSaved,
}: {
    open: boolean;
    item: BillingItem | null;
    onClose: () => void;
    onSaved: () => void;
}) {
    const [amount, setAmount] = useState("");
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (item) setAmount(String(item.original_amount));
    }, [item]);

    if (!item) return null;

    const handleSave = async () => {
        const val = parseFloat(amount);
        if (isNaN(val) || val <= 0) {
            toast.error("请输入有效金额");
            return;
        }
        setSaving(true);
        try {
            await api.put("/api/billing/edit", {
                original_amount: val,
                dining_type: item.dining_type,
                already_paid: item.already_paid,
            }, {
                params: { bill_id: item.id },
            });
            toast.success("修改成功");
            onSaved();
            onClose();
        } catch {
            toast.error("修改失败");
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={(open) => { if (!open) onClose(); }}>
            <DialogContent className="sm:max-w-sm">
                <DialogHeader>
                    <DialogTitle>修改账单</DialogTitle>
                    <DialogDescription>
                        当前原价：<span className="font-mono font-medium text-foreground">¥{item.original_amount.toFixed(2)}</span>
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-2">
                    <label className="text-sm font-medium">新原价</label>
                    <Input
                        type="number"
                        step="0.01"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="输入新原价"
                        autoFocus
                    />
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>取消</Button>
                    <Button onClick={handleSave} disabled={saving}>
                        {saving ? "保存中..." : "确认"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

type BillingItem = {
    id: string;
    student_name: string;
    dining_type: string;
    original_amount: number;
    discount_amount: number;
    already_paid: boolean;
    created_at: string;
};

export default function RecentBillings({ date, mealType, onExport }: { date?: string; mealType?: string; onExport?: () => void }) {
    const [billings, setBillings] = useState<BillingItem[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(0);
    const [editItem, setEditItem] = useState<BillingItem | null>(null);
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

    const fetchBillings = useCallback(async (p: number, d?: string) => {
        console.log("mealType", mealType);
        try {
            const params: Record<string, string | number> = { page: p, page_size: PAGE_SIZE, dining_type: mealType || "" };
            if (d) { params.date = d; params.sort_by = "name_asc"; }
            const res = await api.get("/api/billing/recent", { params });
            setBillings(res.data.items);
            setTotal(res.data.total);
        } catch { }
    }, [mealType]);

    useEffect(() => {
        fetchBillings(page, date);
    }, [page, date, fetchBillings, mealType]);

    const togglePaid = async (b: BillingItem) => {
        const newPaid = !b.already_paid;
        setBillings((prev) =>
            prev.map((item) => (item.id === b.id ? { ...item, already_paid: newPaid } : item))
        );
        try {
            await api.put("/api/billing/edit", {
                original_amount: b.original_amount,
                dining_type: b.dining_type,
                already_paid: newPaid,
            }, {
                params: { bill_id: b.id },
            });
        } catch {
            setBillings((prev) =>
                prev.map((item) => (item.id === b.id ? { ...item, already_paid: b.already_paid } : item))
            );
            toast.error("更新失败");
        }
    };

    return (
        <div className="bg-white rounded-none border border-gray-200 shadow-sm flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
                <div className="flex items-center gap-3">
                    <h2 className="text-base font-semibold text-gray-900">Recent Billings</h2>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => setPage((p) => Math.max(0, p - 1))}
                            disabled={page === 0}
                            className="p-1 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronLeft size={16} strokeWidth={2} />
                        </button>
                        <span className="text-xs text-gray-500 font-mono">
                            {page + 1} / {totalPages}
                        </span>
                        <button
                            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                            disabled={page >= totalPages - 1}
                            className="p-1 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronRight size={16} strokeWidth={2} />
                        </button>
                    </div>
                </div>
                {onExport && (
                    <button
                        onClick={onExport}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                    >
                        <Download size={14} />
                        导出 CSV
                    </button>
                )}
            </div>

            {/* Table header — hidden on mobile */}
            <div className="hidden md:grid grid-cols-[1fr_80px_170px_100px_60px_40px] px-6 py-2.5 bg-gray-50 border-b border-gray-100">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Student</span>
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Meal</span>
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</span>
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Amount</span>
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">Paid</span>
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">Edit</span>
            </div>

            <ul className="divide-y divide-gray-100">
                {billings.map((b) => (
                    <li
                        key={b.id}
                        className="group px-4 md:px-6 py-3 md:py-4 hover:bg-gray-50 transition-colors"
                    >
                        {/* Desktop: 5-column grid */}
                        <div className="hidden md:grid grid-cols-[1fr_80px_170px_100px_60px_40px] items-center">
                            <span className="text-sm font-medium text-gray-900 truncate pr-4">{b.student_name}</span>
                            <span className="text-sm text-gray-500 flex items-center gap-1.5">
                                {b.dining_type === "lunch" ? (
                                    <><Utensils size={13} className="text-orange-500" /> 午饭</>
                                ) : (
                                    <><Moon size={13} className="text-indigo-500" /> 晚饭</>
                                )}
                            </span>
                            <span className="text-sm text-gray-500 font-mono text-xs">{b.created_at}</span>
                            <span className="text-sm text-right">
                                {b.discount_amount > 0 ? (
                                    <div className="flex flex-col items-end">
                                        <span className="text-xs text-gray-400 line-through font-mono">¥{b.original_amount.toFixed(2)}</span>
                                        <span className="text-sm font-mono font-semibold text-orange-600">¥{(b.original_amount - b.discount_amount).toFixed(2)}</span>
                                    </div>
                                ) : (
                                    <span className="text-sm font-mono font-semibold text-gray-900">¥{b.original_amount.toFixed(2)}</span>
                                )}
                            </span>
                            <span className="flex justify-center">
                                <button
                                    onClick={() => togglePaid(b)}
                                    className="cursor-pointer p-1 rounded hover:bg-gray-100 transition-colors"
                                    title={b.already_paid ? "点击标记为未付" : "点击标记为已付"}
                                >
                                    {b.already_paid ? (
                                        <Check size={16} className="text-green-500" strokeWidth={3} />
                                    ) : (
                                        <span className="text-xs text-gray-300 group-hover:text-gray-500">—</span>
                                    )}
                                </button>
                            </span>
                            <span className="flex justify-center">
                                <button
                                    onClick={() => setEditItem(b)}
                                    className="cursor-pointer p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-gray-100 transition-all"
                                    title="编辑"
                                >
                                    <Pencil size={14} className="text-gray-400 hover:text-blue-500" />
                                </button>
                            </span>
                        </div>

                        {/* Mobile: card layout */}
                        <div className="flex md:hidden items-center justify-between">
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium text-gray-900 truncate">{b.student_name}</span>
                                    {b.dining_type === "lunch" ? (
                                        <Utensils size={12} className="text-orange-500 flex-shrink-0" />
                                    ) : (
                                        <Moon size={12} className="text-indigo-500 flex-shrink-0" />
                                    )}
                                </div>
                                <span className="text-xs text-gray-400 font-mono">{b.created_at}</span>
                            </div>
                            <div className="flex items-center gap-3 flex-shrink-0">
                                <div className="text-right">
                                    {b.discount_amount > 0 ? (
                                        <div className="flex flex-col items-end">
                                            <span className="text-xs text-gray-400 line-through font-mono">¥{b.original_amount.toFixed(2)}</span>
                                            <span className="text-sm font-mono font-semibold text-orange-600">¥{(b.original_amount - b.discount_amount).toFixed(2)}</span>
                                        </div>
                                    ) : (
                                        <span className="text-sm font-mono font-semibold text-gray-900">¥{b.original_amount.toFixed(2)}</span>
                                    )}
                                </div>
                                <button
                                    onClick={() => togglePaid(b)}
                                    className="cursor-pointer p-1.5 rounded hover:bg-gray-100 transition-colors"
                                    title={b.already_paid ? "点击标记为未付" : "点击标记为已付"}
                                >
                                    {b.already_paid ? (
                                        <Check size={18} className="text-green-500" strokeWidth={3} />
                                    ) : (
                                        <span className="text-xs text-gray-300 group-hover:text-gray-500">—</span>
                                    )}
                                </button>
                                <button
                                    onClick={() => setEditItem(b)}
                                    className="cursor-pointer p-1.5 rounded hover:bg-gray-100 transition-colors"
                                    title="编辑"
                                >
                                    <Pencil size={16} className="text-gray-400" />
                                </button>
                            </div>
                        </div>
                    </li>
                ))}
                {billings.length < PAGE_SIZE &&
                    Array.from({ length: PAGE_SIZE - billings.length }).map((_, i) => (
                        <li key={`empty-${i}`} className="hidden md:grid grid-cols-[1fr_80px_170px_100px_60px_40px] items-center px-6 py-4">
                            <span className="text-sm text-white">placeholder</span>
                            <span className="text-sm text-white">placeholder</span>
                            <span className="text-sm text-white">placeholder</span>
                            <span className="text-sm text-white">placeholder</span>
                            <span className="text-sm text-white">placeholder</span>
                            <span className="text-sm text-white">placeholder</span>
                        </li>
                    ))}
                {billings.length === 0 && (
                    <li className="px-6 py-8 text-center text-sm text-gray-400">暂无账单</li>
                )}
            </ul>

            <EditDialog
                open={!!editItem}
                item={editItem}
                onClose={() => setEditItem(null)}
                onSaved={() => fetchBillings(page, date)}
            />
        </div>
    );
}
