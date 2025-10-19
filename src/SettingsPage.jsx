import React, { useState, useEffect } from "react";
import {
  Switch,
  Card,
  CardBody,
  Button,
  Input,
} from "@nextui-org/react";
import { Upload, Download, FolderCog, Users, Edit3, Trash2, Save } from "lucide-react";
import ProjectModal from "./components/ProjectModal";
import CustomerModal from "./components/CustomerModal";
import { exportAllData, exportEntriesCSV } from "./utils/exportData";
import { importAllData } from "./utils/importData";
import PageHeader from "./components/PageHeader";
import { useToast } from "./components/Toast";
import useICalCalendar from "./hooks/useICalCalendar";
import CalendarSuggestions from "./components/CalendarSuggestions";

export default function SettingsPage({ entries, onSettingsChange, onBack }) {
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [settings, setSettings] = useState({
    showFavorites: true,
    manualMode: false,
    manualFavorites: [],
    customLabels: {},
  });

  const [showProjects, setShowProjects] = useState(false);
  const [showCustomers, setShowCustomers] = useState(false);
  const { showToast } = useToast();
  // 📆 Outlook Kalender State
  const [icalUrl, setIcalUrl] = useState(localStorage.getItem("ical.url") || "");
  const { events, loading, error } = useICalCalendar(icalUrl);

  useEffect(() => {
    localStorage.setItem("ical.url", icalUrl);
  }, [icalUrl]);

  // 🔹 Settings laden
  useEffect(() => {
    const stored = localStorage.getItem("timetracko.settings");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setSettings((prev) => ({ ...prev, ...parsed }));
      } catch {
        console.warn("⚠️ Settings fehlerhaft, fallback genutzt.");
      }
    }
    setSettingsLoaded(true);
  }, []);

  // 🔹 Settings speichern
  useEffect(() => {
    if (!settingsLoaded) return;
    localStorage.setItem("timetracko.settings", JSON.stringify(settings));
    onSettingsChange?.(settings);
  }, [settings, settingsLoaded]);

  const toggleSetting = (key) =>
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));

  // 🔹 Favoriten bearbeiten
  const taskMap = entries.reduce((acc, e) => {
    const key = `${e.projectId}::${e.description}`;
    if (!acc[key])
      acc[key] = {
        key,
        projectId: e.projectId,
        projectName: e.projectName,
        description: e.description,
        count: 0,
      };
    acc[key].count++;
    return acc;
  }, {});
  const sortedTasks = Object.values(taskMap).sort((a, b) => b.count - a.count);

  // ✅ JSON Export mit Toast
  const handleExportAll = () => {
    try {
      exportAllData(entries, settings);
      showToast("Export abgeschlossen", "OK", null, 5000, "success") ;
    } catch (err) {
      showToast("Fehler beim Export", "OK", null, 5000, "error") ;
    }
  };

  // ✅ CSV Export mit Toast
  const handleExportCSV = () => {
    try {
      exportEntriesCSV(entries);
      showToast("CSV-Datei exportiert", "OK", null, 5000, "success") ;
    } catch (err) {
      showToast("Fehler beim CSV-Export", "OK", null, 5000, "error") ;
    }
  };

  // ✅ Import mit Toast
  const handleImport = (file) => {
    if (!file) return;
    try {
      importAllData(file, () => {
        showToast("Import erfolgreich 📥", "Neu laden", () => {
          window.location.reload();
        }, 5000, "success") ;
      });
    } catch (err) {
      showToast("Fehler beim Import", "OK", null, 5000, "error") ;
    }
  };


  //inline Komponente
  function FavoriteItem({ favKey, t, label, index, settings, setSettings }) {
    const [isEditing, setIsEditing] = React.useState(false);
    const [tempLabel, setTempLabel] = React.useState(label);

    if (!t) return null; // Safety, falls Key nicht mehr existiert

    return (
      <div
        draggable
        onDragStart={(e) => e.dataTransfer.setData("dragIndex", String(index))}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          const dragIndex = parseInt(e.dataTransfer.getData("dragIndex"), 10);
          const updated = [...settings.manualFavorites];
          const [moved] = updated.splice(dragIndex, 1);
          updated.splice(index, 0, moved);
          setSettings((prev) => ({ ...prev, manualFavorites: updated }));
        }}
        className="bg-slate-900/70 border border-slate-700 rounded-xl p-3 flex flex-col gap-2 transition-all hover:border-slate-600"
      >
        {/* Header: Titel + Icons */}
        <div className="flex justify-between items-start">
          <div className="min-w-0">
            <div className="text-sm font-medium text-slate-100 truncate">
              {t.description || "(unbekannter Task)"}
            </div>
            <div className="text-xs text-slate-400 truncate">
              {t.projectName || "-"}
            </div>
          </div>

          <div className="flex items-center gap-1">
            <Button
              isIconOnly
              size="sm"
              variant="light"
              className="text-slate-400 hover:text-indigo-400"
              onPress={() => setIsEditing((v) => !v)}
              aria-label="Anzeigetitel bearbeiten"
            >
              <Edit3 className="w-4 h-4" />
            </Button>
            <Button
              isIconOnly
              size="sm"
              variant="light"
              className="text-rose-500 hover:text-rose-400"
              onPress={() =>
                setSettings((prev) => ({
                  ...prev,
                  manualFavorites: prev.manualFavorites.filter((k) => k !== favKey),
                }))
              }
              aria-label="Favorit entfernen"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Edit-Zeile animiert */}
        <div
          className={`transition-all duration-300 overflow-hidden ${
            isEditing ? "max-h-20 opacity-100 mt-1" : "max-h-0 opacity-0"
          }`}
        >
          <div className="flex items-center gap-2">
            <Input
              size="sm"
              radius="sm"
              variant="bordered"
              placeholder="Anzeigetitel (optional)"
              value={tempLabel}
              onChange={(e) => setTempLabel(e.target.value)}
              classNames={{
                input: "text-slate-200 text-sm",
                inputWrapper:
                  "bg-slate-800 border border-slate-700 data-[hover=true]:bg-slate-700",
              }}
            />
            <Button
              isIconOnly
              size="sm"
              color="primary"
              variant="flat"
              onPress={() => {
                setSettings((prev) => ({
                  ...prev,
                  customLabels: { ...prev.customLabels, [favKey]: tempLabel },
                }));
                setIsEditing(false);
              }}
              aria-label="Anzeigetitel speichern"
            >
              <Save className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  }


  return (
    <div className="space-y-6 mt-6 pb-20 relative">
      <PageHeader onBack={onBack} title="Einstellungen" subtitle="" />

      <Card className="bg-slate-900/70 border border-slate-700 shadow-lg">
        <CardBody className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-100">Darstellung</h2>

          <div className="flex justify-between items-center">
            <span className="text-slate-300 text-sm">
              Rundung auf 15-Minuten-Blöcke
            </span>
            <Switch
              size="sm"
              color="primary"
              isSelected={settings.roundToQuarter}
              onValueChange={(val) => {
                setSettings((prev) => ({ ...prev, roundToQuarter: val }));
                showToast("Einstellung gespeichert", "OK", null, 3000, "success");
              }}
            />
          </div>
          <div className="flex justify-between items-center">
                <span className="text-slate-300 text-sm">Favoriten anzeigen?</span>
                <Switch
                  size="sm"
                  color="primary"
                  isSelected={settings.showFavorites}
                  onValueChange={() => {
                    toggleSetting("showFavorites");
                    showToast("Einstellung gespeichert", "OK", null, 3000, "success");
                  }}
                />
              </div>
        </CardBody>
      </Card>
      <div className="grid gap-4">
        <div className="space-y-6 mt-6 pb-24">
          {/* 🔸 Favoriten */}
          <Card className="bg-slate-900/70 border border-slate-700 shadow-lg">
            <CardBody className="space-y-6">
              <h2 className="text-lg font-semibold text-slate-100">Favoriten</h2>
              <p className="text-slate-400 text-xs">
                Bestimme, welche Tasks in der Favoriten-Leiste erscheinen oder schalte sie aus.
              </p>

              {/* Favoriten bearbeiten */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-slate-300 font-medium">Favoriten bearbeiten</span>
                  {settings.manualMode && (
                    <span className="text-xs text-slate-400 italic">(manuell aktiv)</span>
                  )}
                </div>

                {/* 1️⃣ Manuelle Favoriten */}
                {settings.manualFavorites.map((favKey, index) => {
                  const t = taskMap[favKey];
                  const label = settings.customLabels?.[favKey] || "";

                  return (
                    <FavoriteItem
                      key={favKey}
                      favKey={favKey}
                      t={t}
                      label={label}
                      index={index}
                      settings={settings}
                      setSettings={setSettings}
                    />
                  );
                })}

                {/* 2️⃣ Weitere Aufgaben */}
                <div className="flex flex-col gap-2 pt-3">
                  {sortedTasks
                    .filter((t) => !settings.manualFavorites.includes(t.key))
                    .slice(0, 10) // 🔹 Nur die Top 10 anzeigen
                    .map((t) => (
                      <div
                        key={t.key}
                        className="flex justify-between items-center bg-slate-800/40 px-4 py-2 rounded-lg border border-transparent hover:border-slate-700"
                      >
                        <div>
                          <div className="font-medium text-slate-200 text-sm">{t.description}</div>
                          <div className="text-xs text-slate-400">{t.projectName}</div>
                        </div>
                        <button
                          className="text-xs text-indigo-400 hover:text-indigo-300"
                          onClick={() =>
                            setSettings((prev) => ({
                              ...prev,
                              manualMode: true,
                              manualFavorites: [...prev.manualFavorites, t.key],
                            }))
                          }
                        >
                          Hinzufügen
                        </button>
                      </div>
                    ))}
                </div>
              </div>
            </CardBody>
          </Card>

          {/* 📁 Projekte & Kunden */}
          <Card className="bg-slate-900/70 border border-slate-700 shadow-lg">
            <CardBody className="space-y-4">
              <h2 className="text-lg font-semibold text-slate-100">📁 Projekte & Kunden</h2>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  fullWidth
                  color="secondary"
                  variant="flat"
                  onPress={() => setShowProjects(true)}
                  startContent={<FolderCog className="w-4 h-4" />}
                >
                  Projekte bearbeiten
                </Button>
                <Button
                  fullWidth
                  color="secondary"
                  variant="flat"
                  onPress={() => setShowCustomers(true)}
                  startContent={<Users className="w-4 h-4" />}
                >
                  Kunden bearbeiten
                </Button>
              </div>
            </CardBody>
          </Card>

          {/* 💾 Datenverwaltung */}
          <Card className="bg-slate-900/70 border border-slate-700 shadow-lg">
            <CardBody className="space-y-4">
              <h2 className="text-lg font-semibold text-slate-100">💾 Datenverwaltung</h2>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button color="primary" onPress={handleExportAll}>
                  Exportieren (alles als JSON)
                </Button>
                <Button variant="flat" onPress={handleExportCSV}>
                  Nur Zeiteinträge (CSV)
                </Button>

                <label htmlFor="import-file" className="cursor-pointer">
                  <input
                    id="import-file"
                    type="file"
                    accept=".json"
                    className="hidden"
                    onChange={(e) => handleImport(e.target.files?.[0])}
                  />
                  <Button color="secondary" as="span">
                    Importieren
                  </Button>
                </label>
              </div>
            </CardBody>
          </Card>

          {/* 📆 Outlook Kalender (ICS-Feed) */}
          <Card className="bg-slate-900/70 border border-slate-700 shadow-lg">
            <CardBody className="space-y-4">
              <h2 className="text-lg font-semibold text-slate-100">
                📆 Outlook Kalender
              </h2>

              <p className="text-xs text-slate-400">
                Füge deinen Outlook-ICS-Link hinzu, um heutige Termine anzuzeigen.
              </p>

              <Input
                label="ICS-Link"
                placeholder="https://outlook.office365.com/owa/calendar/..."
                value={icalUrl}
                onChange={(e) => setIcalUrl(e.target.value)}
                size="sm"
                variant="flat"
              />

              <Button color="primary" onPress={() => refetch()}>
                Kalender laden
              </Button>

              {loading ? (
                <div className="text-slate-400 text-sm">Lade Kalenderdaten...</div>
              ) : error ? (
                <div className="text-rose-400 text-sm">Fehler: {error}</div>
              ) : (
                <CalendarSuggestions
                  events={events}
                  onImport={(ev) => {
                    const newEntry = {
                      id: Date.now(),
                      projectId: "outlook",
                      projectName: ev.location || "Outlook",
                      description: ev.title,
                      start: ev.start.toISOString(),
                      end: ev.end.toISOString(),
                      duration:
                        (new Date(ev.end) - new Date(ev.start)) / 1000 / 60 / 60,
                    };
                    onAdd?.(newEntry);
                  }}
                />
              )}
            </CardBody>
          </Card>

          {/* Modals */}
          {showProjects && (
            <ProjectModal isOpen={showProjects} onClose={() => setShowProjects(false)} />
          )}
          {showCustomers && (
            <CustomerModal isOpen={showCustomers} onClose={() => setShowCustomers(false)} />
          )}
        </div>
      </div>
    </div>
  );
}