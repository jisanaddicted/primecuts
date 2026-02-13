document.addEventListener('DOMContentLoaded', () => {
  const container = document.querySelector('[data-custom-filters-container]');
  const productGridSelector = '#product-grid'; // Change this to your grid's ID

  if (!container) return;

  // 1. CLICK HANDLER (Buttons)
  container.addEventListener('click', (event) => {
    const trigger = event.target.closest('[data-custom-filter-trigger]');
    if (!trigger || trigger.tagName !== 'BUTTON') return;

    event.preventDefault();
    const param = trigger.dataset.param;
    const value = trigger.dataset.value;

    handleFilterChange(param, value, true);
  });

  // 2. CHANGE HANDLER (Radios)
  container.addEventListener('change', (event) => {
    const trigger = event.target.closest('[data-custom-filter-trigger]');
    if (!trigger || trigger.tagName !== 'INPUT') return;

    handleFilterChange(trigger.name, trigger.value, false);
  });

  // 3. CORE LOGIC: Toggle & URL Update
  function handleFilterChange(param, value, isToggle) {
    const searchParams = new URLSearchParams(window.location.search);
    const existingValue = searchParams.get(param);

    if (isToggle && existingValue === value) {
      // If clicking an already active button, REMOVE it
      searchParams.delete(param);
    } else {
      // Otherwise, SET the new value
      searchParams.set(param, value);
    }

    // Reset pagination to page 1
    searchParams.delete('page');

    const newUrl = `${window.location.pathname}?${searchParams.toString()}`;
    
    // Update Browser Bar immediately
    window.history.pushState({ url: newUrl }, '', newUrl);
    
    // Fetch New Content
    renderSection(newUrl);
  }

  // 4. AJAX RENDERER
  async function renderSection(url) {
    const grid = document.querySelector(productGridSelector);
    
    // Visual Feedback: Start Loading
    if (grid) grid.style.opacity = '0.5';
    container.classList.add('is-loading');

    try {
      const response = await fetch(url);
      const text = await response.text();
      const html = new DOMParser().parseFromString(text, 'text/html');

      // Update the Products
      const newGrid = html.querySelector(productGridSelector);
      if (grid && newGrid) {
        grid.innerHTML = newGrid.innerHTML;
        grid.style.opacity = '1';
      }

      // Update the Filters (to refresh 'active' classes and counts)
      const newFilters = html.querySelector('[data-custom-filters-container]');
      if (newFilters) {
        container.innerHTML = newFilters.innerHTML;
      }

    } catch (error) {
      console.error('Filter Error:', error);
      if (grid) grid.style.opacity = '1';
    } finally {
      container.classList.remove('is-loading');
    }
  }

  // Handle Browser Back/Forward buttons
  window.onpopstate = () => renderSection(window.location.href);
});