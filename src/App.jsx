import React, { useState, useContext, useEffect, useCallback } from "react";
import TimeEntryForm from "./components/TimeEntryForm";
import EntryList from "./components/EntryList";
import FavoritesBar from "./components/FavoritesBar";
import StatsPage from "./StatsPage";
import SettingsPage from "./SettingsPage";
import BottomNav from "./components/BottomNav";
import { ProjectContext } from "./context/ProjectContext";
import { useToast } from "./components/Toast";
import useSuggestions from "./hooks/useSuggestions";
import EditTaskModal from "./components/EditTaskModal";

export default function App() {
  // 🧠 Lokaler State
  const [entries, setEntries] = useState(() => {
    const stored = JSON.parse(localStorage.getItem("timetracko.entries")) || [];
    return stored.sort((a, b) => new Date(b.start) - new Date(a.start));
  });

  const [activeEntry, setActiveEntry] = useState(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [activeTab, setActiveTab] = useState("home");
  const [settings, setSettings] = useState(
    JSON.parse(localStorage.getItem("timetracko.settings")) || {
      showFavorites: true,
      manualMode: false,
      manualFavorites: [],
      customLabels: {},
      roundToQuarter: false,
      accentColor: "indigo",
    }
  );

  const { projects } = useContext(ProjectContext);
  const { showToast } = useToast();
  const suggestions = useSuggestions(entries);

  // 🧩 Hilfsfunktionen
  const sortByStart = (a, b) => new Date(b.start) - new Date(a.start);
  const writeSorted = (next) => [...next].sort(sortByStart);

  // 🧠 Änderungen persistieren
  useEffect(() => {
    localStorage.setItem("timetracko.entries", JSON.stringify(entries));
  }, [entries]);

  const handleSettingsChange = (updatedSettings) => {
    setSettings(updatedSettings);
    localStorage.setItem("timetracko.settings", JSON.stringify(updatedSettings));
  };

  // ➕ Neuer Eintrag
  const handleAddEntry = useCallback(
    (entry) => {
      setEntries((prev) => writeSorted([...prev, entry]));
    },
    []
  );

  // ➕ "Fehlende Buchung" hinzufügen
  const handleAdd = (newEntry) => {
    setEntries((prev) => writeSorted([...prev, newEntry]));
  };

  // ☕ Pause hinzufügen
  const handleConvertToPause = (gap) => {
    if (!gap) return;
    const pauseEntry = {
      id: Date.now(),
      projectId: "PAUSE",
      projectName: "Pause",
      description: "Pause",
      start: gap.from.toISOString(),
      end: gap.to.toISOString(),
      duration: ((gap.to - gap.from) / 3600000).toFixed(2),
    };
    setEntries((prev) => writeSorted([...prev, pauseEntry]));
    showToast("☕ Pause hinzugefügt", "OK", null, 3000, "success");
  };

  // 💾 Eintrag bearbeiten
  const handleSaveEditedTask = (updatedTask) => {
    setEntries((prev) =>
      writeSorted(
        prev.map((e) =>
          e.id === updatedTask.id
            ? {
                ...updatedTask,
                duration: (
                  (new Date(updatedTask.end) - new Date(updatedTask.start)) /
                  1000 /
                  60 /
                  60
                ).toFixed(2),
              }
            : e
        )
      )
    );
  };

  // 🗑️ Eintrag löschen + Undo
  const handleDeleteEntry = (id) => {
    // 1️⃣ Schritt: Lokale Referenz merken
    const deletedEntry = entries.find((e) => e.id === id);
    if (!deletedEntry) return;

    // 2️⃣ Schritt: State direkt aktualisieren
    setEntries((prev) => writeSorted(prev.filter((e) => e.id !== id)));

    // 3️⃣ Schritt: Toast außerhalb des State-Updaters
    showToast(
      "Eintrag gelöscht",
      "Rückgängig",
      () => {
        // ✅ Undo innerhalb eines neuen State-Updates
        setEntries((prev2) => writeSorted([deletedEntry, ...prev2]));
      },
      4000
    );
  };

  // 🔁 Task erneut starten
  const handleRestart = (entry) => {
    if (activeEntry) {
      showToast("Es läuft bereits ein Timer!", "OK", null, 3000, "warning");
      return;
    }

    if (!entry.projectId) {
      showToast("Dieses Favorit-Element hat kein Projekt zugewiesen", "OK", null, 3000, "error");
      return;
    }

    const restarted = {
      id: Date.now(),
      projectId: entry.projectId?.toString() || "",
      projectName: entry.projectName || "Unbekannt",
      description: entry.description || "",
      start: new Date().toISOString(),
      end: null,
      duration: 0,
    };

    // 🧠 Nur aktiv setzen – noch NICHT speichern!
    setActiveEntry(restarted);

    showToast(
      `⏱ Timer gestartet für ${entry.projectName}`,
      "OK",
      null,
      3000,
      "success"
    );
  };

  // 🧱 App Layout
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-800 to-slate-900 text-white pb-24">
      <div className="max-w-3xl mx-auto p-6 space-y-6">

        {/* 🏠 Hauptseite */}
        {activeTab === "home" && (
          <>
            <TimeEntryForm
              onAdd={handleAddEntry}
              activeEntry={activeEntry}
              setActiveEntry={setActiveEntry}
              suggestions={suggestions}
              entries={entries}
              settings={settings}
            />

            <FavoritesBar
              entries={entries}
              settings={settings}
              activeEntry={activeEntry}
              onSelect={(fav) =>
                handleRestart({
                  projectId: fav.projectId,
                  projectName: fav.projectName,
                  description: fav.description,
                })
              }
            />

            <EntryList
              entries={entries}
              activeEntry={activeEntry}
              onEdit={(entry) => {
                setEditTask(entry);
                setEditModalOpen(true);
              }}
              settings={settings}
              onDelete={handleDeleteEntry}
              onRestart={handleRestart}
              onAdd={handleAdd}
              onConvertToPause={handleConvertToPause}
              suggestions={suggestions}
            />
          </>
        )}

        {/* 📊 Statistiken */}
        {activeTab === "stats" && (
          <StatsPage
            entries={entries}
            settings={settings}
            onBack={() => setActiveTab("home")}
          />
        )}

        {/* ⚙️ Einstellungen */}
        {activeTab === "settings" && (
          <SettingsPage
            entries={entries}
            onSettingsChange={handleSettingsChange}
            onBack={() => setActiveTab("home")}
          />
        )}
      </div>

      {/* ✏️ Bearbeitungsmodal */}
      <EditTaskModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        task={editTask}
        onSave={handleSaveEditedTask}
        projects={projects}
      />

      {/* 🔻 Navigation */}
      <BottomNav activeTab={activeTab} onChange={setActiveTab} settings={settings} />
    </div>
  );
}

// 🎨 Accent-Farbe für Komponenten
export function useAccentColor() {
  const stored = JSON.parse(localStorage.getItem("timetracko.settings") || "{}");
  return stored.accentColor || "indigo";
}