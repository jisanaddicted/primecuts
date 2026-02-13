// 1. Select all icons
const toggleIcons = document.querySelectorAll(".dropdown-icon");

toggleIcons.forEach((icon) => {
  icon.addEventListener('click', () => {
    // 2. Find the specific dropdown menu related to THIS icon
    // We look for the parent "div-block" then find the "w-form" inside it
    const parent = icon.closest('.div-block');
    const dropdownui = parent.querySelector(".w-form");

    // 3. Proper Toggle Logic
    if (dropdownui.style.display === "block") {
      dropdownui.style.display = "none";
    } else {
      dropdownui.style.display = "block";
    }
  });
});

