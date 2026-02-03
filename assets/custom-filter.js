document.addEventListener('click', function (e) {
  const btn = e.target.closest('.filter-btn');
  if (!btn) return;

  const param = btn.dataset.param;
  const value = btn.dataset.value;

  const url = new URL(window.location.href);

  if (btn.classList.contains('active')) {
    url.searchParams.delete(param);
  } else {
    url.searchParams.set(param, value);
  }

  window.location.href = url.toString();
});
