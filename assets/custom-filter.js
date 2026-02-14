const toggleIcons = document.querySelectorAll(".dropdown-icon");

toggleIcons.forEach((icon) => {
  icon.addEventListener('click', () => {
    // Find the closest wrapper that has both the icon and the menu
    const parent = icon.closest('.div-block');
    
    // Toggle the 'open' class on that parent
    parent.classList.toggle('open');
    
    // If you want the menu to show/hide at the same time:
    const dropdownui = parent.querySelector(".w-form");
    if (parent.classList.contains('open')) {
      dropdownui.style.display = "block";
    } else {
      dropdownui.style.display = "none";
    }
  });
});
//from here the logic part start 

const filterTriggers = document.querySelectorAll('[data-custom-filter-trigger]');

filterTriggers.forEach(trigger => {
  trigger.addEventListener('click', (e) => {
    e.preventDefault(); // Stop the form from submitting normally

    // 1. Get the current URL and existing parameters
    const currentUrl = new URL(window.location.href);
    const params = new URLSearchParams(currentUrl.search);

    // 2. Get the new filter's info from the data attributes
    const paramName = trigger.dataset.param; 
    const paramValue = trigger.dataset.value;

    // 3. Logic: If the user clicks an already active filter, remove it (Toggle off)
    // Otherwise, set the new value (Toggle on)
    if (params.get(paramName) === paramValue) {
      params.delete(paramName);
    } else {
      params.set(paramName, paramValue);
    }

    // 4. Reset to page 1 (if you have pagination)
    if (params.has('page')) params.delete('page');

    // 5. Build the new URL and redirect the user
    window.location.href = `${currentUrl.pathname}?${params.toString()}`;
  });
});

