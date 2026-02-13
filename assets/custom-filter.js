/**
 * Custom Filter Logic for Shopify Metaobjects
 * Handles: AJAX fetching, URL syncing, and Toggle states.
 */
document.addEventListener('DOMContentLoaded', () => {
  const container = document.querySelector('[data-custom-filters-container]');
  // CHANGE THIS: Ensure this ID matches the container of your product listing
  const productGridSelector = '#product-grid'; 

  if (!container) return;

  // 1. EVENT DELEGATION
  container.addEventListener('click', (event) => {
    const trigger = event.target.closest('[data-custom-filter-trigger]');
    if (!trigger) return;

    // Handle Button UI
    if (trigger.tagName === 'BUTTON') {
      event.preventDefault();
      handleToggle(trigger.dataset.param, trigger.dataset.value);
    }
  });

  container.addEventListener('change', (event) => {
    const trigger = event.target.closest('[data-custom-filter-trigger]');
    if (!trigger || trigger.tagName !== 'INPUT') return;

    // Handle Radio UI
    updateURL(trigger.name, trigger.value);
  });

  // 2. TOGGLE LOGIC (For Buttons)
  function handleToggle(param, value) {
    const currentParams = new URLSearchParams(window.location.search);
    
    // If already active, remove it. Otherwise, set it.
    if (currentParams.get(param) === value) {
      updateURL(param, null);
    } else {
      updateURL(param, value);
    }
  }

  // 3. URL MANAGEMENT
  function updateURL(param, value) {
    const searchParams = new URLSearchParams(window.location.search);

    if (value && value !== "") {
      searchParams.set(param, value);
    } else {
      searchParams.delete(param);
    }

    // Always reset pagination when filtering
    searchParams.delete('page');

    const newUrl = `${window.location.pathname}?${searchParams.toString()}`;
    renderSection(newUrl);
  }

  // 4. AJAX RENDERER
  async function renderSection(url) {
    // Add visual feedback
    const grid = document.querySelector(productGridSelector);
    if (grid) grid.style.opacity = '0.5';
    container.style.pointerEvents = 'none'; // Prevent double-clicks

    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error('Network response was not ok');
      
      const text = await response.text();
      const html = new DOMParser().parseFromString(text, 'text/html');

      // Update Product Grid
      const newGrid = html.querySelector(productGridSelector);
      if (grid && newGrid) {
        grid.innerHTML = newGrid.innerHTML;
        grid.style.opacity = '1';
      }

      // Update Filters (to update the 'active' classes via Liquid)
      const newFilters = html.querySelector('[data-custom-filters-container]');
      if (newFilters) {
        container.innerHTML = newFilters.innerHTML;
      }

      // Update Browser History
      window.history.pushState({ url }, '', url);

    } catch (error) {
      console.error('Filter Error:', error);
    } finally {
      container.style.pointerEvents = 'auto';
    }
  }

  // Handle Back/Forward Browser Buttons
  window.onpopstate = (event) => {
    renderSection(window.location.href);
  };
});