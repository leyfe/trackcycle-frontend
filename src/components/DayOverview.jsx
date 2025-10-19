import React, { useState, useContext } from "react";
import { Button, Input, Select, SelectItem, Card, CardBody } from "@nextui-org/react";
import { ProjectContext } from "../context/ProjectContext"; // falls du den Context nutzt

export default function DayOverview({ gaps, totalHours, onAddGapEntry }) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeGap, setActiveGap] = useState(null);
  const [description, setDescription] = useState("");
  const [projectId, setProjectId] = useState("");

  const { projects } = useContext(ProjectContext) || { projects: [] };

  const isIncomplete = totalHours < 8;
  const remaining = 8 - totalHours;

  const totalMinutes = Math.round(totalHours * 60);
  const th = Math.floor(totalMinutes / 60);
  const tm = totalMinutes % 60;

  const remainingMin = Math.max(0, Math.round(remaining * 60));
  const rh = Math.floor(remainingMin / 60);
  const rm = remainingMin % 60;

  if (gaps.length === 0 && !isIncomplete) return null;

  const handleAddGapEntry = () => {
    if (!activeGap || !description || !projectId) return;
    const newEntry = {
      id: Date.now(),
      projectId,
      projectName: projects.find((p) => p.id === projectId)?.name || "Unbekannt",
      description,
      start: activeGap.from.toISOString(),
      end: activeGap.to.toISOString(),
      duration: ((activeGap.to - activeGap.from) / 3600000).toFixed(2),
    };
    onAddGapEntry(newEntry);

    // Reset
    setActiveGap(null);
    setDescription("");
    setProjectId("");
  };

  return (
    <div className="bg-slate-800/40 border border-slate-700 text-slate-300 rounded-lg mb-3 overflow-hidden transition-all duration-300">
      {/* Header */}
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="w-full flex justify-between items-center px-4 py-2 hover:bg-slate-700/40 transition-colors"
      >
        <span className="text-xs font-medium text-slate-100 flex items-center gap-2">
          Tagesübersicht
        </span>
        <svg
          className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${
            isOpen ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Inhalt */}
      <div
        className={`px-4 transition-all duration-500 ease-in-out ${
          isOpen ? "max-h-[600px] opacity-100 py-3" : "max-h-0 opacity-0 py-0"
        } overflow-hidden text-sm`}
      >
        {/* Fehlende Buchungen */}
        {gaps.length > 0 && (
          <>
            <div className="font-medium text-indigo-400 mb-1">Fehlende Buchungen</div>
            <div className="space-y-1 mb-3">
              {gaps.map((g, i) => (
                <div
                  key={i}
                  onClick={() => setActiveGap(g)}
                  className={`flex justify-between border-b border-slate-700/50 last:border-0 pb-1 cursor-pointer hover:bg-slate-700/30 rounded px-2 ${
                    activeGap === g ? "bg-slate-700/50" : ""
                  }`}
                >
                  <span>
                    {g.from.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} –{" "}
                    {g.to.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                  <span className="text-slate-400">({g.text})</span>
                </div>
              ))}
            </div>

            {/* Inline-Form */}
            {activeGap && (
              <Card className="bg-slate-900/70 border border-slate-700 mt-2">
                <CardBody className="space-y-3">
                  <div className="text-xs text-slate-400">
                    Neue Buchung:{" "}
                    {activeGap.from.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}{" "}
                    –{" "}
                    {activeGap.to.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </div>

                  <Input
                    size="sm"
                    placeholder="Beschreibung"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    classNames={{
                      input: "text-slate-200 text-sm",
                      inputWrapper: "bg-slate-800 border-slate-700",
                    }}
                  />

                  <Select
                    placeholder="Projekt auswählen"
                    selectedKeys={projectId ? [projectId] : []}
                    onChange={(e) => setProjectId(e.target.value)}
                    classNames={{
                      trigger: "bg-slate-800 text-slate-200 border border-slate-700",
                      popoverContent: "bg-slate-800",
                    }}
                  >
                    {projects.map((p) => (
                      <SelectItem key={p.id}>{p.name}</SelectItem>
                    ))}
                  </Select>

                  <div className="flex gap-2 justify-end">
                    <Button
                      size="sm"
                      variant="flat"
                      className="text-xs text-slate-400 bg-slate-700 hover:bg-slate-600"
                      onPress={() => setActiveGap(null)}
                    >
                      Abbrechen
                    </Button>
                    <Button
                      size="sm"
                      color="primary"
                      onPress={handleAddGapEntry}
                      isDisabled={!description || !projectId}
                    >
                      Eintrag hinzufügen
                    </Button>
                  </div>
                </CardBody>
              </Card>
            )}
          </>
        )}

        {/* Arbeitstag unvollständig */}
        {isIncomplete && (
          <div
            className={`${
              gaps.length > 0 ? "mt-3 border-t border-slate-700/50 pt-2" : ""
            }`}
          >
            <div className="font-medium text-amber-400">⚠️ Arbeitstag unvollständig</div>
            <div className="text-sm text-slate-400">
              Nur {th}:{tm.toString().padStart(2, "0")} h erfasst (
              {rh}:{rm.toString().padStart(2, "0")} h fehlen bis 8 h)
            </div>
          </div>
        )}
      </div>
    </div>
  );
}