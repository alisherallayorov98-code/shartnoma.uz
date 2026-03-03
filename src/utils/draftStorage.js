const STORAGE_KEY = "shartnoma_drafts";

export function getDrafts() {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
}

export function saveDraft(draft) {
  const drafts = getDrafts();
  const newDraft = {
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
    ...draft,
  };
  drafts.unshift(newDraft);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(drafts));
  return newDraft;
}

export function deleteDraft(id) {
  const drafts = getDrafts().filter(d => d.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(drafts));
}

export function updateDraft(id, updatedData) {
  const drafts = getDrafts().map(d =>
    d.id === id ? { ...d, ...updatedData } : d
  );
  localStorage.setItem(STORAGE_KEY, JSON.stringify(drafts));
}
