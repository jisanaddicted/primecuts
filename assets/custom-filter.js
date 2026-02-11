const splitFilterValues = (value) =>
  (value || '').split(',').map(item => item.trim()).filter(Boolean);

const updateCustomFilterState = (container, param, value) => {
  if (!param) return;

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

  const buttonFormInput = container.querySelector(
    `[data-custom-filter-form][data-custom-filter-param="${CSS.escape(param)}"] [data-custom-filter-input]`
  );

  if (buttonFormInput) {
    buttonFormInput.value = Array.from(selectedValues).join(',');
  }
};

const syncCustomFilterState = (state, param, value) => {
  if (!param) return;
  const normalizedValue = splitFilterValues(value).join(',');
  if (normalizedValue) state.set(param, normalizedValue);
  else state.delete(param);
};

const renderUpdatedCollection = async (url) => {
  const response = await fetch(url, { headers: { 'X-Requested-With': 'XMLHttpRequest' } });
  if (!response.ok) throw new Error('Unable to update filters');

  const htmlText = await response.text();
  const parser = new DOMParser();
  const nextDocument = parser.parseFromString(htmlText, 'text/html');

  const nextGrid = nextDocument.querySelector('#ProductGridContainer');
  const currentGrid = document.querySelector('#ProductGridContainer');

  if (nextGrid && currentGrid) currentGrid.innerHTML = nextGrid.innerHTML;
};

const applyAllFilters = async (customFilterState, customFilterParams) => {
  const params = new URLSearchParams(window.location.search);

  customFilterParams.forEach(param => params.delete(param));
  customFilterState.forEach((value, param) => {
    if (value) params.set(param, value);
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

  const customFilterState = new Map();
  const customFilterParams = new Set();

  // Initialize filter states from URL
  const forms = filtersContainer.querySelectorAll('[data-custom-filter-form]');
  forms.forEach(form => {
    const param = form.dataset.customFilterParam;
    if (!param) return;
    customFilterParams.add(param);

    const hiddenInput = form.querySelector('[data-custom-filter-input]');
    const queryValue = new URLSearchParams(window.location.search).get(param);

    let initialValue = '';
    if (hiddenInput) initialValue = queryValue ?? hiddenInput.value;
    else {
      const checkedRadio = form.querySelector('input[type="radio"]:checked');
      if (checkedRadio) initialValue = checkedRadio.value;
    }

    updateCustomFilterState(filtersContainer, param, initialValue);
    syncCustomFilterState(customFilterState, param, initialValue);
  });

  // Button clicks & dropdown toggle
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

    if (currentValues.has(value)) currentValues.delete(value);
    else currentValues.add(value);

    const nextValue = Array.from(currentValues).join(',');
    updateCustomFilterState(filtersContainer, param, nextValue);
    syncCustomFilterState(customFilterState, param, nextValue);
    await applyAllFilters(customFilterState, customFilterParams);
  });

  // Radio changes
  filtersContainer.addEventListener('change', async (event) => {
    const trigger = event.target.closest('input[type="radio"][data-custom-filter-trigger]');
    if (!trigger) return;

    const { param, value } = trigger.dataset;
    if (!param) return;

    updateCustomFilterState(filtersContainer, param, value || '');
    syncCustomFilterState(customFilterState, param, value || '');
    await applyAllFilters(customFilterState, customFilterParams);
  });
});
