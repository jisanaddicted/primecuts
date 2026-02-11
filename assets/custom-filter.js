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

const collectCombinedParams = (container) => {
  const params = new URLSearchParams(window.location.search);
  const forms = container.querySelectorAll('[data-custom-filter-form]');

  forms.forEach(form => {
    const param = form.dataset.customFilterParam;
    if (!param) return;

    params.delete(param);

    const hiddenInput = form.querySelector('[data-custom-filter-input]');
    if (hiddenInput) {
      const values = splitFilterValues(hiddenInput.value);
      if (values.length) params.set(param, values.join(','));
      return;
    }

    const checkedRadio = form.querySelector('input[type="radio"]:checked');
    if (checkedRadio) params.set(param, checkedRadio.value);
  });

  return params;
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

const applyAllFilters = async (container) => {
  const params = collectCombinedParams(container);
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

  // Initialize filter states from URL
  const forms = filtersContainer.querySelectorAll('[data-custom-filter-form]');
  forms.forEach(form => {
    const param = form.dataset.customFilterParam;
    if (!param) return;

    const hiddenInput = form.querySelector('[data-custom-filter-input]');
    if (hiddenInput) {
      const queryValue = new URLSearchParams(window.location.search).get(param);
      const initialValue = queryValue ?? hiddenInput.value;
      updateCustomFilterState(filtersContainer, param, initialValue || '');
      return;
    }

    const checkedRadio = form.querySelector('input[type="radio"]:checked');
    if (checkedRadio) updateCustomFilterState(filtersContainer, param, checkedRadio.value);
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

    updateCustomFilterState(filtersContainer, param, Array.from(currentValues).join(','));
    await applyAllFilters(filtersContainer);
  });

  // Radio changes
  filtersContainer.addEventListener('change', async (event) => {
    const trigger = event.target.closest('input[type="radio"][data-custom-filter-trigger]');
    if (!trigger) return;

    const { param, value } = trigger.dataset;
    if (!param) return;

    updateCustomFilterState(filtersContainer, param, value || '');
    await applyAllFilters(filtersContainer);
  });
});
