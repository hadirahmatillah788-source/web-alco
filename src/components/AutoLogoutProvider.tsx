"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useSession, signOut } from "next-auth/react";
import { Clock, ShieldAlert, CheckCircle } from "lucide-react";

interface AutoLogoutProviderProps {
  children: React.ReactNode;
  timeoutMinutes?: number; // Inactivity timeout, default 15 minutes
  warningSeconds?: number; // Show warning modal before logout, default 60 seconds
}

export function AutoLogoutProvider({
  children,
  timeoutMinutes = 15,
  warningSeconds = 60,
}: AutoLogoutProviderProps) {
  const { data: session } = useSession();
  const [showWarning, setShowWarning] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(warningSeconds);

  const timeoutMs = timeoutMinutes * 60 * 1000;
  const warningMs = (timeoutMinutes * 60 - warningSeconds) * 1000;

  const warningTimerRef = useRef<NodeJS.Timeout | null>(null);
  const logoutTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const handleLogout = useCallback(() => {
    setShowWarning(false);
    signOut({ callbackUrl: "/login?reason=inactivity" });
  }, []);

  const resetTimer = useCallback(() => {
    if (!session?.user) return;

    // Clear existing timers
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);

    setShowWarning(false);
    setSecondsRemaining(warningSeconds);

    // Set timer for warning modal
    warningTimerRef.current = setTimeout(() => {
      setShowWarning(true);
      setSecondsRemaining(warningSeconds);

      // Countdown interval
      countdownIntervalRef.current = setInterval(() => {
        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(countdownIntervalRef.current!);
            handleLogout();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }, warningMs);

    // Fallback hard logout
    logoutTimerRef.current = setTimeout(handleLogout, timeoutMs);
  }, [session, warningMs, timeoutMs, warningSeconds, handleLogout]);

  useEffect(() => {
    if (!session?.user) {
      if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
      if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      setShowWarning(false);
      return;
    }

    const events = ["mousedown", "mousemove", "keydown", "scroll", "touchstart"];
    let lastActivityTime = Date.now();
    const handleUserActivity = () => {
      // Only reset timer if warning modal is not active and throttled by 5 seconds
      if (!showWarning) {
        const now = Date.now();
        if (now - lastActivityTime >= 5000) {
          lastActivityTime = now;
          resetTimer();
        }
      }
    };

    resetTimer();

    events.forEach((evt) => window.addEventListener(evt, handleUserActivity, { passive: true }));

    return () => {
      events.forEach((evt) => window.removeEventListener(evt, handleUserActivity));
      if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
      if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, [session, resetTimer, showWarning]);

  const handleStayLoggedIn = () => {
    setShowWarning(false);
    resetTimer();
  };

  return (
    <>
      {children}

      {/* Auto Logout Warning Modal */}
      {showWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 p-6 text-center space-y-4">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shadow-md">
              <Clock className="w-7 h-7 animate-pulse" />
            </div>

            <div>
              <h3 className="font-extrabold text-slate-900 text-lg">Sesi Tidak Aktif Terdeteksi</h3>
              <p className="text-xs text-slate-500 mt-1">
                Demi keamanan perbankan internal, sesi Anda akan otomatis diakhiri karena tidak ada aktivitas.
              </p>
            </div>

            <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-900">
              Sesi akan keluar dalam{" "}
              <span className="font-extrabold text-base text-rose-600 font-mono px-1">
                {secondsRemaining}
              </span>{" "}
              detik
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={handleLogout}
                className="flex-1 py-2.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
              >
                Keluar Sekarang
              </button>
              <button
                onClick={handleStayLoggedIn}
                className="flex-1 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-1.5"
              >
                <CheckCircle className="w-4 h-4" /> Lanjutkan Sesi
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
