import React, { useContext } from "react";
import {
  Autocomplete,
  AutocompleteItem,
  AutocompleteSection,
} from "@nextui-org/react";
import { ProjectContext } from "../context/ProjectContext";
import { CustomerContext } from "../context/CustomerContext";

export default function ProjectSelector({ value, onChange }) {
  const { projects } = useContext(ProjectContext);
  const { customers } = useContext(CustomerContext);

  // Projekte nach Kunden gruppieren
  const grouped = customers.map((cust) => ({
    customer: cust.name,
    projects: projects.filter((p) => p.client === cust.name),
  }));

  return (
    <Autocomplete
      label="Projekt auswählen"
      placeholder="Projekt oder Kunde suchen…"
      selectedKey={value}
      onSelectionChange={onChange}
      className="w-full"
    >
      {grouped.map(
        (group) =>
          group.projects.length > 0 && (
            <AutocompleteSection key={group.customer} title={group.customer}>
              {group.projects.map((p) => (
                <AutocompleteItem
                  key={p.id}
                  // macht die Suche auch über Kunde & ID möglich
                  textValue={`${p.name} ${p.client} ${p.id}`}
                >
                  <div className="flex flex-col">
                    <span>{p.name}</span>
                    <span className="text-xs text-gray-500">{p.id}</span>
                  </div>
                </AutocompleteItem>
              ))}
            </AutocompleteSection>
          )
      )}
    </Autocomplete>
  );
}