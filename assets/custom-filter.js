const splitFilterValues = (value) =>
  (value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

const uniqueFilterValues = (values) => Array.from(new Set(values));

const updateCustomFilterState = (container, param, value) => {
  if (!param) return;

  const selectedValues = new Set(splitFilterValues(value));

  const triggers = container.querySelectorAll(
    `[data-custom-filter-trigger][data-param="${CSS.escape(param)}"]`
  );

  triggers.forEach((trigger) => {
    const triggerValue = trigger.dataset.value;
    const isActive = selectedValues.has(triggerValue);

    if (trigger.matches('input[type="radio"], input[type="checkbox"]')) {
      trigger.checked = isActive;
      const wrapper = trigger.closest('.radio-filter-option');
      if (wrapper) wrapper.classList.toggle('active', isActive);
    }

    trigger.classList.toggle('active', isActive);
  });

  const hiddenInput = container.querySelector(
    `[data-custom-filter-form][data-custom-filter-param="${CSS.escape(param)}"] [data-custom-filter-input]`
  );
  if (hiddenInput) hiddenInput.value = uniqueFilterValues(Array.from(selectedValues)).join(',');
};

const getCustomFilterParams = (container) => {
  const params = new Set();
  container.querySelectorAll('[data-custom-filter-form]').forEach((form) => {
    const param = form.dataset.customFilterParam;
    if (param) params.add(param);
  });
  return params;
};

const getFormValue = (form) => {
  const hiddenInput = form.querySelector('[data-custom-filter-input]');
  if (hiddenInput) return uniqueFilterValues(splitFilterValues(hiddenInput.value)).join(',');

  const checkedInputs = form.querySelectorAll(
    'input[data-custom-filter-trigger][type="radio"]:checked, input[data-custom-filter-trigger][type="checkbox"]:checked'
  );
  return uniqueFilterValues(Array.from(checkedInputs, (input) => input.value)).join(',');
};

const buildFilterSearchParams = (container) => {
  const params = new URLSearchParams(window.location.search);
  const customParams = getCustomFilterParams(container);

  // remove existing custom params
  customParams.forEach((param) => params.delete(param));

  container.querySelectorAll('[data-custom-filter-form]').forEach((form) => {
    const param = form.dataset.customFilterParam;
    if (!param) return;

    const value = getFormValue(form);
    if (value) params.set(param, value);
  });

  return params;
};

const renderUpdatedCollection = async (url, signal) => {
  const response = await fetch(url, {
    headers: { 'X-Requested-With': 'XMLHttpRequest' },
    signal,
  });

  if (!response.ok) throw new Error('Unable to update filters');

  const htmlText = await response.text();
  const nextDocument = new DOMParser().parseFromString(htmlText, 'text/html');

  const nextGrid = nextDocument.querySelector('#ProductGridContainer');
  const currentGrid = document.querySelector('#ProductGridContainer');

  if (nextGrid && currentGrid) currentGrid.innerHTML = nextGrid.innerHTML;
};

let pendingFilterController;

const applyAllFilters = async (container) => {
  const params = buildFilterSearchParams(container);
  const queryString = params.toString();
  const nextUrl = `${window.location.pathname}${queryString ? `?${queryString}` : ''}`;

  if (pendingFilterController) pendingFilterController.abort();
  pendingFilterController = new AbortController();

  try {
    await renderUpdatedCollection(nextUrl, pendingFilterController.signal);
    window.history.replaceState({}, '', nextUrl);
  } catch (error) {
    if (error?.name === 'AbortError') return;
    window.location.href = nextUrl;
  }
};

document.addEventListener('DOMContentLoaded', () => {
  const filtersContainer = document.querySelector('[data-custom-filters-container]');
  if (!filtersContainer) return;

  // Initialize filter states from URL or hidden inputs
  filtersContainer.querySelectorAll('[data-custom-filter-form]').forEach((form) => {
    const param = form.dataset.customFilterParam;
    if (!param) return;

    const queryValue = new URLSearchParams(window.location.search).get(param);
    if (queryValue !== null) {
      updateCustomFilterState(filtersContainer, param, queryValue);
      return;
    }

    const existingValue = getFormValue(form);
    updateCustomFilterState(filtersContainer, param, existingValue);
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
    if (!trigger || trigger.matches('input[type="radio"], input[type="checkbox"]')) return;

    event.preventDefault();

    const { param, value } = trigger.dataset;
    if (!param || !value) return;

    const form = trigger.closest('[data-custom-filter-form]');
    const hiddenInput = form?.querySelector('[data-custom-filter-input]');
    if (!hiddenInput) return;

    const currentValues = new Set(splitFilterValues(hiddenInput.value));
    if (currentValues.has(value)) currentValues.delete(value);
    else currentValues.add(value);

    updateCustomFilterState(filtersContainer, param, Array.from(currentValues).join(','));
    await applyAllFilters(filtersContainer);
  });

  // Radio & checkbox changes
  filtersContainer.addEventListener('change', async (event) => {
    const trigger = event.target.closest('input[data-custom-filter-trigger]');
    if (!trigger) return;

    const { param } = trigger.dataset;
    if (!param) return;

    const form = trigger.closest('[data-custom-filter-form]');
    if (!form) return;

    updateCustomFilterState(filtersContainer, param, getFormValue(form));
    await applyAllFilters(filtersContainer);
  });
});
