import React, { useEffect, useState } from "react";
import { Card, CardBody, Button, Input } from "@nextui-org/react";
import { Edit3, Trash2, Save, PlusCircle } from "lucide-react";
import PageHeader from "../components/PageHeader";
import { useToast } from "../components/Toast";

export default function SettingsFavorites({ entries = [], onBack, settings, onSettingsChange }) {
  const { showToast } = useToast();
  const [taskMap, setTaskMap] = useState({});
  const [sortedTasks, setSortedTasks] = useState([]);

  /* ───────────── Tasks vorbereiten ───────────── */
  useEffect(() => {
    const map = entries.reduce((acc, e) => {
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
    setTaskMap(map);
    setSortedTasks(Object.values(map).sort((a, b) => b.count - a.count));
  }, [entries]);

  /* ───────────── Settings speichern ───────────── */
  useEffect(() => {
    localStorage.setItem("timetracko.settings", JSON.stringify(settings));
  }, [settings]);

  /* ───────────── Projektname holen ───────────── */
  function getProjectName(projectId) {
    if (!projectId) return null;
    try {
      const projects = JSON.parse(localStorage.getItem("timetracko.projects") || "[]");
      const project = projects.find((p) => p.id === projectId);
      return project?.name || null;
    } catch {
      return null;
    }
  }

  /* ───────────── Favoriten-Item ───────────── */
  function FavoriteItem({ favKey, t, label, index }) {
    const [isEditing, setIsEditing] = useState(false);
    const [tempLabel, setTempLabel] = useState(label);

    if (!t) return null;

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
          onSettingsChange({
            ...settings,
            manualFavorites: updated,
          });
        }}
        className="bg-slate-900/70 border border-slate-700 rounded-xl p-3 flex flex-col gap-2 transition-all hover:border-slate-600"
      >
        <div className="flex justify-between items-start">
          <div className="min-w-0">
            <div className="text-sm font-medium text-slate-100 truncate">
              {t.description || "(unbekannter Task)"}
            </div>
            <div className="text-xs text-slate-400 truncate">
              {getProjectName(t.projectId) || "–"}
            </div>
          </div>

          <div className="flex items-center gap-1">
            <Button
              isIconOnly
              size="sm"
              variant="light"
              className={`text-slate-400 hover:text-${settings.accentColor}-400`}
              onPress={() => setIsEditing((v) => !v)}
            >
              <Edit3 className="w-4 h-4" />
            </Button>
            <Button
              isIconOnly
              size="sm"
              variant="light"
              className="text-rose-500 hover:text-rose-400"
              onPress={() => {
                onSettingsChange({
                  ...settings,
                  manualFavorites: settings.manualFavorites.filter((k) => k !== favKey),
                });
                showToast("Favorit entfernt", "OK", null, 1500, "success");
              }}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Edit-Zeile */}
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
              className={`bg-${settings.accentColor}-600 hover:bg-${settings.accentColor}-500`}
              onPress={() => {
                onSettingsChange({
                  ...settings,
                  customLabels: { ...settings.customLabels, [favKey]: tempLabel },
                });
                setIsEditing(false);
                showToast("Titel gespeichert", "OK", null, 2000, "success");
              }}
            >
              <Save className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  /* ───────────── RENDER ───────────── */
  return (
    <div className="space-y-6 mt-6 pb-24">
      <PageHeader title="Favoriten bearbeiten" onBack={onBack} />

      <Card className="bg-slate-900/70 border border-slate-700 shadow-lg">
        <CardBody className="space-y-4">
          <p className="text-slate-400 text-sm">
            Hier kannst du die Reihenfolge, Namen und Auswahl deiner Favoriten anpassen.
          </p>

          {/* 1️⃣ Aktuelle Favoriten */}
          {settings.manualFavorites.length === 0 && (
            <p className="text-slate-500 text-sm">Noch keine Favoriten hinzugefügt.</p>
          )}

          <div className="space-y-2">
            {settings.manualFavorites.map((favKey, index) => {
              const t = taskMap[favKey];
              const label = settings.customLabels?.[favKey] || "";
              return (
                <FavoriteItem
                  key={`${favKey}-${index}`}
                  favKey={favKey}
                  t={t}
                  label={label}
                  index={index}
                />
              );
            })}
          </div>
        </CardBody>
      </Card>

      {/* 2️⃣ Weitere häufige Tasks */}
      <Card className="bg-slate-900/70 border border-slate-700 shadow-lg">
        <CardBody className="space-y-3">
          <h2 className="text-lg font-semibold text-slate-100">
            Weitere häufige Tasks
          </h2>
          {sortedTasks
            .filter((t) => !settings.manualFavorites.includes(t.key))
            .slice(0, 10)
            .map((t) => (
              <div
                key={t.key}
                className="flex justify-between items-center bg-slate-800/40 px-4 py-2 rounded-lg border border-transparent hover:border-slate-700"
              >
                <div>
                  <div className="font-medium text-slate-200 text-sm">
                    {t.description}
                  </div>
                  <div className="text-xs text-slate-400">
                    {getProjectName(t.projectId) || "–"}
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="light"
                  startContent={<PlusCircle className="w-4 h-4" />}
                  className={`text-${settings.accentColor}-400 hover:text-${settings.accentColor}-300`}
                  onPress={() => {
                    onSettingsChange({
                      ...settings,
                      manualMode: true,
                      manualFavorites: [...settings.manualFavorites, t.key],
                    });
                    showToast("Favorit hinzugefügt", "OK", null, 1500, "success");
                  }}
                >
                  Hinzufügen
                </Button>
              </div>
            ))}
        </CardBody>
      </Card>
    </div>
  );
}