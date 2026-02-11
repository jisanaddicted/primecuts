// Helper: split comma values safely
const splitFilterValues = (value) => {
  if (!value) return [];
  return value.split(',').map(v => v.trim()).filter(Boolean);
};

// Update active UI state
const updateCustomFilterState = (container, param, value) => {
  const selectedValues = new Set(splitFilterValues(value));

  const triggers = container.querySelectorAll(
    `[data-custom-filter-trigger][data-param="${CSS.escape(param)}"]`
  );

  triggers.forEach(trigger => {
    const triggerValue = trigger.dataset.value;
    const isActive = selectedValues.has(triggerValue);
    const isRadio = trigger.matches('input[type="radio"]');

    if (isRadio) {
      trigger.checked = isActive;
      const wrapper = trigger.closest('.radio-filter-option');
      if (wrapper) wrapper.classList.toggle('active', isActive);
    } else {
      trigger.classList.toggle('active', isActive);
    }
  });

  const hiddenInput = container.querySelector(
    `[data-custom-filter-form][data-custom-filter-param="${CSS.escape(param)}"] [data-custom-filter-input]`
  );

  if (hiddenInput) {
    hiddenInput.value = Array.from(selectedValues).join(',');
  }
};

// Render updated collection grid
const renderUpdatedCollection = async (url) => {
  const response = await fetch(url, {
    headers: { 'X-Requested-With': 'XMLHttpRequest' }
  });

  if (!response.ok) throw new Error('Failed to fetch collection');

  const htmlText = await response.text();
  const parser = new DOMParser();
  const nextDocument = parser.parseFromString(htmlText, 'text/html');

  const nextGrid = nextDocument.querySelector('#ProductGridContainer');
  const currentGrid = document.querySelector('#ProductGridContainer');

  if (nextGrid && currentGrid) {
    currentGrid.innerHTML = nextGrid.innerHTML;
  }
};

// Apply all filters (MERGE LOGIC FIXED HERE)
const applyAllFilters = async (container) => {
  const params = new URLSearchParams(window.location.search);
  const forms = container.querySelectorAll('[data-custom-filter-form]');

  forms.forEach(form => {
    const param = form.dataset.customFilterParam;
    if (!param) return;

    params.delete(param);

    const hiddenInput = form.querySelector('[data-custom-filter-input]');
    if (hiddenInput) {
      const values = splitFilterValues(hiddenInput.value);
      if (values.length) {
        params.set(param, values.join(','));
      }
      return;
    }

    const checkedRadio = form.querySelector('input[type="radio"]:checked');
    if (checkedRadio) {
      params.set(param, checkedRadio.value);
    }
  });

  const queryString = params.toString();
  const nextUrl = `${window.location.pathname}${queryString ? `?${queryString}` : ''}`;

  try {
    await renderUpdatedCollection(nextUrl);
    window.history.replaceState({}, '', nextUrl);
  } catch {
    window.location.href = nextUrl;
  }
};

document.addEventListener('DOMContentLoaded', () => {
  const filtersContainer = document.querySelector('[data-custom-filters-container]');
  if (!filtersContainer) return;

  // Initialize state from URL
  const urlParams = new URLSearchParams(window.location.search);

  const forms = filtersContainer.querySelectorAll('[data-custom-filter-form]');
  forms.forEach(form => {
    const param = form.dataset.customFilterParam;
    if (!param) return;

    const hiddenInput = form.querySelector('[data-custom-filter-input]');
    if (hiddenInput) {
      const queryValue = urlParams.get(param) || '';
      updateCustomFilterState(filtersContainer, param, queryValue);
    }

    const checkedRadio = form.querySelector('input[type="radio"]:checked');
    if (checkedRadio) {
      updateCustomFilterState(filtersContainer, param, checkedRadio.value);
    }
  });

  // Dropdown toggle
  filtersContainer.addEventListener('click', async (event) => {
    const header = event.target.closest('.div-block-2');
    if (header) {
      event.preventDefault();
      header.parentElement.classList.toggle('open');
      return;
    }

    const trigger = event.target.closest('[data-custom-filter-trigger]');
    if (!trigger || trigger.matches('input[type="radio"]')) return;

    event.preventDefault();

    const { param, value } = trigger.dataset;
    if (!param || !value) return;

    const form = trigger.closest('[data-custom-filter-form]');
    const hiddenInput = form?.querySelector('[data-custom-filter-input]');
    const currentValues = new Set(splitFilterValues(hiddenInput?.value));

    // TOGGLE VALUE (multi-select logic)
    if (currentValues.has(value)) {
      currentValues.delete(value);
    } else {
      currentValues.add(value);
    }

    const nextValue = Array.from(currentValues).join(',');

    updateCustomFilterState(filtersContainer, param, nextValue);
    await applyAllFilters(filtersContainer);
  });

  // Radio change
  filtersContainer.addEventListener('change', async (event) => {
    const trigger = event.target.closest('input[type="radio"][data-custom-filter-trigger]');
    if (!trigger) return;

    const { param, value } = trigger.dataset;
    if (!param) return;

    updateCustomFilterState(filtersContainer, param, value || '');
    await applyAllFilters(filtersContainer);
  });
});
