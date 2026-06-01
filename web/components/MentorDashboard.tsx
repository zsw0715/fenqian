"use client";

import { useState } from "react";

const mockDates = ["周一", "周二", "周三", "周四", "周五"];

export default function MentorDashboard() {
  const [selectedDate, setSelectedDate] = useState("周三");

  return (
    <div className="flex flex-1 gap-6 p-6 h-full">
      {/* 左侧边栏 */}
      <aside className="w-64 flex flex-col gap-4">
        {/* 每日 */}
        <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex flex-col">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">每日</h3>
          <div className="flex-1 flex items-center justify-center text-gray-300 text-sm">
            {/* 日历占位 */}
            <div className="text-center space-y-2">
              <div className="text-4xl font-bold text-gray-900">24</div>
              <div className="text-gray-500">六月</div>
            </div>
          </div>
        </div>

        {/* 姓名 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-2">姓名</h3>
          <div className="text-gray-500 text-sm">Mentor 张</div>
        </div>
      </aside>

      {/* 右侧主内容 */}
      <main className="flex-1 flex flex-col gap-6">
        {/* 顶部导航栏 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button className="px-4 py-2 bg-white rounded-xl border border-gray-100 text-sm font-medium text-gray-600 hover:border-gray-200 transition-colors">
              Home
            </button>
            <button className="px-4 py-2 bg-white rounded-xl border border-gray-100 text-sm font-medium text-gray-600 hover:border-gray-200 transition-colors">
              Dashboard
            </button>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
        </div>

        {/* 今日日期 */}
        <div className="text-gray-500 text-sm">
          今日日期：2026年6月1日
        </div>

        {/* Student 区域 */}
        <div className="flex gap-6">
          <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 p-6 min-h-[240px]">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Student</h3>
            <div className="text-gray-400 text-sm">
              学生列表将展示在这里
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="w-40 flex flex-col gap-3">
            <button className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 p-4 text-sm font-semibold text-gray-900 hover:shadow-md hover:border-gray-200 transition-all flex items-center justify-center">
              添加学生
            </button>
            <button className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 p-4 text-sm font-semibold text-gray-900 hover:shadow-md hover:border-gray-200 transition-all flex items-center justify-center">
              删除学生
            </button>
          </div>
        </div>

        {/* 账单区域 */}
        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-4">账单</h3>
          <div className="flex gap-4">
            {mockDates.map((date) => (
              <button
                key={date}
                onClick={() => setSelectedDate(date)}
                className={`flex-1 bg-white rounded-2xl border p-6 text-center transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 ${
                  selectedDate === date
                    ? "border-gray-900 shadow-md"
                    : "border-gray-100"
                }`}
              >
                <div className="text-sm font-semibold text-gray-900">{date}</div>
              </button>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
