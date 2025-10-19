import React from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@nextui-org/react";

export default function PageHeader({ title, subtitle, onBack, children }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-3">
      {/* 🔹 Linke Seite: Titel & Back-Button */}
      <div className="flex items-center gap-3">
        {onBack && (
          <Button
            isIconOnly
            variant="light"
            onPress={onBack}
            className="text-slate-400 hover:text-indigo-400"
          >
            <ArrowLeft size={20} />
          </Button>
        )}
        <div>
          <h1 className="text-xl font-semibold text-white">{title}</h1>
          {subtitle && <p className="text-slate-400 text-sm">{subtitle}</p>}
        </div>
      </div>

      {/* 🔹 Rechte Seite: z. B. Dropdowns, Filter, Aktionen */}
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  );
}