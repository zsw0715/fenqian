"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import {
  getRefreshToken,
  getUserIdentity,
  setAccessToken,
  clearAuth,
} from "@/utils/token";

interface Props {
  children: React.ReactNode;
  requiredIdentity: "student" | "mentor";
}

export default function AuthGuard({ children, requiredIdentity }: Props) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const check = async () => {
      const refreshToken = getRefreshToken();
      if (!refreshToken) {
        router.replace("/login");
        return;
      }

      try {
        // "http://47.95.118.37:8000/api/auth/refresh"
        const res = await axios.post("http://154.219.118.31:7988/api/auth/refresh", {
          refresh_token: refreshToken,
        });
        if (cancelled) return;
        setAccessToken(res.data.access_token);

        const identity = getUserIdentity();
        if (identity !== requiredIdentity) {
          router.replace("/login");
          return;
        }
      } catch {
        if (cancelled) return;
        clearAuth();
        router.replace("/login");
        return;
      }

      if (!cancelled) {
        setReady(true);
      }
    };

    check();

    return () => {
      cancelled = true;
    };
  }, []);

  if (!ready) {
    return null;
  }

  return <>{children}</>;
}
