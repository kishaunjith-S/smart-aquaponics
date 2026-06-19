"use client";

import { useEffect, useState } from "react";

const STATUS = {
  live: {
    dot: "bg-emerald-500",
    pulse: "animate-pulse",
    label: "Live",
    text: "text-emerald-700 dark:text-emerald-400",
    border: "border-emerald-500/30",
    bg: "bg-emerald-50/50 dark:bg-emerald-900/10",
  },
  delayed: {
    dot: "bg-yellow-500",
    pulse: "",
    label: "Delayed",
    text: "text-yellow-700 dark:text-yellow-400",
    border: "border-yellow-500/30",
    bg: "bg-yellow-50/50 dark:bg-yellow-900/10",
  },
  offline: {
    dot: "bg-red-500",
    pulse: "",
    label: "Offline",
    text: "text-red-700 dark:text-red-400",
    border: "border-red-500/30",
    bg: "bg-red-50/50 dark:bg-red-900/10",
  },
  unknown: {
    dot: "bg-gray-400",
    pulse: "",
    label: "No data",
    text: "text-gray-600 dark:text-gray-400",
    border: "border-gray-400/30",
    bg: "bg-gray-50/50 dark:bg-gray-900/10",
  },
};

function timeAgo(seconds) {
  if (seconds < 0) return "just now";
  if (seconds < 60) return `${Math.round(seconds)}s ago`;
  if (seconds < 3600) return `${Math.round(seconds / 60)} min ago`;
  if (seconds < 86400) return `${Math.round(seconds / 3600)} hr ago`;
  return `${Math.round(seconds / 86400)} day ago`;
}

export default function DeviceStatusBanner({ latestTimestamp, deviceId }) {
  // Lazy initializer: Date.now() called once at mount, not during renders
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  let status;
  let detail;

  if (!latestTimestamp) {
    status = STATUS.unknown;
    detail = "No readings received yet";
  } else {
    const ts = new Date(latestTimestamp).getTime();
    const secondsAgo = Math.max(0, (now - ts) / 1000);
    if (secondsAgo < 90) status = STATUS.live;       // covers 30s upload + 30s poll + slack
    else if (secondsAgo < 600) status = STATUS.delayed;  // 90s to 10 min — investigating
    else status = STATUS.offline;                     // > 10 min — definitely down
    detail = `Last reading ${timeAgo(secondsAgo)}${
      deviceId ? ` • Device: ${deviceId}` : ""
    }`;
  }

  return (
    <div
      className={`flex items-center gap-3 rounded-lg border ${status.border} ${status.bg} px-4 py-3 mb-4`}
    >
      <div className="relative h-3 w-3">
        <div
          className={`absolute inset-0 rounded-full ${status.dot} ${status.pulse}`}
        />
        {status === STATUS.live && (
          <div
            className={`absolute inset-0 rounded-full ${status.dot} animate-ping opacity-75`}
          />
        )}
      </div>
      <div className="flex-1">
        <p className={`font-semibold ${status.text}`}>{status.label}</p>
        <p className="text-sm text-muted-foreground">{detail}</p>
      </div>
    </div>
  );
}