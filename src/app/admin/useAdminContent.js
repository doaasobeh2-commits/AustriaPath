import { useCallback, useEffect, useState } from "react";
import {
  getAdminItems,
  saveAdminItems,
  buildContentPayload,
  getContentStats,
} from "../../utils/adminContent.js";
import { approveAkademieEntries } from "../../content/contentExtractor.js";
import { mergeAkademieOnRegenerate } from "../../content/akademieFromExtraction.js";
import {
  mergeExtraction,
  approveSuggestion,
  rejectSuggestion,
  editSuggestion,
  approveAllPending,
  rejectAkademieEntry,
  EXTRACTION_FIELDS,
  normalizeSuggestions,
} from "../../content/extractionState.js";
import { createEmptyFormState, modelToFormState, toList } from "../../content/contentModelSchema.js";

const today = () => new Date().toISOString().split("T")[0];

function uniqueArray(arr) {
  return [...new Set(arr)];
}

function appendToFormField(current, text) {
  return uniqueArray([...toList(current), text]).join("\n");
}

function formListsFromForm(form) {
  const lists = {};
  EXTRACTION_FIELDS.forEach((field) => {
    lists[field] = toList(form[field]);
  });
  return lists;
}

export function useAdminContent() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(createEmptyFormState());

  const reload = useCallback(() => {
    setItems(getAdminItems());
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const persist = useCallback((next) => {
    const saved = saveAdminItems(next);
    setItems(saved);
    return saved;
  }, []);

  const updateForm = useCallback((patch) => {
    setForm((prev) => ({ ...prev, ...patch }));
  }, []);

  const resetForm = useCallback(() => {
    setForm(createEmptyFormState());
  }, []);

  const loadItem = useCallback((item) => {
    setForm(modelToFormState(item));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const saveItem = useCallback(
    ({ parentModel, keepEditing = true, forceStatus } = {}) => {
      if (!form.title.trim()) {
        alert("Bitte Titel eingeben.");
        return false;
      }
      if (form.modelMode === "existing" && !form.parentModelId) {
        alert("Bitte ein bestehendes Modell auswählen.");
        return false;
      }

      const formForSave = forceStatus ? { ...form, status: forceStatus } : form;
      const payload = buildContentPayload(formForSave, { parentModel });
      const currentDate = today();

      if (form.editingId) {
        const updated = items.map((item) =>
          item.id === form.editingId
            ? {
                ...item,
                ...payload,
                id: item.id,
                lastConfirmed: currentDate,
                updatedAt: new Date().toISOString(),
              }
            : item
        );
        persist(updated);
        if (keepEditing) {
          setForm((prev) => ({
            ...modelToFormState({ ...payload, id: prev.editingId }),
            editingId: prev.editingId,
          }));
          alert(
            forceStatus === "published"
              ? "Veröffentlicht. Inhalt erscheint in Akademie & Trainern."
              : "Gespeichert. Sie können weiter bearbeiten oder veröffentlichen."
          );
        } else {
          resetForm();
          alert("Änderungen gespeichert.");
        }
        return true;
      }

      const newId = Date.now();
      const newItem = {
        id: newId,
        ...payload,
        cities: form.city.trim() ? [form.city.trim()] : [],
        states: form.state.trim() ? [form.state.trim()] : [],
        examDates: form.examDate ? [form.examDate] : [],
        examCenters: form.examCenter.trim() ? [form.examCenter.trim()] : [],
        lastConfirmed: currentDate,
        createdAt: new Date().toISOString(),
        history: [{ date: currentDate, note: "created", content: form.content, solution: form.solution }],
      };

      persist([...items, newItem]);
      if (keepEditing) {
        setForm(modelToFormState(newItem));
        alert("Gespeichert. Prüfen Sie Extraktion, dann auf Published setzen.");
      } else {
        resetForm();
        alert("Gespeichert!");
      }
      return true;
    },
    [form, items, persist, resetForm]
  );

  const setItemStatus = useCallback(
    (id, status) => {
      const updated = items.map((item) =>
        item.id === id
          ? {
              ...item,
              status,
              published: status === "published",
              lastConfirmed: status === "published" ? today() : item.lastConfirmed,
            }
          : item
      );
      persist(updated);
    },
    [items, persist]
  );

  const deleteItem = useCallback(
    (id) => {
      if (!window.confirm("Diesen Eintrag wirklich löschen?")) return;
      persist(items.filter((item) => item.id !== id));
    },
    [items, persist]
  );

  const applyExtractionToForm = useCallback((extraction, mode = "merge") => {
    if (extraction.error) {
      alert(extraction.error);
      return;
    }

    setForm((prev) => {
      const mergedExtraction = mergeExtraction(prev.extraction, extraction, {
        mode,
        formLists: formListsFromForm(prev),
      });

      const nextPending = {};
      EXTRACTION_FIELDS.forEach((field) => {
        nextPending[field] = normalizeSuggestions(mergedExtraction.pending?.[field], field);
      });

      const akademieEntries =
        mode === "replace"
          ? mergeAkademieOnRegenerate([], extraction.akademieEntries || [])
          : mergeAkademieOnRegenerate(prev.akademieEntries || [], extraction.akademieEntries || []);

      const topicMerge =
        mode === "replace"
          ? (extraction.pending?.topicTags || []).join("\n")
          : uniqueArray([
              ...toList(prev.topicTags),
              ...normalizeSuggestions(extraction.pending?.topicTags, "topicTags").map((s) => s.text),
            ]).join("\n");

      return {
        ...prev,
        extraction: { ...mergedExtraction, pending: nextPending },
        akademieEntries,
        topicTags: topicMerge,
      };
    });
  }, []);

  const approveSuggestionItem = useCallback((field, suggestionId) => {
    setForm((prev) => {
      const { extraction, approvedText } = approveSuggestion(prev.extraction, field, suggestionId);
      if (!approvedText) return prev;
      return {
        ...prev,
        extraction,
        [field]: appendToFormField(prev[field], approvedText),
      };
    });
  }, []);

  const rejectSuggestionItem = useCallback((field, suggestionId) => {
    setForm((prev) => ({
      ...prev,
      extraction: rejectSuggestion(prev.extraction, field, suggestionId),
    }));
  }, []);

  const editSuggestionItem = useCallback((field, suggestionId, newText) => {
    setForm((prev) => ({
      ...prev,
      extraction: editSuggestion(prev.extraction, field, suggestionId, newText),
    }));
  }, []);

  const approveAllFields = useCallback(() => {
    setForm((prev) => {
      let extraction = approveAllPending(prev.extraction);
      const patch = { extraction };
      EXTRACTION_FIELDS.forEach((field) => {
        const approved = extraction.approved?.[field] || [];
        if (approved.length) {
          patch[field] = uniqueArray([...toList(prev[field]), ...approved]).join("\n");
        }
      });
      return { ...prev, ...patch };
    });
  }, []);

  const approveAkademie = useCallback((ids) => {
    setForm((prev) => ({
      ...prev,
      akademieEntries: approveAkademieEntries(prev.akademieEntries || [], ids),
    }));
  }, []);

  const rejectAkademie = useCallback((id) => {
    setForm((prev) => ({
      ...prev,
      akademieEntries: rejectAkademieEntry(prev.akademieEntries || [], id),
    }));
  }, []);

  const updateAkademieEntry = useCallback((id, patch) => {
    setForm((prev) => ({
      ...prev,
      akademieEntries: (prev.akademieEntries || []).map((e) =>
        e.id === id ? { ...e, ...patch } : e
      ),
    }));
  }, []);

  const exportJson = useCallback(() => {
    navigator.clipboard.writeText(JSON.stringify(items, null, 2));
    alert("JSON wurde kopiert.");
  }, [items]);

  const clearAll = useCallback(() => {
    if (!window.confirm("Alle Admin-Daten löschen? Nur für Tests.")) return;
    localStorage.removeItem("austriaPathAdminData");
    setItems([]);
  }, []);

  const stats = getContentStats(items);

  return {
    items,
    form,
    stats,
    updateForm,
    resetForm,
    loadItem,
    saveItem,
    setItemStatus,
    deleteItem,
    applyExtractionToForm,
    approveSuggestionItem,
    rejectSuggestionItem,
    editSuggestionItem,
    approveAllFields,
    approveAkademie,
    rejectAkademie,
    updateAkademieEntry,
    exportJson,
    clearAll,
    reload,
  };
}
