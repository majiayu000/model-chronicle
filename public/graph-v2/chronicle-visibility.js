// This preference is local to this browser and never enters the route or dataset.
(function () {
  const MC = window.MC;
  const key = "model-chronicle.hidden-models.v1";
  const normalize = (value) =>
    Array.isArray(value)
      ? [
          ...new Set(
            value.filter(
              (id) => typeof id === "string" && Object.hasOwn(MC.byId, id),
            ),
          ),
        ].sort()
      : [];
  function load(storage) {
    try {
      const raw = storage.getItem(key);
      if (!raw) return { ids: [], persistent: true };
      const parsed = JSON.parse(raw);
      return {
        ids: normalize(parsed?.version === 1 ? parsed.ids : []),
        persistent: true,
      };
    } catch {
      return { ids: [], persistent: false };
    }
  }
  function save(storage, ids) {
    try {
      storage.setItem(key, JSON.stringify({ version: 1, ids: normalize(ids) }));
      return true;
    } catch {
      return false;
    }
  }
  function hide(current, targets) {
    const ids = normalize(current),
      added = normalize(targets).filter((id) => !ids.includes(id));
    return { ids: normalize([...ids, ...added]), added };
  }
  function restore(current, targets) {
    const selected = new Set(normalize(targets));
    return normalize(current).filter((id) => !selected.has(id));
  }
  MC.visibility = { key, normalize, load, save, hide, restore };
})();
