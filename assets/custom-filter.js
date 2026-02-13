// -----------------------------
// Helper: Split comma values safely
// -----------------------------
const splitFilterValues = (value) => {
  if (!value) return [];
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
};

// -----------------------------
// Custom Filters Class
// -----------------------------
class CustomFilters {
  constructor(container) {
    this.container = container;

    this.onPopState = this.onPopState.bind(this);
    this.onContainerClick = this.onContainerClick.bind(this);
    this.onContainerChange = this.onContainerChange.bind(this);

    window.addEventListener('popstate', this.onPopState);
    this.container.addEventListener('click', this.onContainerClick);
    this.container.addEventListener('change', this.onContainerChange);

    // Initialize state from current URL
    this.syncFromUrl(window.location.search);
  }

  // -----------------------------
  // Handle Back / Forward browser
  // -----------------------------
  onPopState(event) {
    const searchParams =
      event.state?.searchParams ||
      window.location.search.replace(/^\?/, '');

    this.syncFromUrl(searchParams);
    this.renderPage(searchParams, false);
  }

  // -----------------------------
  // Get Shopify Section ID
  // -----------------------------
  getSectionId() {
    return document.getElementById('product-grid')?.dataset.id;
  }

  // -----------------------------
  // Sync UI from URL
  // -----------------------------
  syncFromUrl(search) {
    const searchParams = new URLSearchParams(search);
    const forms = this.container.querySelectorAll(
      '[data-custom-filter-form]'
    );

    forms.forEach((form) => {
      const param = form.dataset.customFilterParam;
      if (!param) return;

      const value = searchParams.get(param) || '';
      this.updateFilterState(param, value);
    });
  }

  // -----------------------------
  // Update UI State
  // -----------------------------
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
        const label = trigger.closest('.radio-filter-option');
        if (label) label.classList.toggle('active', isActive);
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

  // -----------------------------
  // Collect ALL filters (MERGE)
  // -----------------------------
  collectSearchParams() {
    const params = new URLSearchParams(window.location.search);
    const forms = this.container.querySelectorAll(
      '[data-custom-filter-form]'
    );

    forms.forEach((form) => {
      const param = form.dataset.customFilterParam;
      if (!param) return;

      params.delete(param);

      const hiddenInput = form.querySelector(
        '[data-custom-filter-input]'
      );

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

  // -----------------------------
  // Render AJAX product grid
  // -----------------------------
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

      if (!response.ok) throw new Error('Failed to fetch');

      const html = await response.text();
      const parsed = new DOMParser().parseFromString(
        html,
        'text/html'
      );

      const nextGrid =
        parsed.getElementById('ProductGridContainer');
      const currentGrid =
        document.getElementById('ProductGridContainer');

      if (!nextGrid || !currentGrid)
        throw new Error('Missing grid');

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

  // -----------------------------
  // Click (Buttons / Mult
