const splitFilterValues = (value) =>
  (value || '').split(',').map(item => item.trim()).filter(Boolean);

const getFilterState = (container) => {
  const state = {};
  container.querySelectorAll('[data-custom-filter-form]').forEach(form => {
    const param = form.dataset.customFilterParam;
    if (!param) return;
    const hiddenInput = form.querySelector('[data-custom-filter-input]');
    if (hiddenInput) state[param] = splitFilterValues(hiddenInput.value);
    else {
      const checkedRadio = form.querySelector('input[type="radio"]:checked');
      state[param] = checkedRadio ? [checkedRadio.value] : [];
    }
  });
  return state;
};

const setFilterState = (container, state) => {
  container.querySelectorAll('[data-custom-filter-form]').forEach(form => {
    const param = form.dataset.customFilterParam;
    if (!param) return;

    const selectedValues = new Set(state[param] || []);
    const triggers = form.querySelectorAll(`[data-custom-filter-trigger][data-param="${CSS.escape(param)}"]`);
    triggers.forEach(trigger => {
      const value = trigger.dataset.value;
      const isActive = selectedValues.has(value);
      const isRadio = trigger.matches('input[type="radio"]');
      if (isRadio) {
        trigger.checked = isActive;
        const wrapper = trigger.closest('.radio-filter-option');
        if (wrapper) wrapper.classList.toggle('active', isActive);
      } else {
        trigger.classList.toggle('active', isActive);
      }
    });

    const hiddenInput = form.querySelector('[data-custom-filter-input]');
    if (hiddenInput) hiddenInput.value = Array.from(selectedValues).join(',');
  });
};

const buildSearchParamsFromState = (state) => {
  const params = new URLSearchParams();
  Object.entries(state).forEach(([param, values]) => {
    if (values.length) params.set(param, values.join(','));
  });
  return params;
};

const renderUpdatedCollection = async (url) => {
  const res = await fetch(url, { headers: { 'X-Requested-With': 'XMLHttpRequest' } });
  if (!res.ok) throw new Error('Unable to update filters');
  const html = await res.text();
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const newGrid = doc.querySelector('#ProductGridContainer');
  const currentGrid = document.querySelector('#ProductGridContainer');
  if (newGrid && currentGrid) currentGrid.innerHTML = newGrid.innerHTML;
};

const applyAllFilters = async (state) => {
  const params = buildSearchParamsFromState(state);
  const url = `${window.location.pathname}?${params.toString()}`;
  try {
    await renderUpdatedCollection(url);
    window.history.replaceState({}, '', url);
  } catch {
    window.location.href = url;
  }
};

document.addEventListener('DOMContentLoaded', () => {
  const container = document.querySelector('[data-custom-filters-container]');
  if (!container) return;

  // Initialize state
  const state = getFilterState(container);
  setFilterState(container, state);

  // Button clicks
  container.addEventListener('click', async (event) => {
    const trigger = event.target.closest('[data-custom-filter-trigger]');
    if (!trigger || trigger.matches('input[type="radio"]')) return;
    event.preventDefault();

    const { param, value } = trigger.dataset;
    if (!param || !value) return;

    const currentValues = new Set(state[param] || []);
    if (currentValues.has(value)) currentValues.delete(value);
    else currentValues.add(value);
    state[param] = Array.from(currentValues);

    setFilterState(container, state);
    await applyAllFilters(state);
  });

  // Radio changes
  container.addEventListener('change', async (event) => {
    const trigger = event.target.closest('input[type="radio"][data-custom-filter-trigger]');
    if (!trigger) return;

    const { param, value } = trigger.dataset;
    if (!param) return;

    state[param] = value ? [value] : [];
    setFilterState(container, state);
    await applyAllFilters(state);
  });
});
