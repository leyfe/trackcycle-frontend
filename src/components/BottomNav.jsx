import React from "react";
import { Home, BarChart2, Settings } from "lucide-react";

export default function BottomNav({ activeTab, onChange, settings }) {
  const buttons = [
    { key: "home", icon: Home, label: "Tracking" },
    { key: "stats", icon: BarChart2, label: "Statistiken" },
    { key: "settings", icon: Settings, label: "Einstellungen" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-slate-900/80 backdrop-blur-md border-t border-slate-800 flex justify-evenly py-4 z-50">
      {buttons.map(({ key, icon: Icon, label }) => {
        const isActive = activeTab === key;
        return (
          <button
            key={key}
            onClick={() => onChange(key)}
            className="flex flex-col items-center justify-center gap-[2px] w-20 focus:outline-none"
          >
            <div className="flex items-center justify-center h-6">
              <Icon
                className={`w-[22px] h-[22px] transition-colors duration-200 ${
                  isActive ? `text-${settings.accentColor}-400` : "text-slate-400"
                }`}
              />
            </div>
            <span
              className={`text-[11px] leading-none font-medium ${
                isActive ? `text-${settings.accentColor}-400` : "text-slate-500"
              }`}
            >
              {label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}