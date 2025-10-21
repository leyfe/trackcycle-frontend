import React from "react";
import { Card, CardBody } from "@nextui-org/react";

const COLORS = [
  { name: "Rose", value: "rose", hex: "#f43f5e" },
  { name: "Orange", value: "orange", hex: "#f97316" },
  { name: "Yellow", value: "yellow", hex: "#eab308" },
  { name: "Lime", value: "lime", hex: "#84cc16" },
  { name: "Emerald", value: "emerald", hex: "#10b981" },
  { name: "Sky", value: "sky", hex: "#0ea5e9" },
  { name: "Indigo", value: "indigo", hex: "#6366f1" },
  { name: "Purple", value: "purple", hex: "#9333ea" },
  { name: "Fuchsia", value: "fuchsia", hex: "#d946ef" },
  { name: "Slate", value: "slate", hex: "#64748b" },
];

export default function AccentColorPicker({ accentColor, onChange }) {
  return (
    <Card className="bg-slate-900/60 border border-slate-700 p-3">
      <CardBody>
        <h2 className="text-lg font-semibold text-slate-100 mb-4">
          Akzentfarbe
        </h2>

        <div className="flex flex-wrap gap-3">
          {COLORS.map((c) => (
            <button
              key={c.value}
              onClick={() => onChange(c.value)}
              className={`
                w-8 h-8 rounded-full border-2 transition-all duration-300 
                shadow-sm hover:scale-110 hover:shadow-md 
                ${accentColor === c.value
                  ? `ring-2 ring-offset-2 ring-${c.value}-400 border-${c.value}-400 scale-110`
                  : "border-slate-600 hover:border-slate-400"
                }
              `}
              style={{ backgroundColor: c.hex }}
              title={c.name}
            />
          ))}
        </div>
      </CardBody>
    </Card>
  );
}