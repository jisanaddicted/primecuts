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

