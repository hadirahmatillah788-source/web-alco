"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Bell,
  CheckCheck,
  FileText,
  TrendingUp,
  Archive,
  ShieldCheck,
  ChevronRight,
  X,
  Clock,
} from "lucide-react";

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  category: "rapat" | "suku-bunga" | "arsip" | "sistem";
  timestamp: string;
  linkTab: "hasil-rapat" | "suku-bunga" | "arsip";
}

interface NotificationDropdownProps {
  onNavigateTab?: (tab: "hasil-rapat" | "suku-bunga" | "arsip") => void;
}

export function NotificationDropdown({ onNavigateTab }: NotificationDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [readIds, setReadIds] = useState<string[]>([]);
  const [activeFilter, setActiveFilter] = useState<"all" | "unread">("all");
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  // Load read notifications from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("alco_read_notifications");
      if (saved) {
        setReadIds(JSON.parse(saved));
      }
    } catch (e) {
      console.error("Failed to read localStorage:", e);
    }
  }, []);

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/notifikasi");
      if (res.ok) {
        const json = await res.json();
        setNotifications(json.data || []);
      }
    } catch (e) {
      console.error("Failed to fetch notifications:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  // Close when clicked outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const markAsRead = (id: string) => {
    if (!readIds.includes(id)) {
      const updated = [...readIds, id];
      setReadIds(updated);
      try {
        localStorage.setItem("alco_read_notifications", JSON.stringify(updated));
      } catch (e) {
        console.error("Failed to save to localStorage:", e);
      }
    }
  };

  const markAllAsRead = () => {
    const allIds = notifications.map((n) => n.id);
    setReadIds(allIds);
    try {
      localStorage.setItem("alco_read_notifications", JSON.stringify(allIds));
    } catch (e) {
      console.error("Failed to save to localStorage:", e);
    }
  };

  const handleItemClick = (item: NotificationItem) => {
    markAsRead(item.id);
    setIsOpen(false);
    if (onNavigateTab) {
      onNavigateTab(item.linkTab);
    }
  };

  const unreadCount = notifications.filter((n) => !readIds.includes(n.id)).length;

  const filteredNotifications = notifications.filter((n) => {
    if (activeFilter === "unread") {
      return !readIds.includes(n.id);
    }
    return true;
  });

  const getCategoryIcon = (cat: NotificationItem["category"]) => {
    switch (cat) {
      case "rapat":
        return (
          <div className="w-8 h-8 rounded-lg bg-blue-100 text-[#143265] flex items-center justify-center shrink-0">
            <FileText className="w-4 h-4" />
          </div>
        );
      case "suku-bunga":
        return (
          <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
            <TrendingUp className="w-4 h-4" />
          </div>
        );
      case "arsip":
        return (
          <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
            <Archive className="w-4 h-4" />
          </div>
        );
      case "sistem":
      default:
        return (
          <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-800 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-4 h-4" />
          </div>
        );
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) fetchNotifications();
        }}
        className="p-2 text-blue-200 hover:text-white hover:bg-blue-900/50 rounded-full transition-colors relative cursor-pointer select-none"
        title="Pusat Notifikasi ALCO"
        aria-label="Notifikasi"
      >
        <Bell className="w-4 h-4" />

        {/* Real Dynamic Badge */}
        {unreadCount > 0 ? (
          <span className="min-w-4 h-4 px-1 rounded-full bg-amber-400 text-slate-900 font-extrabold text-[10px] flex items-center justify-center absolute -top-0.5 -right-0.5 shadow-xs animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        ) : (
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400/40 absolute top-2 right-2" />
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2.5 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50 text-slate-800 animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="px-4 py-3 bg-[#143265] text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-amber-400" />
              <h3 className="text-xs sm:text-sm font-bold">Pusat Notifikasi</h3>
              {unreadCount > 0 && (
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-400 text-slate-900">
                  {unreadCount} Baru
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllAsRead}
                className="text-[11px] text-blue-200 hover:text-white font-semibold flex items-center gap-1 hover:underline cursor-pointer"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Tandai Semua Dibaca</span>
              </button>
            )}
          </div>

          {/* Filter Tabs: Semua vs Belum Dibaca */}
          <div className="flex items-center border-b border-slate-100 bg-slate-50/70 px-3 py-1.5 gap-2 text-xs">
            <button
              onClick={() => setActiveFilter("all")}
              className={`px-3 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                activeFilter === "all"
                  ? "bg-white text-[#143265] shadow-2xs border border-slate-200/80"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Semua ({notifications.length})
            </button>

            <button
              onClick={() => setActiveFilter("unread")}
              className={`px-3 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                activeFilter === "unread"
                  ? "bg-white text-[#143265] shadow-2xs border border-slate-200/80"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Belum Dibaca ({unreadCount})
            </button>
          </div>

          {/* Notifications List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 divide-dashed">
            {loading ? (
              <div className="p-6 text-center text-xs text-slate-400 animate-pulse">
                Memuat notifikasi terbaru...
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <CheckCheck className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs text-slate-500 font-medium">
                  {activeFilter === "unread"
                    ? "Semua notifikasi telah dibaca."
                    : "Tidak ada notifikasi saat ini."}
                </p>
              </div>
            ) : (
              filteredNotifications.map((item) => {
                const isRead = readIds.includes(item.id);

                return (
                  <div
                    key={item.id}
                    onClick={() => handleItemClick(item)}
                    className={`p-3.5 flex items-start gap-3 transition-colors cursor-pointer select-none group ${
                      !isRead ? "bg-blue-50/40 hover:bg-blue-50/80" : "hover:bg-slate-50"
                    }`}
                  >
                    {getCategoryIcon(item.category)}

                    <div className="flex-1 min-w-0 space-y-0.5">
                      <div className="flex items-center justify-between gap-1">
                        <h4 className="text-xs font-bold text-slate-900 group-hover:text-[#143265] truncate">
                          {item.title}
                        </h4>
                        {!isRead && (
                          <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
                        )}
                      </div>

                      <p className="text-[11px] text-slate-600 leading-snug line-clamp-2">
                        {item.message}
                      </p>

                      <div className="flex items-center gap-1 text-[10px] text-slate-400 pt-0.5">
                        <Clock className="w-3 h-3" />
                        <span>{item.timestamp}</span>
                      </div>
                    </div>

                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-[#143265] group-hover:translate-x-0.5 transition-transform shrink-0 self-center" />
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="p-2.5 bg-slate-50 border-t border-slate-100 text-center">
            <span className="text-[10px] text-slate-400 font-medium">
              Sistem Informasi Keputusan & Suku Bunga ALCO
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
