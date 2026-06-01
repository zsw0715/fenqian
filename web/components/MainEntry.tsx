"use client";

import { useRouter } from "next/navigation";

const MainEntry = () => {
    const router = useRouter();

    return (
        <div className="flex-1 flex items-center justify-center p-4 md:p-8">
            <div className="w-full max-w-3xl bg-white shadow-lg p-8 md:p-12">
                {/* 顶部英文标语 */}
                <div className="text-blue-600 text-sm font-semibold tracking-widest uppercase mb-3">
                    Split the bill, share the chill.
                </div>

                {/* 主标题 */}
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
                    实习生午饭晚饭分钱系统
                </h1>

                {/* 副标题 */}
                <p className="text-gray-500 mb-10">
                    请选择要进入的页面。实习生和 Mentor 已拆分为两个独立入口。
                </p>

                {/* 两个入口 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* 实习生入口 */}
                    <button
                        className="group text-left bg-white border border-gray-100 p-6 transition-all duration-200 hover:shadow-md hover:border-gray-200 hover:-translate-y-0.5"
                        onClick={() => router.push("/login")}
                    >
                        <span className="text-amber-500 font-bold text-sm mb-4 block">
                            01
                        </span>
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">
                            实习生入口
                        </h2>
                        <p className="text-gray-500 text-sm leading-relaxed">
                            如果还未登录/注册，会先进行登录注册。
                        </p>
                    </button>

                    {/* Mentor 管理入口 */}
                    <button
                        className="group text-left bg-white border border-gray-100 p-6 transition-all duration-200 hover:shadow-md hover:border-gray-200 hover:-translate-y-0.5"
                        onClick={() => router.push("/login")}
                    >
                        <span className="text-amber-500 font-bold text-sm mb-4 block">
                            02
                        </span>
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">
                            Mentor 管理入口
                        </h2>
                        <p className="text-gray-500 text-sm leading-relaxed">
                            输入账号密码后查看总体情况。
                        </p>
                    </button>
                </div>
            </div>
        </div>
    );
}

export default MainEntry;
