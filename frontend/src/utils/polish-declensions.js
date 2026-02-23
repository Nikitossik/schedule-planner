import { useTranslation } from "react-i18next";


export function usePolishDeclensions() {
  const { t, i18n } = useTranslation();

  const getDeleteConfirmMessage = (entityType, customMessage) => {
    if (customMessage) return customMessage;
    
    if (i18n.language === "pl" && entityType) {
      const accusative = t(`common.entities.${entityType}.accusative`, { defaultValue: "" });
      if (accusative) {
        return t("datatable.confirmDelete", { item_accusative: accusative });
      }
    }
    
    return t("common.confirmDialog.defaultMessage");
  };

 
  const getDeleteSuccessMessage = (entityType) => {
    if (!entityType) {
      return t("datatable.deleteSuccess", { item: "Element" });
    }
    

    const nominativeKey = `common.entities.${entityType}.nominative`;
    const deletedKey = `common.entities.${entityType}.deleted`;
    
  
    const nominative = t(nominativeKey, { defaultValue: null });
    const deletedForm = t(deletedKey, { defaultValue: null });
    
    if (nominative && deletedForm && nominative !== nominativeKey && deletedForm !== deletedKey) {
    
      return `${nominative} ${deletedForm}`;
    } else {
      
      const fallbackNominative = entityType.charAt(0).toUpperCase() + entityType.slice(1).replace(/_/g, ' ');
      const fallbackDeleted = i18n.language === "pl" ? "usunięty" : "deleted";
      return `${fallbackNominative} ${fallbackDeleted}`;
    }
  };


  const getDeleteManySuccessMessage = (entityType, count) => {
    if (i18n.language === "pl" && entityType) {
      const accusativePlural = getPolishPluralForm(entityType, count);
      return t("datatable.deleteManySuccess", { 
        count,
        items_accusative: accusativePlural
      });
    }
    
    return t("datatable.deleteManySuccess", { count, items: entityType || "elements" });
  };

  const getPolishPluralForm = (entityType, count) => {

    const pluralForms = {
      group: count === 1 ? "grupę" : count < 5 ? "grupy" : "grup",
      user: count === 1 ? "użytkownika" : count < 5 ? "użytkowników" : "użytkowników",
      lesson: "zajęcia", // zawsze "zajęcia" 
      professor: count === 1 ? "prowadzącego" : count < 5 ? "prowadzących" : "prowadzących",
      room: count === 1 ? "salę" : count < 5 ? "sale" : "sal",
      subject: count === 1 ? "przedmiot" : count < 5 ? "przedmioty" : "przedmiotów",
      assignment: count === 1 ? "przypisanie" : count < 5 ? "przypisania" : "przypisań",
      schedule: count === 1 ? "harmonogram" : count < 5 ? "harmonogramy" : "harmonogramów",
      semester: count === 1 ? "semestr" : count < 5 ? "semestry" : "semestrów",
      academicYear: count === 1 ? "rok akademicki" : count < 5 ? "lata akademickie" : "lat akademickich",
      faculty: count === 1 ? "wydział" : count < 5 ? "wydziały" : "wydziałów",
      direction: count === 1 ? "kierunek" : count < 5 ? "kierunki" : "kierunków",
      studyForm: count === 1 ? "formę studiów" : count < 5 ? "formy studiów" : "form studiów",
      holiday: count === 1 ? "dzień wolny" : count < 5 ? "dni wolne" : "dni wolnych",
      contract: count === 1 ? "kontrakt" : count < 5 ? "kontrakty" : "kontraktów",
      workload: count === 1 ? "obciążenie" : count < 5 ? "obciążenia" : "obciążeń",
      template: count === 1 ? "szablon" : count < 5 ? "szablony" : "szablonów"
    };

    return pluralForms[entityType] || `${count} elementów`;
  };

  return {
    getDeleteConfirmMessage,
    getDeleteSuccessMessage,
    getDeleteManySuccessMessage,
    getPolishPluralForm
  };
}