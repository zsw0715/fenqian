"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { getRefreshToken, getUserIdentity, setAccessToken, clearAuth } from "@/utils/token";
import MainEntry from "@/components/MainEntry";

export default function Home() {
    const router = useRouter();
    const [checking, setChecking] = useState(true);

    useEffect(() => {
        let cancelled = false;

        const check = async () => {
            const refreshToken = getRefreshToken();
            if (!refreshToken) {
                setChecking(false);
                return;
            }

            try {
                const res = await axios.post("http://localhost:8000/api/auth/refresh", {
                    refresh_token: refreshToken,
                });
                if (cancelled) return;
                setAccessToken(res.data.access_token);

                const identity = getUserIdentity();
                if (identity === "mentor") {
                    router.replace("/mentor-dashboard");
                } else if (identity === "student") {
                    router.replace("/student-billing");
                } else {
                    clearAuth();
                    setChecking(false);
                }
            } catch {
                if (!cancelled) {
                    clearAuth();
                    setChecking(false);
                }
            }
        };

        check();

        return () => { cancelled = true; };
    }, []);

    if (checking) {
        return (
            <div className="flex flex-col flex-1 items-center justify-center bg-zinc-100">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
            </div>
        );
    }

    return (
        <div className="flex flex-col flex-1 items-center justify-center bg-zinc-100 font-san">
            <MainEntry />
        </div>
    );
}
