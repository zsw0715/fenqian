"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, LayoutDashboard, LogOut, Mars, Plus, Venus } from "lucide-react";
import { clearAuth } from "@/utils/token";

type DateItem = { value: string; label: string };

interface MentorSidebarProps {
    username: string;
    gender: string;
    dates: DateItem[];
}

export default function MentorSidebar({ username, gender, dates }: MentorSidebarProps) {
    const pathname = usePathname();
    const segments = pathname.split("/");
    const currentDate = segments.length > 2 ? segments[segments.length - 1] : "";

    const handleLogout = () => {
        clearAuth();
        window.location.replace("/");
    };

    return (
        <aside className="w-64 h-screen bg-white border-r border-gray-200 flex flex-col">
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
                    className={`
                        flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                        ${!currentDate ? "text-gray-900 bg-gray-100" : "text-gray-600 hover:bg-gray-50"}
                    `}
                >
                    <LayoutDashboard size={16} strokeWidth={2} />
                    Dashboard
                </Link>
            </nav>

            <div className="mx-4 border-t border-gray-100" />

            <div className="flex-1 overflow-y-auto p-4">
                <div className="flex items-center justify-between mb-2 px-3">
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        每日
                    </h3>
                </div>
                {/* <button className="w-full flex items-center justify-center gap-1.5 px-3 py-2 mb-2 rounded-md border border-dashed border-gray-300 text-sm text-gray-500 hover:border-gray-400 hover:text-gray-700 hover:bg-gray-50 transition-colors">
                    <Plus size={14} strokeWidth={2} />
                </button> */}
                <ul className="space-y-0.5">
                    {dates.map((date) => {
                        const isActive = currentDate === date.value;
                        return (
                            <li key={date.value}>
                                <Link
                                    href={`/mentor-dashboard/${date.value}`}
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
                    {dates.length === 0 && (
                        <p className="text-xs text-gray-400 px-3 py-4">暂无记录</p>
                    )}
                </ul>
            </div>

            <div className="p-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 px-1 py-1">
                        <div className="w-9 h-9 rounded-full bg-gray-900 flex items-center justify-center flex-shrink-0">
                            <span className="text-white text-sm font-semibold">{username ? username.charAt(0) : ""}</span>
                        </div>
                        <div className="flex flex-col min-w-0">
                            <span className="text-sm font-medium text-gray-900 truncate">{username || "加载中..."}</span>
                            <span className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                                {gender === "male" ? (
                                    <><Mars size={12} className="text-blue-500" /> 男</>
                                ) : gender === "female" ? (
                                    <><Venus size={12} className="text-pink-500" /> 女</>
                                ) : null}
                            </span>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                        title="退出登录"
                    >
                        <LogOut size={16} strokeWidth={2} />
                    </button>
                </div>
            </div>
        </aside>
    );
}
