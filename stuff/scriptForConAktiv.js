const entries = [
{
    "date": "17.10.2025",
    "hours": "3,00",
    "customer": "Commerzbank AG",
    "project": "Com.4534",
    "activity": "Tech. Projektmanager FeLe",
    "description": "Coba Schulung"
  },
  {
    "date": "17.10.2025",
    "hours": "0,50",
    "customer": "Commerzbank AG",
    "project": "Com.4534",
    "activity": "Unbekannt",
    "description": "Coba E-Mail-Support"
  },
  {
    "date": "17.10.2025",
    "hours": "0,25",
    "customer": "Commerzbank AG",
    "project": "Com.4534",
    "activity": "Tech. Projektmanager FeLe",
    "description": "QA Coba"
  },
  {
    "date": "17.10.2025",
    "hours": "0,50",
    "customer": "Salient GmbH",
    "project": "sal.3465",
    "activity": "Bewerbungen, Personalbespr., Meetings, S&S",
    "description": "Jira"
  },
  {
    "date": "17.10.2025",
    "hours": "1,00",
    "customer": "Salient GmbH",
    "project": "sal.3465",
    "activity": "Bewerbungen, Personalbespr., Meetings, S&S",
    "description": "E-Mails"
  },
  {
    "date": "17.10.2025",
    "hours": "0,50",
    "customer": "Salient GmbH",
    "project": "sal.3465",
    "activity": "Bewerbungen, Personalbespr., Meetings, S&S",
    "description": "Todo/Status Check"
  },
  {
    "date": "17.10.2025",
    "hours": "0,25",
    "customer": "Salient GmbH",
    "project": "sal.3465",
    "activity": "Bewerbungen, Personalbespr., Meetings, S&S",
    "description": "Interne Besprechung mit Rene"
  },
  {
    "date": "17.10.2025",
    "hours": "0,25",
    "customer": "Landesbank Baden-Württemberg",
    "project": "LBBW.1025",
    "activity": "Tech. Projektmanager FeLe",
    "description": "Organisatorisches (Authada-Entfernung)"
  },
  {
    "date": "17.10.2025",
    "hours": "0,25",
    "customer": "Commerzbank AG",
    "project": "Com.4534",
    "activity": "Tech. Projektmanager FeLe",
    "description": "QA Coba (Auswahlfelder)"
  },
  {
    "date": "17.10.2025",
    "hours": "0,25",
    "customer": "Salient GmbH",
    "project": "sal.3465",
    "activity": "Bewerbungen, Personalbespr., Meetings, S&S",
    "description": "Organisatorisches (Openforms)"
  },
  {
    "date": "17.10.2025",
    "hours": "0,50",
    "customer": "Salient GmbH",
    "project": "sal.3465",
    "activity": "Bewerbungen, Personalbespr., Meetings, S&S",
    "description": "Administration"
  },
  {
    "date": "17.10.2025",
    "hours": "0,50",
    "customer": "Salient GmbH",
    "project": "sal.3465",
    "activity": "Bewerbungen, Personalbespr., Meetings, S&S",
    "description": "PM-Meeting"
  },
  {
    "date": "17.10.2025",
    "hours": "1,00",
    "customer": "Salient GmbH",
    "project": "sal.3465",
    "activity": "Bewerbungen, Personalbespr., Meetings, S&S",
    "description": "Interne Besprechung Entwicklung"
  },
  {
    "date": "17.10.2025",
    "hours": "0,50",
    "customer": "Salient GmbH",
    "project": "sal.3465",
    "activity": "Bewerbungen, Personalbespr., Meetings, S&S",
    "description": "Daily Huddle"
  }
];

// 🧩 Eingabe-Helfer (simuliert echtes Tippen)
async function typeLikeHuman(el, text, delay = 80) {
    el.focus();
    el.value = "";
    for (const char of text) {
        el.value += char;
        el.dispatchEvent(new Event("input", { bubbles: true }));
        await new Promise(r => setTimeout(r, delay));
    }
    el.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    el.dispatchEvent(new Event("blur", { bubbles: true }));
    await new Promise(r => setTimeout(r, 400)); // etwas länger, um Re-Render abzuwarten
}

// 🕒 Wartefunktion
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

// 🧠 Hauptfunktion
async function fillEntry(entry, index) {
    console.log(`➡️ [${index + 1}/${entries.length}] Buche:`, entry);

    let newBtn = document.querySelector('a[au-target-id="968"]');
    if (newBtn && newBtn.offsetParent !== null) {
        console.log("➕ Neues Formular öffnen...");

        newBtn.click();
        await wait(100); // kleines Delay für interne Verarbeitung

        // 🔁 Warte bis das neue Formular geladen ist
        let retries = 0;
        while (retries < 5) {
            let freshDateField = document.querySelector('input[name*="KA_Endetag"]');
            if (freshDateField) {
                console.log("🆕 Neues Formular erkannt – bereit zum Befüllen.");
                break;
            }
            await wait(100);
            retries++;
        }
    } else {
        console.warn("❌ '+'-Button nicht gefunden oder nicht sichtbar!");
    }
    

    /* 👤 Kunde zuerst (kommt automatisch wenn projekt gewählt wird)
    const customerField = document.querySelectorAll('input[au-target-id="855"]')[0];
    if (customerField) {
        console.log("🔍 Kunde:", entry.customer);
        await typeLikeHuman(customerField, entry.customer);
    } else {
        console.warn("❌ Kundenfeld nicht gefunden");
    }
    */
    // Warten, bis Formular refresh fertig ist
    await wait(2000);

    // 📁 Projekt danach
    const projectField = document.querySelectorAll('input[au-target-id="855"]')[1];
    if (projectField) {
        console.log("📁 Projekt:", entry.project);
        await typeLikeHuman(projectField, entry.project);
    } else {
        console.warn("❌ Projektfeld nicht gefunden");
    }

    await wait(2000);

    // 📁 Tätigkeit danach
    const activityField = document.querySelectorAll('input[au-target-id="855"]')[2];
    if (activityField) {
        console.log("📁 Projekt:", entry.activity);
        await typeLikeHuman(activityField, entry.activity);
    } else {
        console.warn("❌ Tätigkeitsfeld nicht gefunden");
    }

    // Jetzt die restlichen Felder (nachdem Re-Init fertig ist)
    await wait(3000);

    // 🗓️ Arbeitstag
    const dateField = document.querySelector('input[name*="KA_Endetag"]');
    if (dateField) {
        await typeLikeHuman(dateField, entry.date);
    } else {
        console.warn("❌ Arbeitstag nicht gefunden");
    }

    await wait(1000);

    // ⏱️ Anzahl
    const hoursField = document.querySelector('input[name*="KA_Anzahl"]');
    if (hoursField) {
        await typeLikeHuman(hoursField, entry.hours);
    } else {
        console.warn("❌ Anzahl nicht gefunden");
    }
    await wait(100);

    // 📝 Beschreibung
    const descField = document.querySelector('textarea[name*="KA_Beschreibung"]');
    if (descField) {
        await typeLikeHuman(descField, entry.description);
    } else {
        console.warn("❌ Anzahl nicht gefunden");
    }

    await wait(100);

    // 💾 Speichern & Schließen
    const saveBtn = Array.from(document.querySelectorAll('a.button'))
        .find((btn) => btn.textContent.includes("Speichern und Schließen"));
    if (saveBtn) {
        console.log("💾 Speichere Eintrag...");
        saveBtn.click();
    } else {
        console.warn("❌ Kein 'Speichern und Schließen'-Button gefunden!");
    }

    // ⏳ Warte auf Speichern
    await wait(1500);

}

// 🚀 Alle nacheinander
(async () => {
    console.log("🚀 Starte automatischen ConAktiv-Zeiteintrag...");
    for (let i = 0; i < entries.length; i++) {
        await fillEntry(entries[i], i);
    }
    console.log("✅ Alle Einträge erfolgreich eingetragen!");
})();