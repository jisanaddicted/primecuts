// -----------------------------------
// Helper: Split comma-separated values
// -----------------------------------
const splitFilterValues = (value) => {
  if (!value) return [];
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
};

// -----------------------------------
// Custom Filters Class
// -----------------------------------
class CustomFilters {
  constructor(container) {
    this.container = container;

    this.onPopState = this.onPopState.bind(this);
    this.onContainerClick = this.onContainerClick.bind(this);
    this.onContainerChange = this.onContainerChange.bind(this);

    window.addEventListener('popstate', this.onPopState);
    this.container.addEventListener('click', this.onContainerClick);
    this.container.addEventListener('change', this.onContainerChange);

    // Initialize UI from URL
    this.syncFromUrl(window.location.search);
  }

  // -----------------------------------
  // Handle browser back/forward
  // -----------------------------------
  onPopState(event) {
    const searchParams =
      event.state?.searchParams ||
      window.location.search.replace(/^\?/, '');

    this.syncFromUrl(searchParams);
    this.renderPage(searchParams, false);
  }

  // -----------------------------------
  // Get Shopify section id
  // -----------------------------------
  getSectionId() {
    return document.getElementById('product-grid')?.dataset.id;
  }

  // -----------------------------------
  // Sync UI from URL
  // -----------------------------------
  syncFromUrl(search) {
    const searchParams = new URLSearchParams(search);
    const forms = this.container.querySelectorAll('[data-custom-filter-form]');

    forms.forEach((form) => {
      const param = form.dataset.customFilterParam;
      if (!param) return;

      const value = searchParams.get(param) || '';
      this.updateFilterState(param, value);
    });
  }

  // -----------------------------------
  // Update UI + hidden input
  // -----------------------------------
  updateFilterState(param, value) {
    const selectedValues = new Set(splitFilterValues(value));
    const escapedParam = CSS.escape(param);

    const triggers = this.container.querySelectorAll(
      `[data-custom-filter-trigger][data-param="${escapedParam}"]`
    );

    triggers.forEach((trigger) => {
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

    const hiddenInput = this.container.querySelector(
      `[data-custom-filter-form][data-custom-filter-param="${escapedParam}"] [data-custom-filter-input]`
    );

    if (hiddenInput) {
      hiddenInput.value = Array.from(selectedValues).join(',');
    }
  }

  // -----------------------------------
  // Collect ALL filters (merge logic)
  // -----------------------------------
  collectSearchParams() {
    const params = new URLSearchParams(window.location.search);
    const forms = this.container.querySelectorAll('[data-custom-filter-form]');

    forms.forEach((form) => {
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

      const checkedRadio = form.querySelector(
        'input[type="radio"]:checked'
      );
      if (checkedRadio) {
        params.set(param, checkedRadio.value);
      }
    });

    return params.toString();
  }

  // -----------------------------------
  // AJAX render product grid
  // -----------------------------------
  async renderPage(searchParams, updateURL = true) {
    const sectionId = this.getSectionId();

    if (!sectionId) {
      window.location.href = `${window.location.pathname}?${searchParams}`;
      return;
    }

    const url = `${window.location.pathname}?section_id=${sectionId}${
      searchParams ? `&${searchParams}` : ''
    }`;

    try {
      const response = await fetch(url, {
        headers: { 'X-Requested-With': 'XMLHttpRequest' },
      });

      if (!response.ok) throw new Error('Failed fetch');

      const html = await response.text();
      const parsed = new DOMParser().parseFromString(html, 'text/html');

      const nextGrid = parsed.getElementById('ProductGridContainer');
      const currentGrid = document.getElementById('ProductGridContainer');

      if (!nextGrid || !currentGrid) throw new Error('Grid missing');

      currentGrid.innerHTML = nextGrid.innerHTML;

      if (updateURL) {
        const nextUrl = `${window.location.pathname}${
          searchParams ? `?${searchParams}` : ''
        }`;

        history.pushState({ searchParams }, '', nextUrl);
      }
    } catch (error) {
      window.location.href = `${window.location.pathname}?${searchParams}`;
    }
  }

  // -----------------------------------
  // BUTTON CLICK (MULTI-SELECT TOGGLE)
  // -----------------------------------
  async onContainerClick(event) {
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
    if (!form) return;

    const hiddenInput = form.querySelector('[data-custom-filter-input]');
    if (!hiddenInput) return;

    let values = splitFilterValues(hiddenInput.value);

    if (values.includes(value)) {
      values = values.filter((v) => v !== value);
    } else {
      values.push(value);
    }

    hiddenInput.value = values.join(',');

    this.updateFilterState(param, hiddenInput.value);

    const searchParams = this.collectSearchParams();
    await this.renderPage(searchParams);
  }

  // -----------------------------------
  // RADIO CHANGE
  // -----------------------------------
  async onContainerChange(event) {
    const trigger = event.target.closest(
      'input[type="radio"][data-custom-filter-trigger]'
    );

    if (!trigger) return;

    const { param, value } = trigger.dataset;
    if (!param) return;

    this.updateFilterState(param, value || '');

    const searchParams = this.collectSearchParams();
    await this.renderPage(searchParams);
  }
}

// -----------------------------------
// Init
// -----------------------------------
document.addEventListener('DOMContentLoaded', () => {
  const container = document.querySelector('[data-custom-filters-container]');
  if (!container) return;

  new CustomFilters(container);
});
