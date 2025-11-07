import React, { useState, useEffect } from "react";
import {
    Switch,
    Card,
    CardBody,
    Button,
    Input,
    Select,
    SelectItem
} from "@nextui-org/react";
import { FolderCog, Users } from "lucide-react";
import ConaktivExportModal from "../components/modals/ConaktivExportModal";
import { exportAllData, exportEntriesCSV, exportEntriesConaktiv } from "../utils/exportData";
import { importAllData } from "../utils/importData";
import PageHeader from "../components/PageHeader";
import { useToast } from "../components/Toast";
import useICalCalendar from "../hooks/useICalCalendar";
import CalendarSuggestions from "../components/CalendarSuggestions";
import AccentColorPicker from "../components/AccentColorPicker";

// oben in SettingsPage.jsx (außerhalb der Komponente)
const TRACK_SELECTED = {
    indigo:
        "group-data-[selected=true]:!bg-indigo-600 group-data-[selected=true]:hover:!bg-indigo-500",
    emerald:
        "group-data-[selected=true]:!bg-emerald-600 group-data-[selected=true]:hover:!bg-emerald-500",
    violet:
        "group-data-[selected=true]:!bg-violet-600 group-data-[selected=true]:hover:!bg-violet-500",
    rose:
        "group-data-[selected=true]:!bg-rose-600 group-data-[selected=true]:hover:!bg-rose-500",
    orange:
        "group-data-[selected=true]:!bg-orange-600 group-data-[selected=true]:hover:!bg-orange-500",
    yellow:
        "group-data-[selected=true]:!bg-yellow-500 group-data-[selected=true]:hover:!bg-yellow-400",
    lime:
        "group-data-[selected=true]:!bg-lime-600 group-data-[selected=true]:hover:!bg-lime-500",
    sky:
        "group-data-[selected=true]:!bg-sky-600 group-data-[selected=true]:hover:!bg-sky-500",
    purple:
        "group-data-[selected=true]:!bg-purple-600 group-data-[selected=true]:hover:!bg-purple-500",
    fuchsia:
        "group-data-[selected=true]:!bg-fuchsia-600 group-data-[selected=true]:hover:!bg-fuchsia-500",
    slate:
        "group-data-[selected=true]:!bg-slate-600 group-data-[selected=true]:hover:!bg-slate-500",
};

export default function SettingsPage({ entries, onSettingsChange, onBack, onNavigate }) {
    const [settingsLoaded, setSettingsLoaded] = useState(false);
    const [settings, setSettings] = useState({
        showFavorites: true,
        manualMode: false,
        manualFavorites: [],
        customLabels: {},
        accentColor: "indigo",
        weeklyHours: 40,
        targetMonth: new Date().toLocaleString("de-DE", { month: "long" }),
    });

    const [showConaktivExport, setShowConaktivExport] = useState(false);

    const { showToast } = useToast();
    // 📆 Outlook Kalender State
    const [icalUrl, setIcalUrl] = useState(localStorage.getItem("ical.url") || "");
    const { events, loading, error } = useICalCalendar(icalUrl);

    useEffect(() => {
        localStorage.setItem("ical.url", icalUrl);
    }, [icalUrl]);

    // 🔹 Settings laden
    useEffect(() => {
        const stored = localStorage.getItem("trackcycle.settings");
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
        localStorage.setItem("trackcycle.settings", JSON.stringify(settings));
        onSettingsChange?.(settings);
    }, [settings, settingsLoaded]);

    const toggleSetting = (key) =>
        setSettings((prev) => ({ ...prev, [key]: !prev[key] }));

    // ✅ JSON Export mit Toast
    const handleExportAll = () => {
        try {
            exportAllData(entries, settings);
            showToast("Export abgeschlossen", "OK", null, 5000, "success");
        } catch (err) {
            showToast("Fehler beim Export", "OK", null, 5000, "error");
        }
    };

    // ✅ CSV Export mit Toast
    const handleExportCSV = () => {
        try {
            exportEntriesCSV(entries);
            showToast("CSV-Datei exportiert", "OK", null, 5000, "success");
        } catch (err) {
            showToast("Fehler beim CSV-Export", "OK", null, 5000, "error");
        }
    };

    // ✅ Import mit Toast
    const handleImport = (file) => {
        if (!file) return;
        try {
            importAllData(file, () => {
                showToast("Import erfolgreich 📥", "Neu laden", () => {
                    window.location.reload();
                }, 5000, "success");
            });
        } catch (err) {
            showToast("Fehler beim Import", "OK", null, 5000, "error");
        }
    };

    return (
        <div className="space-y-6 mt-6 pb-20 relative">
            <PageHeader onBack={onBack} title="Einstellungen" subtitle="" />
            <Card className="bg-slate-900/60 border border-slate-700 p-3">
                <CardBody>
                    <h2 className="text-lg font-semibold text-slate-100 mb-4">
                        Darstellung
                    </h2>
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <span className="text-slate-300 text-sm">
                                Rundung auf 15-Minuten-Blöcke
                            </span>
                            <Switch
                                size="sm"
                                color="default"
                                isSelected={settings.roundToQuarter}
                                classNames={{
                                    wrapper: `
                                        bg-slate-600
                                        ${TRACK_SELECTED[settings.accentColor || "indigo"]}
                                        `,
                                    thumb: "bg-white shadow-md",
                                    base: "bg-transparent",
                                }}
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
                                color="default"
                                isSelected={settings.showFavorites}
                                classNames={{
                                    wrapper: `
                                        bg-slate-600
                                        ${TRACK_SELECTED[settings.accentColor || "indigo"]}
                                        `,
                                    thumb: "bg-white shadow-md",
                                    base: "bg-transparent",
                                }}
                                onValueChange={() => {
                                    toggleSetting("showFavorites");
                                    showToast("Einstellung gespeichert", "OK", null, 3000, "success");
                                }}
                            />
                        </div>
                    </div>
                </CardBody>
            </Card>

            <Card className="bg-slate-900/60 border border-slate-700 p-3">
                <CardBody>
                    <h2 className="text-lg font-semibold text-slate-100 mb-4">
                        Arbeitstage
                    </h2>
                    <p className="text-slate-400 mb-4 text-xs">
                        Wähle aus, an welchen Tagen du normalerweise arbeitest. Nur diese Tage
                        werden in den Statistiken berücksichtigt.
                    </p>

                    <div className="grid grid-cols-7 gap-2">
                        {["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"].map((day, i) => {
                            const dayKey = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"][i];
                            const selected = settings.workdays?.includes(dayKey);

                            return (
                                <Button
                                    key={day}
                                    size="xs"
                                    variant={selected ? "solid" : "flat"}
                                    color={selected ? "indigo" : "default"}
                                    className={`text-xs min-w-10 min-h-8 h-8 ${selected ? `bg-${settings.accentColor}-600  text-white` : "bg-slate-800 text-slate-300"}`}
                                    onPress={() =>
                                        setSettings((prev) => {
                                            const workdays = new Set(prev.workdays || []);
                                            if (workdays.has(dayKey)) workdays.delete(dayKey);
                                            else workdays.add(dayKey);
                                            return { ...prev, workdays: Array.from(workdays) };
                                        })
                                    }
                                >
                                    {day}
                                </Button>
                            );
                        })}
                    </div>
                </CardBody>
            </Card>

            {/* 🕒 Wochenarbeitszeit & Monatsziel */}
            <Card className="bg-slate-900/60 border border-slate-700 p-3">
            <CardBody>
                <h2 className="text-lg font-semibold text-slate-100 mb-4">
                Arbeitszeit & Monatsziel
                </h2>

                <div className="space-y-5">
                {/* Wochenstunden */}
                <div className="flex justify-between items-center">
                    <span className="text-slate-300 text-sm">Wochenarbeitszeit (Stunden)</span>
                    <Input
                    type="number"
                    size="sm"
                    min={0}
                    max={80}
                    value={settings.weeklyHours ?? ""}
                    onChange={(e) => {
                        const val = Number(e.target.value);
                        setSettings((prev) => ({ ...prev, weeklyHours: val }));
                        showToast("Einstellung gespeichert", "OK", null, 3000, "success");
                    }}
                    className="max-w-xs ml-5 text-right"
                    />
                </div>

                {/* Monatsauswahl */}
                <div className="flex justify-between items-center">
                    <span className="text-slate-300 text-sm">Aktueller Zielmonat</span>
                    <Select
                        size="sm"
                        className="max-w-xs ml-5"
                        labelPlacement="outside"
                        selectedKeys={[settings.targetMonth]}
                        onChange={(e) => {
                            const newMonth = e.target.value;
                            setSettings((prev) => ({ ...prev, targetMonth: newMonth }));
                            showToast("Monat geändert", "OK", null, 3000, "success");
                        }}
                        >
                        {[
                            "Januar","Februar","März","April","Mai","Juni",
                            "Juli","August","September","Oktober","November","Dezember",
                        ].map((m) => (
                            <SelectItem key={m} value={m}>
                            {m}
                            </SelectItem>
                        ))}
                    </Select>
                </div>

                {/* Automatische Vorschau */}
                <div className="text-xs text-slate-400 mt-3">
                    Geschätztes Monatsziel:{" "}
                    <span className={`text-${settings.accentColor}-400 font-medium`}>
                    {(() => {
                        const year = new Date().getFullYear();
                        const monthIndex = [
                        "Januar","Februar","März","April","Mai","Juni",
                        "Juli","August","September","Oktober","November","Dezember",
                        ].indexOf(settings.targetMonth);
                        const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
                        const weeks = daysInMonth / 7;
                        const monthlyHours = Math.round((settings.weeklyHours || 0) * weeks);
                        return `${monthlyHours} Stunden`;
                    })()}
                    </span>
                </div>
                </div>
            </CardBody>
            </Card>

            <AccentColorPicker
                accentColor={settings.accentColor || "indigo"}
                onChange={(color) => {
                    const newSettings = { ...settings, accentColor: color };
                    setSettings(newSettings);
                    localStorage.setItem("trackcycle.settings", JSON.stringify(newSettings));
                    console.log(settings.accentColor)
                }}
            />

            <div className="space-y-6 mt-6 pb-24">                 
                {/* 📁 Projekte & Kunden */}
                <Card className="bg-slate-900/60 border border-slate-700 p-3">
                    <CardBody>
                        <h2 className="text-lg font-semibold text-slate-100 mb-4">
                            Projekte & Kunden
                        </h2>

                        <div className="flex flex-col divide-y divide-slate-800 mt-2">
                        {[
                            {
                            key: "settings-projects",
                            label: "Projekte bearbeiten",
                            icon: <FolderCog className="w-5 h-5 text-slate-400" />,
                            },
                            {
                            key: "settings-customers",
                            label: "Kunden bearbeiten",
                            icon: <Users className="w-5 h-5 text-slate-400" />,
                            },
                            {
                            key: "settings-favorites",
                            label: "Favoriten bearbeiten",
                            icon: <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="w-5 h-5 text-slate-400"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={1.5}
                                d="M11.48 3.5a.75.75 0 011.04 0l2.7 2.7 3.4.5a.75.75 0 01.41 1.28l-2.46 2.4.58 3.37a.75.75 0 01-1.09.79l-3.02-1.59-3.02 1.59a.75.75 0 01-1.09-.79l.58-3.37-2.46-2.4a.75.75 0 01.41-1.28l3.4-.5 2.7-2.7z"
                                />
                            </svg>,
                            },
                        ].map((item) => (
                            <button
                            key={item.key}
                            onClick={() => onNavigate?.(item.key)}
                            className={`group flex items-center justify-between py-3 px-3 text-left hover:bg-slate-800/70 transition-all rounded-xl`}
                            >
                            <div className="flex items-center gap-3">
                                {item.icon}
                                <span className="text-slate-200 text-sm font-medium">{item.label}</span>
                            </div>
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className={`w-5 h-5 text-slate-500 group-hover:text-${settings?.accentColor || "indigo"}-400 transition-colors`}
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                            </button>
                        ))}
                        </div>
                    </CardBody>
                </Card>

                {/* 💾 Datenverwaltung */}

                <Card className="bg-slate-900/60 border border-slate-700 p-3">
                    <CardBody>
                        <h2 className="text-lg font-semibold text-slate-100 mb-4">
                            Datenverwaltung
                        </h2>
                        <div className="flex flex-col sm:flex-row gap-3">
                            <Button className={`bg-${settings.accentColor}-600 hover:bg-${settings.accentColor}-500`} color="primary" onPress={handleExportAll}>
                                Exportieren (alles als JSON)
                            </Button>
                            <Button variant="flat" onPress={handleExportCSV}>
                                Nur Zeiteinträge (CSV)
                            </Button>
                            <Button
                                className={`bg-${settings.accentColor}-600 hover:bg-${settings.accentColor}-500`}
                                color="primary"
                                onPress={() => setShowConaktivExport(true)}   // 🟢 vorher: setIsOpen(true)
                            >
                                📤 Export for ConAktiv
                            </Button>

                            <label htmlFor="import-file" className="cursor-pointer">
                                <input
                                    id="import-file"
                                    type="file"
                                    accept=".json"
                                    className="hidden"
                                    onChange={(e) => handleImport(e.target.files?.[0])}
                                />
                                <Button fullWidth color="secondary" as="span" className={`bg-${settings.accentColor}-600 hover:bg-${settings.accentColor}-500`}>
                                    Importieren
                                </Button>
                            </label>
                        </div>
                    </CardBody>
                </Card>

                {/* 📆 Outlook Kalender (ICS-Feed) */}
                
                <Card className="bg-slate-900/60 border border-slate-700 p-3">
                    <CardBody>
                        <h2 className="text-lg font-semibold text-slate-100 mb-4">
                            Outlook Kalender
                        </h2>

                        <p className="text-xs text-slate-400 mb-4">
                            Füge deinen Outlook-ICS-Link hinzu, um heutige Termine anzuzeigen.
                        </p>

                        <div className="space-y-6">
                            <Input
                                label="ICS-Link"
                                placeholder="https://outlook.office365.com/owa/calendar/..."
                                value={icalUrl || ""}
                                onChange={(e) => setIcalUrl(e.target.value)}
                                size="sm"
                                variant="flat"
                            />

                            <Button color="primary" onPress={() => refetch()} className={`bg-${settings.accentColor}-600 hover:bg-${settings.accentColor}-500`}>
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
                        </div>
                    </CardBody>
                </Card>
                {/* 🔻 Modal separat als Component */}
                {showConaktivExport && (
                    <ConaktivExportModal isOpen={showConaktivExport} onClose={() => setShowConaktivExport(false)} />
                )}
            </div>
        </div>
    );
}