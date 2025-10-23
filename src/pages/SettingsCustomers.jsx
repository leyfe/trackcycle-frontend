import React, { useState, useEffect } from "react";
import { Button, Input, Card, CardBody } from "@nextui-org/react";
import { Plus, Save, Trash2, ChevronDown, ChevronRight } from "lucide-react";
import PageHeader from "../components/PageHeader";

export default function SettingsCustomers({ onBack, settings }) {
  const [customers, setCustomers] = useState([]);
  const [expandedCustomers, setExpandedCustomers] = useState([]);

  // 🔹 Laden + stabile tempKeys hinzufügen
  useEffect(() => {
    const storedCustomers = JSON.parse(localStorage.getItem("timetracko.customers") || "[]");
    const customersWithKeys = storedCustomers.map(c => ({
      ...c,
      tempKey: c.tempKey || crypto.randomUUID(), // ✅ stabiler UI-Key
    }));
    setCustomers(customersWithKeys);
  }, []);

  const saveToLocalStorage = (data) => {
    localStorage.setItem("timetracko.customers", JSON.stringify(data));
  };

  const handleSaveAll = () => {
    // ✅ tempKeys vor dem Speichern entfernen
    const cleanCustomers = customers.map(({ tempKey, ...rest }) => rest);
    saveToLocalStorage(cleanCustomers);
    onBack?.();
  };

  const handleSaveCustomer = (tempKey) => {
    const cleanCustomers = customers.map(({ tempKey, ...rest }) => rest);
    saveToLocalStorage(cleanCustomers);
    setExpandedCustomers((prev) => prev.filter((cid) => cid !== tempKey));
  };

  const handleAddCustomer = () => {
    const newCustomer = {
      tempKey: crypto.randomUUID(),
      id: "",
      name: "",
    };
    setCustomers((prev) => [...prev, newCustomer]);
    setExpandedCustomers((prev) => [...prev, newCustomer.tempKey]);
  };

  const handleDeleteCustomer = (tempKey) => {
    const confirmDelete = window.confirm("Möchtest du diesen Kunden wirklich löschen?");
    if (!confirmDelete) return;
    const updated = customers.filter((c) => c.tempKey !== tempKey);
    setCustomers(updated);
    setExpandedCustomers((prev) => prev.filter((cid) => cid !== tempKey));
    saveToLocalStorage(updated.map(({ tempKey, ...rest }) => rest));
  };

  const toggleExpand = (tempKey) => {
    setExpandedCustomers((prev) =>
      prev.includes(tempKey)
        ? prev.filter((cid) => cid !== tempKey)
        : [...prev, tempKey]
    );
  };

  return (
    <div className="space-y-6 mt-6 pb-20">
      <PageHeader title="Kunden verwalten" onBack={onBack} />

      {customers.map((c) => {
        const expanded = expandedCustomers.includes(c.tempKey);
        return (
          <Card
            key={c.tempKey} // ✅ stabiler Key bleibt immer gleich
            className="bg-slate-900/70 border border-slate-700 shadow-lg overflow-hidden transition-all"
          >
            <CardBody className="space-y-3">
              {/* 🔹 Header-Zeile */}
              <div
                className="flex items-center justify-between cursor-pointer"
                onClick={() => toggleExpand(c.tempKey)}
              >
                <div>
                  <div className="text-slate-100 font-medium">
                    {c.name || "Unbenannter Kunde"}
                  </div>
                  <div className="text-xs text-slate-400">
                    ID: {c.id || "—"}
                  </div>
                </div>

                <Button
                  isIconOnly
                  size="sm"
                  variant="flat"
                  color="default"
                  onPress={(e) => {
                    e.stopPropagation();
                    toggleExpand(c.tempKey);
                  }}
                >
                  {expanded ? (
                    <ChevronDown className="w-4 h-4 text-slate-300" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-slate-300" />
                  )}
                </Button>
              </div>

              {/* 🔻 Expanded Content */}
              {expanded && (
                <div className="border-t border-slate-700 mt-3 pt-3 space-y-3 animate-fadeIn">
                  <Input
                    label="Kundenname"
                    value={c.name}
                    onChange={(e) =>
                      setCustomers((prev) =>
                        prev.map((cust) =>
                          cust.tempKey === c.tempKey
                            ? { ...cust, name: e.target.value }
                            : cust
                        )
                      )
                    }
                  />

                  <Input
                    label="Kunden-ID"
                    value={c.id || ""}
                    onChange={(e) =>
                      setCustomers((prev) =>
                        prev.map((cust) =>
                          cust.tempKey === c.tempKey
                            ? { ...cust, id: e.target.value }
                            : cust
                        )
                      )
                    }
                  />

                  {/* 💾 Save + 🗑 Delete Buttons */}
                  <div className="flex justify-end gap-2 pt-4 border-t border-slate-700 mt-4">
                    <Button
                      size="sm"
                      className={`bg-${settings?.accentColor || "indigo"}-600 hover:bg-${settings?.accentColor || "indigo"}-500 text-white`}
                      onPress={() => handleSaveCustomer(c.tempKey)}
                    >
                      <Save className="w-4 h-4 mr-1" /> Speichern
                    </Button>
                    <Button
                      color="danger"
                      size="sm"
                      variant="flat"
                      onPress={() => handleDeleteCustomer(c.tempKey)}
                    >
                      <Trash2 className="w-4 h-4 mr-1" /> Löschen
                    </Button>
                  </div>
                </div>
              )}
            </CardBody>
          </Card>
        );
      })}

      {/* ➕ Neuer Kunde + Alle speichern */}
      <div className="flex gap-2 pt-4">
        <Button
          className={`bg-${settings?.accentColor || "indigo"}-600 hover:bg-${settings?.accentColor || "indigo"}-500 text-white`}
          onPress={handleAddCustomer}
        >
          <Plus className="w-4 h-4 mr-1" /> Neuer Kunde
        </Button>
        <Button
          className={`bg-${settings?.accentColor || "indigo"}-600 hover:bg-${settings?.accentColor || "indigo"}-500 text-white`}
          onPress={handleSaveAll}
        >
          <Save className="w-4 h-4 mr-1" /> Alle speichern
        </Button>
      </div>
    </div>
  );
}