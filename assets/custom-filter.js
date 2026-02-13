const toggleiconEl = document.querySelector(".dropdown-icon");
const dropdownui = document.querySelector(".w-form");
toggleiconEl.addEventListener('click', () => {
    dropdownui.style.display = "block";
    
} 
});
toggleiconEl.addEventListener('click', () => {
    if (dropdownui.style.display == "block"){
    dropdownui.style.display = "none"
    
} 
});
