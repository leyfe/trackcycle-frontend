import React, { createContext, useState, useEffect } from "react";
import { useToast } from "../components/Toast";

export const CustomerContext = createContext();

export const CustomerProvider = ({ children }) => {
    const [customers, setCustomers] = useState(() => {
    return (
      JSON.parse(localStorage.getItem("timetracko.customers")) || [
        {
          id: "C-0001",
          name: "Salient Doremus",
          description: "Agentur für Markenkommunikation",
        },
      ]
    );
  });
  
  const { showToast } = useToast();

  useEffect(() => {
    localStorage.setItem("timetracko.customers", JSON.stringify(customers));
  }, [customers]);

  const addCustomer = (id, name) => {
    if (customers.some((c) => c.id === id)) {
      alert("Ein Kunde mit dieser ID existiert bereits.");
      return;
    }
    setCustomers([...customers, { id, name }]);
  };

  const editCustomer = (id, newName) => {
    setCustomers(customers.map((c) => (c.id === id ? { ...c, name: newName } : c)));
  };

  const deleteCustomer = (id) => {
    setCustomers(customers.filter((c) => c.id !== id));
    showToast(
      "Kunde gelöscht",
      "Rückgängig",
      () => {
        const restored = [deletedEntry, ...updatedEntries];
        setEntries(restored);
        localStorage.setItem("timetracko.entries", JSON.stringify(restored));
      },
      5000
    );
  };

  return (
    <CustomerContext.Provider value={{ customers, addCustomer, editCustomer, deleteCustomer }}>
      {children}
    </CustomerContext.Provider>
  );
};