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
  const [entries, setEntries] = useState(
    JSON.parse(localStorage.getItem("timetracko.entries")) || []
  );

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
    }
  );

  const { projects } = useContext(ProjectContext);
  const { showToast } = useToast();
  const suggestions = useSuggestions(entries);

  // 🧠 Einträge speichern
  useEffect(() => {
    localStorage.setItem("timetracko.entries", JSON.stringify(entries));
  }, [entries]);

  // 🧠 Settings speichern
  const handleSettingsChange = (updatedSettings) => {
    setSettings(updatedSettings);
    localStorage.setItem("timetracko.settings", JSON.stringify(updatedSettings));
  };

  // ➕ Neuen Eintrag hinzufügen
  const handleAddEntry = useCallback(
    (entry) => {
      const updated = [entry, ...entries];
      setEntries(updated);
      localStorage.setItem("timetracko.entries", JSON.stringify(updated));
    },
    [entries]
  );

  const handleAdd = (newEntry) => {
    setEntries((prev) => {
      const updated = [...prev, newEntry];

      // Sortiere alle Einträge nach Startzeit
      return updated.sort((a, b) => new Date(a.start) - new Date(b.start));
    });
  };

  // 💾 Eintrag bearbeiten
  const handleSaveEditedTask = (updatedTask) => {
    const updatedEntries = entries.map((e) =>
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
    );
    setEntries(updatedEntries);
    localStorage.setItem("timetracko.entries", JSON.stringify(updatedEntries));
  };

  // 🗑️ Eintrag löschen mit Undo
  const handleDeleteEntry = (id) => {
    const deletedEntry = entries.find((e) => e.id === id);
    const updatedEntries = entries.filter((e) => e.id !== id);
    setEntries(updatedEntries);
    localStorage.setItem("timetracko.entries", JSON.stringify(updatedEntries));

    showToast(
      "Eintrag gelöscht",
      "Rückgängig",
      () => {
        const restored = [deletedEntry, ...updatedEntries];
        setEntries(restored);
        localStorage.setItem("timetracko.entries", JSON.stringify(restored));
      },
      5000
    );
  };

  // 🔁 Task erneut starten
  const handleRestart = (entry) => {
    const restarted = {
      id: Date.now(),
      projectId: entry.projectId,
      projectName: entry.projectName,
      description: entry.description,
      start: new Date().toISOString(),
      end: null,
    };
    setActiveEntry(restarted);
  };

  // 🧠 Gesamtes Layout mit Tabs
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-800 to-slate-900 text-white pb-24">
      <div className="max-w-3xl mx-auto p-6 space-y-6">
        {activeTab === "home" && (
          <>
            {/* ⏱ Eingabeformular */}

            <TimeEntryForm
              onAdd={handleAddEntry}
              activeEntry={activeEntry}
              setActiveEntry={setActiveEntry}
              suggestions={suggestions}
              entries={entries}
            />

            {/* ⭐ Favoritenleiste */}
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

            {/* 📋 Liste */}
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
              onAdd={handleAdd}     // 👈 hier sicherstellen, dass das existiert!
            />
          </>
        )}

        {activeTab === "stats" && (
          <StatsPage
            entries={entries}
            settings={settings}  // ✅ pass settings here
            onBack={() => setActiveTab("home")}
          />
        )}

        {activeTab === "settings" && (
          <SettingsPage
            entries={entries}
            onSettingsChange={handleSettingsChange}
            onBack={() => setActiveTab("home")}
          />
        )}
      </div>

      {/* 🔧 Edit Modal */}
      <EditTaskModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        task={editTask}
        onSave={handleSaveEditedTask}
        projects={projects}
      />

      {/* 🔻 Bottom Navigation */}
      <BottomNav activeTab={activeTab} onChange={setActiveTab} />
    </div>
  );
}