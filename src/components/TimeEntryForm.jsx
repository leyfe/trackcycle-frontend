import React, { useState, useEffect, useContext, useRef } from "react";
import {
  Autocomplete,
  AutocompleteItem,
  AutocompleteSection,
  Button,
  Input
} from "@nextui-org/react";
import { ProjectContext } from "../context/ProjectContext";
import { CustomerContext } from "../context/CustomerContext";
import { Play, X } from "lucide-react";
import FavoritesBar from "./FavoritesBar";

export default function TimeEntryForm({
  onAdd,
  activeEntry,
  setActiveEntry,
  suggestions,
  entries = [],
  settings,
}) {
  const { projects } = useContext(ProjectContext);
  const { customers } = useContext(CustomerContext);

  const [selectedProject, setSelectedProject] = useState("");
  const [description, setDescription] = useState("");
  const suggestionRef = useRef(null);
  const [showTimeInput, setShowTimeInput] = useState(false);
  const [customStartTime, setCustomStartTime] = useState(
    new Date().toISOString().slice(0, 16)
  );
  const [elapsed, setElapsed] = useState(0);

  // 🕑 Timer aktualisieren
  useEffect(() => {
    if (!activeEntry) {
      setElapsed(0);
      return;
    }

    const updateElapsed = () => {
      const diff = (Date.now() - new Date(activeEntry.start)) / 1000;
      setElapsed(diff);
    };

    updateElapsed();
    const interval = setInterval(updateElapsed, 1000);
    return () => clearInterval(interval);
  }, [activeEntry]);

  // 🧠 Wenn aktiver Task von außen gesetzt wird (z. B. Restart)
  useEffect(() => {
    if (activeEntry) {
      setDescription(activeEntry.description || "");
      setSelectedProject(activeEntry.projectId?.toString() || ""); // ✅ String erzwingen
      setCustomStartTime(new Date(activeEntry.start).toISOString().slice(0, 16));
    }
  }, [activeEntry]);

  // 📂 Projekte gruppieren
  const grouped = customers.map((cust) => ({
    customer: cust.name,
    projects: projects.filter((p) => p.client === cust.name),
  }));

  // ▶️ Timer starten
  const startTimer = () => {
    if (!selectedProject || !description.trim()) return;

    const project = projects.find((p) => p.id === selectedProject);
    const startIso = showTimeInput ? customStartTime : new Date().toISOString();

    const newEntry = {
      id: Date.now(),
      projectId: selectedProject,
      projectName: project?.name || "Unbekannt",
      description,
      start: startIso,
      end: null,
    };

    setActiveEntry(newEntry);
    setElapsed(0);
  };

  // ⏹ Timer stoppen
  const stopTimer = () => {
    if (!activeEntry) return;
    const end = new Date().toISOString();
    const duration = (new Date(end) - new Date(activeEntry.start)) / 1000 / 60 / 60;
    const completed = { ...activeEntry, end, duration: duration.toFixed(2) };

    onAdd(completed);
    setActiveEntry(null);
    setDescription("");
    setSelectedProject("");
  };

  // 🧮 Zeitformatierung
  function formatTime(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return [h, m, s].map((v) => String(v).padStart(2, "0")).join(":");
  }

  // 🔁 ISO <-> lokale Uhrzeit (HH:MM)
  function localHMToISO(hhmm) {
    const [h, m] = hhmm.split(":").map(Number);
    const now = new Date();
    const local = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      h,
      m,
      0,
      0
    );
    return local.toISOString();
  }

  function isoToLocalHM(iso) {
    if (!iso) return "00:00";
    const d = new Date(iso);
    return `${String(d.getHours()).padStart(2, "0")}:${String(
      d.getMinutes()
    ).padStart(2, "0")}`;
  }

  // 🔹 Gibt es abgeschlossene Einträge?
  const hasFinished = Array.isArray(entries) && entries.some((e) => e?.end);

  // 🧩 Render
  return (
    <div
      className={`bg-gradient-to-b from-slate-700/50 to-slate-800 p-8 border border-slate-200/10 rounded-2xl shadow-2xl space-y-4 mb-6 transition-all duration-500 ${
        activeEntry ? "shadow-slate-950 shadow-4xl" : ""
      }`}
    >
      <h2 className="text-2xl font-semibold text-slate-200 mb-2 tracking-tight">
        what are you working on?
      </h2>

      {/* Beschreibung */}
      <Autocomplete
        ref={suggestionRef}
        size="lg"
        placeholder="Was habe ich gemacht?"
        allowsCustomValue
        inputValue={description}
        onInputChange={(val) => {
          setDescription(val);
          if (activeEntry)
            setActiveEntry({ ...activeEntry, description: val });
        }}
        selectedKey={null}
        classNames={{
          popoverContent: "ac-popover",   // <— eigene Klasse am Popover
          // (falls deine NextUI-Version es supportet, zusätzlich:)
          listboxWrapper: "max-h-[70vh]"  // harmless fallback
        }}
        className={`transition-all duration-200 ${
          activeEntry
            ? "opacity-25 bg-slate-800/60 hover:bg-slate-800/80"
            : "opacity-100 bg-slate-800 hover:bg-slate-700"
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
                if (activeEntry) {
                  setActiveEntry({
                    ...activeEntry,
                    description: s.description,
                    projectId: project?.id || s.projectId,
                    projectName: project?.name || "Unbekannt",
                  });
                }
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
        selectedKey={selectedProject?.toString()}
        onSelectionChange={(key) => {
          if (!key) return;
          const newProjectId = typeof key === "string" ? key : [...key][0];
          setSelectedProject(newProjectId);
          const newProject = projects.find((p) => p.id === newProjectId);
          if (activeEntry) {
            setActiveEntry({
              ...activeEntry,
              projectId: newProject?.id || newProjectId,
              projectName: newProject?.name || "Unbekannt",
            });
          }
        }}
        className={`transition-all duration-200 text-slate-950 ${
          activeEntry
            ? "opacity-25 bg-slate-800/60 hover:bg-slate-800/80"
            : "opacity-100 bg-slate-800 hover:bg-slate-700"
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

      {/* 🕒 Startzeit anpassen (stabil & konsistent) */}
      <div className="flex items-center justify-end gap-3 text-sm mt-1">
        {showTimeInput ? (
          <>
            <Input
              type="time"
              step="60"
              size="sm"
              color="white"
              variant="flat"
              aria-label="Startzeit"
              classNames={{
                base: "w-auto",
                inputWrapper: [
                  // Grunddesign wie dein Button
                  "bg-slate-700 hover:bg-slate-600 rounded-md h-8 border border-slate-700",
                  "transition-all duration-200",
                  // Fix gegen NextUI-Hover/Focus-Override
                  "data-[hover=true]:bg-slate-600 data-[focus=true]:bg-slate-700",
                  // 🔒 Fix gegen NextUI-Overrides (keine weiße Fläche!)
                  "data-[hover=true]:bg-slate-600 data-[focus=true]:bg-slate-700",
                  "!bg-slate-700 !data-[focus=true]:bg-slate-700",
                ].join(" "),
                input: [
                  "text-slate-400 text-xs",
                  // verhindert, dass NextUI den Text beim Hover oder Fokus weiß färbt
                  "placeholder:text-slate-500",
                  "group-data-[focus=true]:text-slate-400",
                  "data-[hover=true]:text-slate-400",
                ].join(" "),
              }}
              value={isoToLocalHM(activeEntry ? activeEntry.start : customStartTime)}
              onChange={(e) => {
                const newIso = localHMToISO(e.target.value);
                setCustomStartTime(newIso);

                if (activeEntry) {
                  const updated = { ...activeEntry, start: newIso };
                  setActiveEntry(updated);
                  setElapsed((Date.now() - Date.parse(newIso)) / 1000);
                }
              }}
            />

            {/* 🔄 Letzte Endzeit übernehmen */}
            <Button
              size="sm"
              variant="flat"
              className="text-xs bg-slate-700 hover:bg-slate-600 text-slate-400"
              onPress={() => {
                // 1) abgesicherter Zugriff auf Einträge
                const list = Array.isArray(entries) ? entries : [];
                const finished = list.filter((e) => e?.end);
                if (finished.length === 0) return;

                // 2) jüngste Endzeit finden
                const last = finished.reduce((latest, e) =>
                  new Date(e.end) > new Date(latest.end) ? e : latest
                );

                if (!last?.end) return;

                // 3) intern IMMER ISO (UTC) halten
                const lastEndIso = new Date(last.end).toISOString();

                // 4) Input/State aktualisieren
                setCustomStartTime(lastEndIso);

                // 5) wenn Timer läuft -> sofort übernehmen & elapsed korrigieren
                if (activeEntry) {
                  const updated = { ...activeEntry, start: lastEndIso };
                  setActiveEntry(updated);
                  setElapsed((Date.now() - Date.parse(lastEndIso)) / 1000);
                }

                // 6) sicherstellen, dass das Feld sichtbar bleibt
                if (!showTimeInput) setShowTimeInput(true);
              }}
            >
              Letzte Endzeit übernehmen
            </Button>

            <Button
              isIconOnly
              size="sm"
              className="text-xs bg-slate-700 hover:bg-slate-600 text-slate-400"
              variant="flat"
              onPress={() => setShowTimeInput(false)}
            >
              <X className="w-4 h-4 text-slate-400" />
            </Button>
          </>
        ) : (
          <button
            onClick={() => {
              // beim Öffnen „jetzt“ vorfüllen (ISO/UTC)
              const nowIso = new Date().toISOString();
              setCustomStartTime(nowIso);
              setShowTimeInput(true);
            }}
            className="text-xs text-slate-400 hover:text-slate-200"
          >
            Startzeit anpassen
          </button>
        )}
      </div>

      {/* ▶️ Start / ⏹ Stop */}
      {!activeEntry ? (
        <Button
          className="bg-indigo-600 hover:bg-indigo-500 text-white text-lg py-6 rounded-2xl shadow-[0_0_20px_rgba(99,102,241,0.4)] hover:shadow-[0_0_30px_rgba(99,102,241,0.6)] transition-all duration-300 font-medium tracking-wide"
          size="lg"
          fullWidth
          onPress={startTimer}
          isDisabled={!selectedProject || !description.trim()}
        >
          <Play className="w-5 h-5 text-slate-100" />
          Start
        </Button>
      ) : (
        <Button
          color="danger"
          fullWidth
          className="mt-3"
          size="lg"
          onPress={stopTimer}
        >
          <div className="text-2xl font-mono text-slate-100">
            {formatTime(elapsed)}
          </div>
        </Button>
      )}
    </div>
  );
}