"use client";

import { useState } from "react";

export default function LoginPage() {
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");

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
            />
          </div>

          <button
            onClick={() => console.log("login", { name, password })}
            className="w-full bg-gray-900 text-white py-3 mt-2 rounded-xl font-semibold hover:bg-gray-800 transition-colors"
          >
            登录
          </button>
        </div>
      </div>
    </div>
  );
}
