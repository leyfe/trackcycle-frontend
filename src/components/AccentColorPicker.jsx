import React from "react";
import { Card, CardBody } from "@nextui-org/react";

const COLORS = [
  { name: "Indigo", value: "indigo", hex: "#6366f1" },
  { name: "Emerald", value: "emerald", hex: "#10b981" },
  { name: "Violet", value: "violet", hex: "#8b5cf6" },
  { name: "Rose", value: "rose", hex: "#f43f5e" },
];

export default function AccentColorPicker({ accentColor, onChange }) {
  return (
    <Card className="bg-slate-900/60 border border-slate-700 p-3">
      <CardBody>
        <h2 className="text-lg font-semibold text-slate-100 mb-4">Akzentfarbe</h2>
        <div className="flex gap-3">
          {COLORS.map((c) => (
            <button
              key={c.value}
              onClick={() => onChange(c.value)}
              className={`w-6 h-6 rounded-full border-2 transition-all duration-200 ${
                accentColor === c.value
                  ? `border-${c.value}-400 scale-110`
                  : "border-slate-600 hover:scale-105"
              }`}
              style={{ backgroundColor: c.hex }}
              title={c.name}
            />
          ))}
        </div>
      </CardBody>
    </Card>
  );
}