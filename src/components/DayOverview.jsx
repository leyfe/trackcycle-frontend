import React, { useState, useContext, useRef } from "react";
import { Button, Autocomplete, AutocompleteItem, AutocompleteSection, Input, Select, SelectItem, Card, CardBody } from "@nextui-org/react";
import { ProjectContext } from "../context/ProjectContext"; // falls du den Context nutzt
import { CustomerContext } from "../context/CustomerContext";

export default function DayOverview({ gaps, totalHours, dayEntries, onAddGapEntry, onConvertToPause, suggestions = [] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeGap, setActiveGap] = useState(null);
  const [description, setDescription] = useState("");
  const [projectId, setProjectId] = useState("");
  const suggestionRef = useRef(null); // 👈 HIER hinzufügen!
  
  const { projects } = useContext(ProjectContext) || { projects: [] };
  const { customers } = useContext(CustomerContext);

  const isIncomplete = totalHours < 8;
  const remaining = 8 - totalHours;

  const totalMinutes = Math.round(totalHours * 60);
  const th = Math.floor(totalMinutes / 60);
  const tm = totalMinutes % 60;

  const remainingMin = Math.max(0, Math.round(remaining * 60));
  const rh = Math.floor(remainingMin / 60);
  const rm = remainingMin % 60;

  // 🟡 Nicht-buchbare Projekte prüfen
  const nonBillableProjects = ["SAL-001", "INTERN", "TEST"];
  const nonBillableEntries = (dayEntries || []).filter((e) =>
    nonBillableProjects.includes(e.projectId)
  );

  const nonBillableHours = nonBillableEntries.reduce(
    (sum, e) => sum + parseFloat(e.duration || 0),
    0
  );

  const totalDayHours = totalHours || 0;
  const nonBillableRatio = totalDayHours > 0 ? nonBillableHours / totalDayHours : 0;

  const showNonBillableWarning =
    nonBillableHours > 2 || nonBillableRatio > 0.5;

  if (gaps.length === 0 && !isIncomplete) return null;
  
  // 📂 Projekte gruppieren
  const grouped = customers.map((cust) => ({
    customer: cust.name,
    projects: projects.filter((p) => p.customerId === cust.id),
  }));

  // optional: Projekte ohne Kunde
  const unassigned = projects.filter((p) => !p.customerId);
  if (unassigned.length > 0) {
    grouped.push({ customer: "— Ohne Kunden —", projects: unassigned });
  }

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
        {showNonBillableWarning && (
          <div className="bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs px-3 py-2 rounded-lg mb-3">
            ⚠️ Du hast heute viel Zeit auf nicht buchbare Projekte gebucht{" "}
            ({[...new Set(nonBillableEntries.map((e) => e.projectId))].join(", ")}).
          </div>
        )}
        {/* Fehlende Buchungen */}
        {gaps.length > 0 && (
          <>
            <div className="font-medium text-indigo-400 mb-1">Fehlende Buchungen</div>
            <div className="space-y-1 mb-3">
              {gaps.map((g, i) => (
                <div
                  key={i}
                  onClick={() => setActiveGap(g)}
                  className={`flex items-center justify-between border-b border-slate-700/50 last:border-0 pb-1 cursor-pointer hover:bg-slate-700/30 rounded px-2 ${
                    activeGap === g ? "bg-slate-700/50" : ""
                  }`}
                >
                  <span className="flex-1">
                    {g.from.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} –{" "}
                    {g.to.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                  <Button
                    size="sm"
                    variant="text"
                    onPress={() => onConvertToPause(g)}
                  >
                    Als Pause deklarieren
                  </Button>
                  <span className="text-slate-400">({g.text})</span>

                </div>
              ))}
            </div>

            {/* Inline-Form */}
            {activeGap && (
              <Card className="bg-slate-800/80 border border-slate-700/70 shadow-lg mt-3 backdrop-blur-sm">
                <CardBody className="space-y-4">
                  <div className="flex justify-between items-center text-sm text-slate-400">
                    <span>Neue Buchung:</span>
                    <span className="font-medium text-slate-200">
                      {activeGap.from.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} – 
                      {activeGap.to.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>

                  {/* 🔹 Autocomplete für Beschreibung */}
                  <Autocomplete
                          ref={suggestionRef}
                          size="lg"
                          placeholder="Was habe ich gemacht?"
                          allowsCustomValue
                          inputValue={description}
                          onInputChange={(val) => {
                            setDescription(val);
                          }}
                          selectedKey={null}
                          classNames={{
                            popoverContent: "ac-popover",   // <— eigene Klasse am Popover
                            // (falls deine NextUI-Version es supportet, zusätzlich:)
                            listboxWrapper: "max-h-[70vh]"  // harmless fallback
                          }}
                          className={`transition-all duration-200 ${
                            "opacity-100 bg-slate-800 hover:bg-slate-700"
                          } rounded-xl border border-slate-700`}
                        >
                          {suggestions?.map((s, i) => {
                            const project = projects.find((p) => p.id === s.projectId);
                            return (
                              <AutocompleteItem
                                key={`${s.description}-${s.projectId}-${i}`}
                                textValue={s.description}
                                onPress={() => {
                                  setDescription(s.description);
                                  if (project) setSelectedProject(project.id);
                                }}
                              >
                                <div className="flex flex-col">
                                  <span>{s.description}</span>
                                  <span className="text-xs text-slate-400 flex items-center gap-1">
                                    {project?.name || "Projekt unbekannt"}
                                  </span>
                                </div>
                              </AutocompleteItem>
                            );
                          })}
                        </Autocomplete>

      {/* Projekt-Auswahl */}
      <Autocomplete
        placeholder="Projekt auswählen..."
        variant="flat"
        size="lg"
        onSelectionChange={(key) => {
          if (!key) return;
          const newProjectId = typeof key === "string" ? key : [...key][0];
          const newProject = projects.find((p) => p.id === newProjectId);
        }}
        className={`transition-all duration-200 text-slate-950 ${
            "opacity-100 bg-slate-800 hover:bg-slate-700"
        } rounded-xl border border-slate-700`}
      >
        {grouped.map(
          (group) =>
            group.projects.length > 0 && (
              <AutocompleteSection key={group.customer} title={group.customer}>
                {group.projects.map((p) => (
                  <AutocompleteItem key={p.id.toString()}>{p.name}</AutocompleteItem>
                ))}
              </AutocompleteSection>
            )
        )}
      </Autocomplete>

                  {/* 🔹 Aktionen */}
                  <div className="flex justify-end gap-2 pt-2">
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
            <div className="font-medium text-amber-400">Arbeitstag unvollständig</div>
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