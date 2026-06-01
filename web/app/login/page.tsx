"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/utils/api";
import { setAccessToken, setRefreshToken, setUserIdentity } from "@/utils/token";

export default function LoginPage() {
    const router = useRouter();
    const [name, setName] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleLogin = async () => {
        if (!name || !password) {
            setError("请输入姓名和密码");
            return;
        }
        setLoading(true);
        setError("");
        try {
            const res = await api.post("/api/auth/login", {
                username: name,
                password,
            });
            const { access_token, refresh_token, user_identity } = res.data;
            setAccessToken(access_token);
            setRefreshToken(refresh_token);
            setUserIdentity(user_identity);
            if (user_identity === "mentor") {
                router.push("/mentor-dashboard");
            } else {
                router.push("/student-billing");
            }
        } catch {
            setError("用户名或密码错误");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex-1 flex items-center justify-center  bg-zinc-100 p-4 md:p-8">
            <div className="w-full max-w-md bg-white rounded-none shadow-lg p-8 md:p-12">
                <div className="text-blue-600 text-sm font-semibold tracking-widest uppercase mb-3">
                    Welcome back
                </div>

                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    登录
                </h1>

                <p className="text-gray-500 mb-10">
                    请输入姓名和密码以继续。
                </p>

                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">
                            姓名
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="请输入姓名"
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-gray-300 focus:ring-2 focus:ring-gray-100 transition-all"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">
                            密码
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="请输入密码"
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-gray-300 focus:ring-2 focus:ring-gray-100 transition-all"
                            onKeyDown={(e) => {
                                if (e.key === "Enter") handleLogin();
                            }}
                        />
                    </div>

                    {error && (
                        <p className="text-red-500 text-sm">{error}</p>
                    )}

                    <button
                        onClick={handleLogin}
                        disabled={loading}
                        className="w-full bg-gray-900 text-white py-3 mt-2 rounded-xl font-semibold hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? "登录中..." : "登录"}
                    </button>
                </div>
            </div>
        </div>
    );
}
