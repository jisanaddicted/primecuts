const updateCustomFilterState = (container, param, value) => {
  const triggers = container.querySelectorAll(`[data-custom-filter-trigger][data-param="${CSS.escape(param)}"]`);

  triggers.forEach((trigger) => {
    const isActive = trigger.dataset.value === value;
    const isRadio = trigger.matches('input[type="radio"]');

    if (isRadio) {
      trigger.checked = isActive;
      const wrapper = trigger.closest('.radio-filter-option');
      if (wrapper) wrapper.classList.toggle('active', isActive);
      return;
    }

    trigger.classList.toggle('active', isActive);
  });
};

const renderUpdatedCollection = async (url) => {
  const response = await fetch(url, {
    headers: {
      'X-Requested-With': 'XMLHttpRequest',
    },
  });

  if (!response.ok) throw new Error('Unable to update filters');

  const htmlText = await response.text();
  const parser = new DOMParser();
  const nextDocument = parser.parseFromString(htmlText, 'text/html');

  const nextProductGrid = nextDocument.querySelector('#ProductGridContainer');
  const currentProductGrid = document.querySelector('#ProductGridContainer');

  if (nextProductGrid && currentProductGrid) {
    currentProductGrid.innerHTML = nextProductGrid.innerHTML;
  }
};

document.addEventListener('DOMContentLoaded', () => {
  const filtersContainer = document.querySelector('.collection-filters');
  if (!filtersContainer) return;

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
    const params = new URLSearchParams(window.location.search);
    const isAlreadyActive = params.get(param) === value;

    if (isAlreadyActive) {
      params.delete(param);
      updateCustomFilterState(filtersContainer, param, '');
    } else {
      params.set(param, value);
      updateCustomFilterState(filtersContainer, param, value);
    }

    const nextUrl = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ''}`;

    try {
      await renderUpdatedCollection(nextUrl);
      window.history.replaceState({}, '', nextUrl);
    } catch (error) {
      window.location.href = nextUrl;
    }
  });

  filtersContainer.addEventListener('change', async (event) => {
    const trigger = event.target.closest('input[type="radio"][data-custom-filter-trigger]');
    if (!trigger) return;

    const { param, value } = trigger.dataset;
    const params = new URLSearchParams(window.location.search);

    params.set(param, value);
    updateCustomFilterState(filtersContainer, param, value);

    const nextUrl = `${window.location.pathname}?${params.toString()}`;

    try {
      await renderUpdatedCollection(nextUrl);
      window.history.replaceState({}, '', nextUrl);
    } catch (error) {
      window.location.href = nextUrl;
    }
  });
});
