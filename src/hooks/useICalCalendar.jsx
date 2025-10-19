import { useEffect, useState } from "react";
import ICAL from "ical.js";

/**
 * Holt und parsed einen Outlook/ICS-Kalender-Link (.ics)
 */
export default function useICalCalendar(icalUrl) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!icalUrl) return;
    setLoading(true);

    fetch(icalUrl)
      .then((res) => res.text())
      .then((data) => {
        const jcalData = ICAL.parse(data);
        const comp = new ICAL.Component(jcalData);
        const vevents = comp.getAllSubcomponents("vevent");

        const parsed = vevents.map((ve) => {
          const ev = new ICAL.Event(ve);
          return {
            id: ev.uid,
            title: ev.summary,
            start: ev.startDate.toJSDate(),
            end: ev.endDate.toJSDate(),
            location: ev.location,
          };
        });

        setEvents(parsed);
        setError(null);
      })
      .catch((err) => {
        console.error("Fehler beim Laden der ICS-Datei:", err);
        setError(err.message);
      })
      .finally(() => setLoading(false));
  }, [icalUrl]);

  return { events, loading, error };
}