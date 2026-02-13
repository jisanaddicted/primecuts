const toggleiconEl = document.querySelector(".dropdown-icon");
const dropdownui = document.querySelector(".w-form");
toggleiconEl.addEventListener('click', () => {
    dropdownui.style.display = "block";
    if (dropdownui.style.display === "block"){
    dropdownui.style.display = "no"
} 
});
