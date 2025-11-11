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
  Select,
  SelectItem,
  Input
} from "@nextui-org/react";
import { ProjectContext } from "../context/ProjectContext";
import { CustomerContext } from "../context/CustomerContext";
import { Play, X } from "lucide-react";
import { useToast } from "./Toast";

export default function TimeEntryForm({
  onAdd,
  activeEntry,
  setActiveEntry,
  suggestions,
  entries = [],
  settings,
  selectedFavorite,
}) {
  const { projects } = useContext(ProjectContext);
  const visibleProjects = projects.filter(p => !p.hidden);
  const { customers } = useContext(CustomerContext);

  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [selectedActivityId, setSelectedActivityId] = useState("");  
  const [description, setDescription] = useState("");
  const suggestionRef = useRef(null);
  const [showTimeInput, setShowTimeInput] = useState(false);
  const [showActivitySelect, setShowActivitySelect] = useState(false);

  const [customStartTime, setCustomStartTime] = useState(
    new Date().toISOString().slice(0, 16)
  );
  const [elapsed, setElapsed] = useState(0);
  const [isSticky, setIsSticky] = useState(false);
  const formRef = useRef(null);

  const [barHeight, setBarHeight] = useState(0);
  const barRef = useRef(null);
  const skipNextAutoSave = useRef(false);
  const lastSelectedDescription = useRef(null);

  const { showToast } = useToast();

  useEffect(() => {
    if (!selectedFavorite) return;

    const project = visibleProjects.find(
      (p) => p.id === selectedFavorite.projectId
    );
    if (!project) return;

    const startIso = new Date().toISOString();

    // 🧩 neuen aktiven Eintrag setzen
    const newEntry = {
      id: Date.now(),
      projectId: project.id,
      projectName: project.name,
      description: selectedFavorite.description,
      start: startIso,
      end: null,
      activityId: selectedFavorite.activityId || "",
    };

    setSelectedProject(project);
    setSelectedProjectId(project.id);
    setSelectedActivityId(selectedFavorite.activityId || "");
    setDescription(selectedFavorite.description || "");
    setActiveEntry(newEntry);
    setElapsed(0);
  }, [selectedFavorite]);

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
    if (!formRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => setIsSticky(!entry.isIntersecting),
      { threshold: 1.0 }
    );
    observer.observe(formRef.current);
    return () => observer.disconnect();
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
    if (!activeEntry) return;

    setDescription(activeEntry.description || "");
    setCustomStartTime(new Date(activeEntry.start).toISOString().slice(0, 16));

    // Projekt-Objekt zur ID holen
    const proj = visibleProjects.find(p => p.id === activeEntry.projectId) || null;
    setSelectedProject(proj);
    setSelectedProjectId(proj?.id || "");

    // Tätigkeit-ID übernehmen (falls vorhanden)
    setSelectedActivityId(activeEntry.activityId || "");
  }, [activeEntry, visibleProjects]);

  /* ───────────── Projekte gruppieren (nach customerId) ───────────── */
  const grouped = customers.map((cust) => ({
    customer: cust.name,
    projects: visibleProjects.filter((p) => p.customerId === cust.id),
  }));


  // Optional: Projekte ohne Kunden
  const unassigned = visibleProjects.filter((p) => !p.customerId);
  if (unassigned.length > 0) {
    grouped.push({ customer: "Ohne Kunden", projects: unassigned });
  }

  /* ───────────── Timer Start/Stop ───────────── */
  const startTimer = () => {
    if (!selectedProject || !description.trim()) return;

      // ⛔ Prüfen, ob Projekt beendet ist
    if (selectedProject.endDate && new Date(selectedProject.endDate) < new Date()) {
      showToast("Projekt ist beendet", "OK", null, 3000, "warning");
      return;
    }
    
    const startIso = showTimeInput ? customStartTime : new Date().toISOString();
    const newEntry = {
      id: Date.now(),
      projectId: selectedProject.id,
      projectName: selectedProject.name,
      description,
      start: startIso,
      end: null,
      activityId: selectedActivityId || "",
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

    // 🧠 State sauber zurücksetzen
    setActiveEntry(null);
    setDescription("");
    setSelectedProject(null);
    setSelectedProjectId("");
    setSelectedActivityId("");

    // 🔒 Activity-/Time-Accordions schließen
    setShowActivitySelect(false);
    setShowTimeInput(false);
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
        className={`transition-[background-color,box-shadow,padding] duration-300 ease-out
          ${isSticky
            ? "fixed top-0 left-0 right-0 z-50 w-full bg-gradient-to-b from-slate-700/50 to-slate-800 border-b border-slate-700 backdrop-blur-md shadow-lg justify-items-center text-center"
            : "bg-gradient-to-b from-slate-700/50 to-slate-800 border border-slate-200/10 rounded-2xl shadow-2xl p-4 mb-6"
          } max-w-screen`}
      >
        {/* Titel */}
        {!isSticky && (
          <h2 className="text-2xl font-semibold text-slate-200 px-4 mb-4 mt-6 tracking-tight">
            what are you working on?
          </h2>
        )}

        {/* Inhalt */}
        <div
          className={`flex max-w-3xl w-full p-4 ${
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
            aria-label="Beschreibung hinzufügen"
            onInputChange={(val) => {
              setDescription(val);
              if (activeEntry)
                setActiveEntry({ ...activeEntry, description: val });
            }}
            onSelectionChange={(key) => {
              if (!key) return;

              // 🔹 Entschlüsseln
              const [projectId, description] = key.split("::");

              const project = visibleProjects.find((p) => p.id === projectId);
              if (!project) return;

              setDescription(description);
              setSelectedProject(project);
              setSelectedProjectId(projectId);

              const defaultAct = project.activities?.find((a) => a.isDefault);
              setSelectedActivityId(defaultAct?.id || "");

              // Falls ein Timer läuft → abschließen
              if (activeEntry) {
                const end = new Date().toISOString();
                const duration =
                  (new Date(end) - new Date(activeEntry.start)) / 1000 / 60 / 60;
                onAdd({ ...activeEntry, end, duration: duration.toFixed(2) });
              }

              // ⏱ Neuen Timer starten
              const startIso = new Date().toISOString();
              const newEntry = {
                id: Date.now(),
                projectId,
                projectName: project.name,
                description,
                start: startIso,
                end: null,
                activityId: defaultAct?.id || selectedActivityId || "",
              };

              setActiveEntry(newEntry);
              setElapsed(0);
            }}
            classNames={{
              popoverContent: "ac-popover",
              listboxWrapper: "max-h-[60vh]",
            }}
            className={`transition-all duration-200 ${
              isSticky
                ? "bg-slate-800/70 w-full"
                : "bg-slate-800 hover:bg-slate-700"
            } rounded-xl border border-slate-700`}
            onKeyDown={(e) => {
              // 🟡 Optional: Wenn kein Vorschlag aktiv ist, Enter = "bestätigen"
              if (e.key === "Enter" && !suggestions.some((s) => s.description === description)) {
                e.preventDefault();
                // hier kannst du z. B. direkt den Timer starten oder Fokus wechseln
              }
            }}
          >
            {suggestions
              ?.filter((s) => {
                if (!s.lastUsed) return true;
                const lastUsedDate = new Date(s.lastUsed);
                const daysSince = (Date.now() - lastUsedDate) / (1000 * 60 * 60 * 24);
                return daysSince <= 31;
              })
              .map((s) => {
                const project = projects.find((p) => p.id === s.projectId);
                const value = `${s.projectId || "none"}::${s.description}`; // eindeutiger Wert

                return (
                  <AutocompleteItem key={value} textValue={s.description} value={value}>
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
            selectedKey={selectedProjectId}
            aria-label="Projekt auswählen"
            onSelectionChange={(key) => {
              if (!key) return;
              const newProjectId = typeof key === "string" ? key : [...key][0];
              const newProject = visibleProjects.find((p) => p.id === newProjectId) || null;

              setSelectedProjectId(newProjectId);
              setSelectedProject(newProject);

              const defaultActivityObj = newProject?.activities?.find((a) => a.isDefault);
              setSelectedActivityId(defaultActivityObj?.id || "");

              if (activeEntry) {
                setActiveEntry((prev) => ({
                  ...prev,
                  projectId: newProjectId,
                  projectName: newProject?.name || "Unbekannt",
                  activityId: defaultActivityObj?.id || prev?.activityId || "",
                }));
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

          {/* Nur in der großen Ansicht */}
          {!isSticky && (
            <div>

              {/* 🔹 Toggle Buttons */}
              <div
                className={`flex ${
                  selectedProject ? "justify-between" : "justify-end"
                }`}
              >
                {selectedProject && (
                  <button
                    onClick={() => {
                      setShowActivitySelect((prev) => !prev);
                      setShowTimeInput(false); // 🟢 Nur eins offen
                    }}
                    className={`text-xs transition-colors ${
                      showActivitySelect
                        ? "text-slate-200"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    Tätigkeit anpassen
                  </button>
                )}

                <button
                  onClick={() => {
                    setShowTimeInput((prev) => !prev);
                    setShowActivitySelect(false); // 🟢 Nur eins offen
                  }}
                  className={`text-xs transition-colors ${
                    showTimeInput
                      ? "text-slate-200"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Startzeit anpassen
                </button>
              </div>

              {/* 🔻 Accordion-Content */}
              <div className="overflow-hidden transition-all duration-300">
                {/* 🧩 Tätigkeit-Auswahl */}
                {showActivitySelect && (
                  <div className="mt-2">
                  {selectedProject?.activities?.length > 0 ? (
                    <>
                      <Select
                        label="Tätigkeit auswählen"
                        placeholder="Wähle eine Tätigkeit"
                        selectedKeys={selectedActivityId ? [selectedActivityId] : []}
                        onSelectionChange={(keys) => {
                          const val = Array.from(keys)[0]; // das ist die activityId
                          setSelectedActivityId(val);
                          if (activeEntry) setActiveEntry((prev) => ({ ...prev, activityId: val }));
                        }}
                        size="sm"
                        classNames={{
                          base: "w-full",
                          label: "!text-slate-400 text-xs",
                          trigger:
                            "bg-slate-700 hover:!bg-slate-600 !text-slate-200 rounded-md h-8 border border-slate-700",
                          popoverContent:
                            "bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700",
                        }}
                      >
                        {selectedProject?.activities?.map((a) => (
                          <SelectItem key={a.id} value={a.id}>
                            {a.label}
                          </SelectItem>
                        ))}
                      </Select>
                    </>
                  ) : (
                    <div className="text-xs text-slate-500 italic">
                      Keine Tätigkeiten definiert
                    </div>
                  )}
                </div>
                )}

                {/* 🕓 Startzeit-Auswahl */}
                {showTimeInput && (
                  <div className="mt-2">
                    <div className="flex items-center gap-3">
                      <Input
                        type="time"
                        step="60"
                        size="sm"
                        color="white"
                        variant="flat"
                        classNames={{
                          base: "flex-1 w-auto",
                          inputWrapper:
                            "bg-slate-700 hover:bg-slate-600 rounded-md h-8 border border-slate-700",
                          input: "text-slate-400 text-xs placeholder:text-slate-500",
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

                      <Button
                        size="sm"
                        variant="flat"
                        className="text-xs bg-slate-700 hover:bg-slate-600 text-slate-400"
                        onPress={() => {
                          const finishedEntries = entries.filter((e) => e?.end);
                          if (finishedEntries.length === 0) return;

                          const last = finishedEntries.sort(
                            (a, b) => new Date(b.end) - new Date(a.end)
                          )[0];
                          if (!last?.end) return;

                          const lastEndIso = new Date(last.end).toISOString();
                          setCustomStartTime(lastEndIso);

                          if (activeEntry) {
                            skipNextAutoSave.current = true; // 🧠 verhindert Autocomplete-Neustart
                            setActiveEntry((prev) => prev ? { ...prev, start: lastEndIso } : prev);
                            setElapsed((Date.now() - Date.parse(lastEndIso)) / 1000);
                          }
                        }}
                      >
                        Letzte Endzeit übernehmen
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}