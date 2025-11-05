import React, { useState, useContext, useEffect, useCallback, useRef } from "react";
import TimeEntryForm from "./components/TimeEntryForm";
import EntryList from "./components/EntryList";
import FavoritesBar from "./components/FavoritesBar";
import StatsPage from "./StatsPage";
import SettingsPage from "./pages/SettingsPage";
import SettingsCustomers from "./pages/SettingsCustomers";
import SettingsProjects from "./pages/SettingsProjects";
import SettingsFavorites from "./pages/SettingsFavorites";
import BottomNav from "./components/BottomNav";
import { ProjectContext } from "./context/ProjectContext";
import { useToast } from "./components/Toast";
import useSuggestions from "./hooks/useSuggestions";
import EditTaskModal from "./components/modals/EditTaskModal";

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
      workdays: ["mon", "tue", "wed", "thu", "fri"],
      favoriteDetails: stored.favoriteDetails || {},
      ...stored,
    }
  );
  const [selectedFavorite, setSelectedFavorite] = useState(null);

  const skipNextReset = useRef(false);
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

  // ➕ Manuell hinzufügen
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
    const deletedEntry = entries.find((e) => e.id === id);
    if (!deletedEntry) return;
    setEntries((prev) => writeSorted(prev.filter((e) => e.id !== id)));
    showToast(
      "Eintrag gelöscht",
      "Rückgängig",
      () => setEntries((prev2) => writeSorted([deletedEntry, ...prev2])),
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

    skipNextReset.current = true;
    setActiveEntry(restarted);
    showToast(`⏱ Timer gestartet für ${entry.projectName}`, "OK", null, 3000, "success");
  };

  // ----------------------------------------------------
  // 📄 Seitenlogik: normales Layout vs. Unterseiten
  // ----------------------------------------------------
  let content;

  if (["home", "stats", "settings"].includes(activeTab)) {
    // 🔹 Normales Layout (mit Formular, Favoriten, Liste, etc.)
    content = (
      <>
        {activeTab === "home" && (
          <>
            <TimeEntryForm
              onAdd={handleAddEntry}
              activeEntry={activeEntry}
              setActiveEntry={setActiveEntry}
              suggestions={suggestions}
              entries={entries}
              settings={settings}
              selectedFavorite={selectedFavorite}
            />

            <FavoritesBar
              entries={entries}
              settings={settings}
              activeEntry={activeEntry}
              onSelectFavorite={(fav) => setSelectedFavorite(fav)} // 🧠 hier kommt der Trigger

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

        {activeTab === "stats" && (
          <StatsPage
            entries={entries}
            settings={settings}
            onBack={() => setActiveTab("home")}
          />
        )}

        {activeTab === "settings" && (
          <SettingsPage
            entries={entries}
            onSettingsChange={handleSettingsChange}
            onBack={() => setActiveTab("home")}
            onNavigate={setActiveTab}
          />
        )}
      </>
    );
  } else if (activeTab === "settings-projects") {
    // 🔹 Separate Seite: Projekte
    content = <SettingsProjects onBack={() => setActiveTab("settings")} settings={settings} />;
  } else if (activeTab === "settings-customers") {
    // 🔹 Separate Seite: Kunden
    content = <SettingsCustomers onBack={() => setActiveTab("settings")} settings={settings} />;
  } else if (activeTab === "settings-favorites") {
    // 🔹 Separate Seite: favoriten
    content =  <SettingsFavorites 
                entries={entries} 
                onBack={() => setActiveTab("settings")} 
                settings={settings} 
                onSettingsChange={handleSettingsChange}
                />;
  } else {
    // Fallback
    content = (
      <EntryList
        entries={entries}
        settings={settings}
        onRestart={handleRestart}
        onDelete={handleDeleteEntry}
      />
    );
  }

  // ----------------------------------------------------
  // 🧱 App Layout
  // ----------------------------------------------------
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-800 to-slate-900 text-white pb-24">
      <div className="max-w-3xl mx-auto p-6 space-y-6">
        {content}
      </div>

      {/* ✏️ Bearbeitungsmodal */}
      <EditTaskModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        task={editTask}
        onSave={handleSaveEditedTask}
        projects={projects}
      />

      {/* 🔻 Bottom Navigation */}
      <BottomNav activeTab={activeTab} onChange={setActiveTab} settings={settings} />
    </div>
  );
}

// 🎨 Accent-Farbe für Komponenten
export function useAccentColor() {
  const stored = JSON.parse(localStorage.getItem("timetracko.settings") || "{}");
  return stored.accentColor || "indigo";
}