import React from "react";
import { Button } from "@nextui-org/react";
import { Calendar, Play } from "lucide-react";

export default function CalendarSuggestions({ events, onImport }) {
  if (!events?.length)
    return (
      <div className="text-slate-500 text-sm italic">
        Keine Termine gefunden.
      </div>
    );

  // Nur heutige Events
  const today = new Date().toDateString();
  const todaysEvents = events.filter(
    (ev) => new Date(ev.start).toDateString() === today
  );

  return (
    <div className="space-y-2">
      {todaysEvents.map((ev) => (
        <div
          key={ev.id}
          className="flex justify-between items-center bg-slate-800/40 rounded-lg p-3 border border-slate-700 hover:border-slate-600 transition"
        >
          <div>
            <div className="font-medium text-slate-200 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-400" />
              {ev.title || "(Ohne Titel)"}
            </div>
            <div className="text-xs text-slate-400">
              {new Date(ev.start).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}{" "}
              –{" "}
              {new Date(ev.end).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
              {ev.location && ` • ${ev.location}`}
            </div>
          </div>
          <Button
            size="sm"
            color="primary"
            variant="flat"
            startContent={<Play className="w-4 h-4" />}
            onPress={() => onImport(ev)}
          >
            Übernehmen
          </Button>
        </div>
      ))}
    </div>
  );
}