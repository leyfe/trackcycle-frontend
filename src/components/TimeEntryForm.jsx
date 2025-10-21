import React, {
  useState,
  useEffect,
  useContext,
  useRef
} from "react";
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
  const [isSticky, setIsSticky] = useState(false);
  const formRef = useRef(null);

  const [barHeight, setBarHeight] = useState(0);
  const barRef = useRef(null);

  useEffect(() => {
    if (!barRef.current) return;
    const resizeObserver = new ResizeObserver(() => {
      setBarHeight(barRef.current.getBoundingClientRect().height);
    });
    resizeObserver.observe(barRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  /* ───────────── Sticky Verhalten ───────────── */
  useEffect(() => {
    const handleScroll = () => {
      if (!formRef.current) return;
      const rect = formRef.current.getBoundingClientRect();
      // sticky erst, wenn der untere Rand (z.B. Button-Ende) oben angekommen ist
      setIsSticky(rect.bottom <= 0);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll(); // initial prüfen
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  /* ───────────── Timer ───────────── */
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

  /* ───────────── Autocomplete Prefill ───────────── */
  useEffect(() => {
    if (activeEntry) {
      setDescription(activeEntry.description || "");
      setSelectedProject(activeEntry.projectId?.toString() || "");
      setCustomStartTime(new Date(activeEntry.start).toISOString().slice(0, 16));
    }
  }, [activeEntry]);

  /* ───────────── Projekte gruppieren ───────────── */
  const grouped = customers.map((cust) => ({
    customer: cust.name,
    projects: projects.filter((p) => p.client === cust.name),
  }));

  /* ───────────── Timer Start/Stop ───────────── */
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

  const stopTimer = () => {
    if (!activeEntry) return;
    const end = new Date().toISOString();
    const duration =
      (new Date(end) - new Date(activeEntry.start)) / 1000 / 60 / 60;
    const completed = {
      ...activeEntry,
      end,
      duration: duration.toFixed(2),
    };
    onAdd(completed);
    setActiveEntry(null);
    setDescription("");
    setSelectedProject("");
  };

  /* ───────────── Helpers ───────────── */
  function formatTime(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return [h, m, s].map((v) => String(v).padStart(2, "0")).join(":");
  }

  function localHMToISO(hhmm) {
    const [h, m] = hhmm.split(":").map(Number);
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m, 0).toISOString();
  }

  function isoToLocalHM(iso) {
    if (!iso) return "00:00";
    const d = new Date(iso);
    return `${String(d.getHours()).padStart(2, "0")}:${String(
      d.getMinutes()
    ).padStart(2, "0")}`;
  }

  /* ───────────── UI ───────────── */
  return (
    <div ref={formRef} className="relative">
      {/* 👇 Unsichtbarer Platzhalter verhindert Layout-Sprung */}
      {isSticky && <div style={{ height: `${barHeight}px` }} />}

      <div
        ref={barRef}
        className={`transition-all duration-100 ${
          isSticky
            ? "fixed top-0 left-0 right-0 z-50 bg-gradient-to-b from-slate-700/50 to-slate-800 border-b border-slate-700 backdrop-blur-md shadow-lg px-4 py-4"
            : "bg-gradient-to-b from-slate-700/50 to-slate-800 border border-slate-200/10 rounded-2xl shadow-2xl p-8 mb-6"
        }`}
      >
        {/* Titel */}
        {!isSticky && (
          <h2 className="text-2xl font-semibold text-slate-200 mb-6 tracking-tight">
            what are you working on?
          </h2>
        )}

        {/* Inhalt */}
        <div
          className={`flex ${
            isSticky ? "items-center gap-2 justify-between" : "flex-col space-y-4"
          } transition-all duration-500`}
        >
          {/* Beschreibung */}
          <Autocomplete
            ref={suggestionRef}
            size={isSticky ? "md" : "lg"}
            placeholder="Was habe ich gemacht?"
            allowsCustomValue
            inputValue={description}
            onInputChange={(val) => {
              setDescription(val);
              if (activeEntry) setActiveEntry({ ...activeEntry, description: val });
            }}
            selectedKey={null}
            classNames={{
              popoverContent: "ac-popover",
              listboxWrapper: "max-h-[60vh]",
            }}
            className={`transition-all duration-200 ${
              isSticky
                ? "bg-slate-800/70 w-full"
                : "bg-slate-800 hover:bg-slate-700"
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
                    <span className="text-xs text-slate-400">
                      {project?.name || "Projekt unbekannt"}
                    </span>
                  </div>
                </AutocompleteItem>
              );
            })}
          </Autocomplete>

          {/* Projekt */}
          <Autocomplete
            placeholder="Projekt auswählen..."
            size={isSticky ? "md" : "lg"}
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
            classNames={{
              popoverContent: "ac-popover",
              listboxWrapper: "max-h-[60vh]",
            }}
            className={`transition-all duration-100 text-slate-950 ${
              isSticky
                ? "bg-slate-800/70 w-full"
                : "bg-slate-800 hover:bg-slate-700"
            } rounded-xl border border-slate-700`}
          >
            {grouped.map(
              (group) =>
                group.projects.length > 0 && (
                  <AutocompleteSection key={group.customer} title={group.customer}>
                    {group.projects.map((p) => (
                      <AutocompleteItem key={p.id.toString()}>
                        {p.name}
                      </AutocompleteItem>
                    ))}
                  </AutocompleteSection>
                )
            )}
          </Autocomplete>

          {/* Startzeit anpassen (nur große Variante) */}
          {!isSticky && (
            <div className="flex items-center justify-end gap-3 text-sm mt-2">
              {showTimeInput ? (
                <>
                  <Input
                    type="time"
                    step="60"
                    size="sm"
                    color="white"
                    variant="flat"
                    classNames={{
                      base: "w-auto",
                      inputWrapper:
                        "bg-slate-700 hover:bg-slate-600 rounded-md h-8 border border-slate-700",
                      input:
                        "text-slate-400 text-xs placeholder:text-slate-500",
                    }}
                    value={isoToLocalHM(
                      activeEntry ? activeEntry.start : customStartTime
                    )}
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

                  <Button
                    size="sm"
                    variant="flat"
                    className="text-xs bg-slate-700 hover:bg-slate-600 text-slate-400"
                    onPress={() => {
                      const list = Array.isArray(entries) ? entries : [];
                      const finished = list.filter((e) => e?.end);
                      if (finished.length === 0) return;
                      const last = finished.reduce((latest, e) =>
                        new Date(e.end) > new Date(latest.end) ? e : latest
                      );
                      if (!last?.end) return;
                      const lastEndIso = new Date(last.end).toISOString();
                      setCustomStartTime(lastEndIso);
                      if (activeEntry) {
                        const updated = { ...activeEntry, start: lastEndIso };
                        setActiveEntry(updated);
                        setElapsed(
                          (Date.now() - Date.parse(lastEndIso)) / 1000
                        );
                      }
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
          )}

          {/* Timer */}
          <div className={`${isSticky ? "flex-shrink-0" : "mt-3"}`}>
            {!activeEntry ? (
              <Button
                className={`shadow-2xl bg-${settings.accentColor}-600 hover:bg-${settings.accentColor}-500 text-white font-medium transition-all duration-300 ${
                  isSticky
                    ? "text-xs py-2 px-4 rounded-lg"
                    : "text-lg py-6 rounded-2xl w-full"
                }`}
                onPress={startTimer}
                isDisabled={!selectedProject || !description.trim()}
              >
                <Play className={`${isSticky ? "w-3 h-3" : "w-5 h-5"} mr-1`} />
                Start
              </Button>
            ) : (
              <Button
                color="danger"
                className={`${
                  isSticky
                    ? "text-xs py-2 px-4 rounded-lg"
                    : "text-lg py-6 rounded-2xl w-full"
                }`}
                onPress={stopTimer}
              >
                <div
                  className={`font-mono ${
                    isSticky ? "text-sm" : "text-2xl"
                  } text-slate-100`}
                >
                  {formatTime(elapsed)}
                </div>
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}