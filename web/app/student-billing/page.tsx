"use client";
import { useState } from "react";
import { User, Download } from "lucide-react";

const tabs = ["记账", "等付款", "历史记录"];
const mealOptions = ["午饭", "晚饭"];

const pendingPayments = [
    { id: 1, title: "Python 进阶课程", date: "2026-05-28", tag: "午饭", amount: 1200 },
    { id: 2, title: "React 项目辅导", date: "2026-05-27", tag: "晚饭", amount: 800 },
    { id: 3, title: "算法刷题陪练", date: "2026-05-26", tag: "午饭", amount: 500 },
    { id: 4, title: "Python 进阶课程", date: "2026-05-28", tag: "午饭", amount: 1200 },
    { id: 5, title: "React 项目辅导", date: "2026-05-27", tag: "晚饭", amount: 800 },
    { id: 6, title: "算法刷题陪练", date: "2026-05-26", tag: "午饭", amount: 500 },
    { id: 7, title: "Python 进阶课程", date: "2026-05-28", tag: "午饭", amount: 1200 },
    { id: 8, title: "React 项目辅导", date: "2026-05-27", tag: "晚饭", amount: 800 },
    { id: 9, title: "算法刷题陪练", date: "2026-05-26", tag: "午饭", amount: 500 },
    { id: 10, title: "Python 进阶课程", date: "2026-05-28", tag: "午饭", amount: 1200 },
    { id: 11, title: "React 项目辅导", date: "2026-05-27", tag: "晚饭", amount: 800 },
    { id: 12, title: "算法刷题陪练", date: "2026-05-26", tag: "午饭", amount: 500 },
    { id: 13, title: "Python 进阶课程", date: "2026-05-28", tag: "午饭", amount: 1200 },
    { id: 14, title: "React 项目辅导", date: "2026-05-27", tag: "晚饭", amount: 800 },
    { id: 15, title: "算法刷题陪练", date: "2026-05-26", tag: "午饭", amount: 500 },
    { id: 16, title: "Python 进阶课程", date: "2026-05-28", tag: "午饭", amount: 1200 },
    { id: 17, title: "React 项目辅导", date: "2026-05-27", tag: "晚饭", amount: 800 },
    { id: 18, title: "算法刷题陪练", date: "2026-05-26", tag: "午饭", amount: 500 },
];

const historyRecords = [
    { id: 1, title: "Python 进阶课程", date: "2026-05-28", tag: "已付款", amount: 1200 },
    { id: 2, title: "React 项目辅导", date: "2026-05-27", tag: "已付款", amount: 800 },
    { id: 3, title: "算法刷题陪练", date: "2026-05-26", tag: "已付款", amount: 500 },
    { id: 4, title: "Python 进阶课程", date: "2026-05-28", tag: "午饭", amount: 1200 },
    { id: 5, title: "React 项目辅导", date: "2026-05-27", tag: "晚饭", amount: 800 },
    { id: 6, title: "算法刷题陪练", date: "2026-05-26", tag: "午饭", amount: 500 },
    { id: 7, title: "Python 进阶课程", date: "2026-05-28", tag: "午饭", amount: 1200 },
    { id: 8, title: "React 项目辅导", date: "2026-05-27", tag: "晚饭", amount: 800 },
    { id: 9, title: "算法刷题陪练", date: "2026-05-26", tag: "午饭", amount: 500 },
    { id: 10, title: "Python 进阶课程", date: "2026-05-28", tag: "午饭", amount: 1200 },
    { id: 11, title: "React 项目辅导", date: "2026-05-27", tag: "晚饭", amount: 800 },
    { id: 12, title: "算法刷题陪练", date: "2026-05-26", tag: "午饭", amount: 500 },
    { id: 13, title: "Python 进阶课程", date: "2026-05-28", tag: "午饭", amount: 1200 },
    { id: 14, title: "React 项目辅导", date: "2026-05-27", tag: "晚饭", amount: 800 },
    { id: 15, title: "算法刷题陪练", date: "2026-05-26", tag: "午饭", amount: 500 },
    { id: 16, title: "Python 进阶课程", date: "2026-05-28", tag: "午饭", amount: 1200 },
    { id: 17, title: "React 项目辅导", date: "2026-05-27", tag: "晚饭", amount: 800 },
    { id: 18, title: "算法刷题陪练", date: "2026-05-26", tag: "午饭", amount: 500 },
];

function BillingItem({ title, date, tag, amount, isLast }: { title: string; date: string; tag: string; amount: number; isLast?: boolean; }) {
    return (
        <div className={`flex items-center justify-between py-3 ${isLast ? "" : "border-b border-gray-100"}`}>
            <div className="flex flex-col gap-0.5">
                <span className="text-sm font-medium text-gray-900">{title}</span>
                <span className="text-xs text-gray-400">{date} · {tag}</span>
            </div>
            <span className="text-sm font-mono font-semibold text-gray-900"> ¥{amount.toLocaleString()}.00 </span>
        </div>
    );
}

export default function StudentBillingPage() {
    const [selectedMeal, setSelectedMeal] = useState(0);
    const [activeTab, setActiveTab] = useState(0);
    const today = new Date().toLocaleDateString("zh-CN", {
        year: "numeric",
        month: "long",
        day: "numeric",
        weekday: "long",
    });

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center px-4 py-8">
            <div className="w-full max-w-md max-h-[calc(100vh-128px)] flex-1 flex flex-col">

                {/* Top: User Block */}
                <div className="flex items-center gap-4 mb-6">
                    <div className="w-14 h-14 rounded-full bg-gray-200 flex items-center justify-center">
                        <User size={24} className="text-gray-500" />
                    </div>
                    <div className="flex flex-col gap-0.5">
                        <span className="text-base font-semibold text-gray-900">张三</span>
                        <span className="text-sm text-gray-500">男</span>
                        <span className="text-xs text-gray-400">{today}</span>
                    </div>
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
                                        className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                                    />
                                </div>
                                {/* 午饭/晚饭滑块 */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700">午饭/晚饭？</label>
                                    <div className="relative flex bg-gray-100 rounded-lg p-1">
                                        <div
                                            className="absolute top-1 bottom-1 w-1/2 bg-white rounded-md shadow-sm transition-transform duration-300 ease-out"
                                            style={{ transform: `translateX(${selectedMeal * 100}%)` }}
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
                                <button className="w-full py-2.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors">
                                    提交
                                </button>
                            </div>
                        </div>

                        {/* Tab 2: 等付款 */}
                        {/* 修复关键点：添加 overflow-y-auto */}
                        {/* Tab 2: 等付款 */}
                        <div className="w-full flex-shrink-0 max-h-[calc(100vh-128px)] overflow-y-auto px-1  ">
                            <div className="bg-white border border-gray-200 shadow-sm p-6 w-full space-y-4 mb-82">
                                {pendingPayments.map((item, index) => (
                                    <BillingItem
                                        key={item.id}
                                        title={item.title}
                                        date={item.date}
                                        tag={item.tag}
                                        amount={item.amount}
                                        isLast={index === pendingPayments.length - 1}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Tab 3: 历史记录 */}
                        {/* 修复关键点：添加 overflow-y-auto */}
                        <div className="w-full flex-shrink-0 max-h-[calc(100vh-128px)] overflow-y-auto px-1">
                            <div className="bg-white border border-gray-200 shadow-sm p-6 w-full space-y-4 mb-82">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-semibold text-gray-900">历史账单</h3>
                                    <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors">
                                        <Download size={14} strokeWidth={2} /> 导出
                                    </button>
                                </div>
                                {historyRecords.map((item, index) => (
                                    <BillingItem
                                        key={item.id}
                                        title={item.title}
                                        date={item.date}
                                        tag={item.tag}
                                        amount={item.amount}
                                        isLast={index === historyRecords.length - 1}
                                    />
                                ))}
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