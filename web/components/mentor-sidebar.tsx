"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Home, LayoutDashboard, Plus } from "lucide-react";

const dates = [
  { label: "5.28/2026", href: "/mentor-dashboard?date=5.28" },
  { label: "5.27/2026", href: "/mentor-dashboard?date=5.27" },
  { label: "5.26/2026", href: "/mentor-dashboard?date=5.26" },
  { label: "5.25/2026", href: "/mentor-dashboard?date=5.25" },
  { label: "5.24/2026", href: "/mentor-dashboard?date=5.24" },
  { label: "5.23/2026", href: "/mentor-dashboard?date=5.23" },
  { label: "5.22/2026", href: "/mentor-dashboard?date=5.22" },
];

export default function MentorSidebar() {
  const searchParams = useSearchParams();
  const currentDate = searchParams.get("date") || "5.28";

  return (
    <aside className="w-64 h-screen bg-white border-r border-gray-200 flex flex-col">
      {/* 顶部导航 */}
      <nav className="p-4 space-y-1">
        <Link
          href="/"
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
        >
          <Home size={16} strokeWidth={2} />
          Home
        </Link>
        <Link
          href="/mentor-dashboard"
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-900 bg-gray-100 transition-colors"
        >
          <LayoutDashboard size={16} strokeWidth={2} />
          Dashboard
        </Link>
      </nav>

      {/* 分割线 */}
      <div className="mx-4 border-t border-gray-100" />

      {/* 每日列表 */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="flex items-center justify-between mb-2 px-3">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            每日
          </h3>
        </div>
        <button className="w-full flex items-center justify-center gap-1.5 px-3 py-2 mb-2 rounded-md border border-dashed border-gray-300 text-sm text-gray-500 hover:border-gray-400 hover:text-gray-700 hover:bg-gray-50 transition-colors">
          <Plus size={14} strokeWidth={2} />
        </button>
        <ul className="space-y-0.5">
          {dates.map((date) => {
            const isActive = currentDate === date.label.split("/")[0];
            return (
              <li key={date.href}>
                <Link
                  href={date.href}
                  className={`
                    flex items-center px-3 py-2 rounded-md text-sm transition-colors
                    ${isActive
                      ? "bg-gray-50 text-gray-900 font-semibold"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    }
                  `}
                >
                  {isActive && (
                    <span className="w-1 h-4 bg-blue-600 rounded-full mr-3" />
                  )}
                  {!isActive && <span className="w-1 h-4 mr-3" />}
                  {date.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      {/* 底部用户信息 */}
      <div className="p-4 border-t border-gray-200">
        <div className="px-3 py-2">
          <p className="text-sm font-medium text-gray-900">Mentor 张</p>
          <p className="text-xs text-gray-500 mt-0.5">导师</p>
        </div>
      </div>
    </aside>
  );
}
