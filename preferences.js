(() => {
  const toggle = document.querySelector('#time-24-hour');
  toggle.checked = localStorage.getItem('todo-time-24') !== 'false';
  function update() {
    // Keep the native calendar available for deadlines in either time format.
    document.querySelectorAll('input[type="time"], input[data-time-input="time"]').forEach((input) => {
      if (!input.dataset.timeInput) input.dataset.timeInput = input.type;
      input.type = toggle.checked ? 'text' : input.dataset.timeInput;
      if (toggle.checked) {
        input.placeholder = 'HH:MM'; input.inputMode = 'numeric';
        input.pattern = '([01][0-9]|2[0-3]):[0-5][0-9]';
        input.maxLength = 5;
      } else { input.removeAttribute('pattern'); input.removeAttribute('maxlength'); }
    });
  }
  toggle.addEventListener('change', () => { localStorage.setItem('todo-time-24', String(toggle.checked)); update(); });
  // Normalize compact 24-hour entries before native pattern validation runs.
  function normalizeTimeEntry(event) {
    const input = event.target;
    if (!input.matches('input[data-time-input="time"][type="text"]')) return;
    const normalized = window.TodoDeadline.normalizeTime(input.value);
    if (normalized) input.value = normalized;
  }
  document.addEventListener('input', normalizeTimeEntry);
  document.addEventListener('change', normalizeTimeEntry);
  new MutationObserver(update).observe(document.body, { childList: true, subtree: true });
  update();
  const smallScreen = matchMedia('(max-width: 1199px)');
  const panel = document.querySelector('#usage-panel');
  const compactUsage = document.querySelector('#compact-usage');
  function placeUsage() {
    if (smallScreen.matches) document.querySelector('#compact-usage-content').append(panel);
    else document.querySelector('#settings-action').before(panel);
    compactUsage.hidden = !smallScreen.matches || panel.classList.contains('hidden');
  }
  smallScreen.addEventListener('change', placeUsage); placeUsage();
  new MutationObserver(placeUsage).observe(panel, { attributes: true, attributeFilter: ['class'] });

  // Keep a modal inside the visible screen when a virtual keyboard is open.
  let viewportFrame = null;
  function fitDialogs() {
    viewportFrame = null;
    const viewport = window.visualViewport;
    const height = viewport?.height || window.innerHeight;
    document.documentElement.style.setProperty('--dialog-available-height', `${height}px`);
    document.documentElement.style.setProperty('--dialog-center', `${(viewport?.offsetTop || 0) + height / 2}px`);
  }
  function scheduleDialogFit() {
    if (viewportFrame === null) viewportFrame = requestAnimationFrame(fitDialogs);
  }
  window.addEventListener('resize', scheduleDialogFit);
  window.visualViewport?.addEventListener('resize', scheduleDialogFit);
  window.visualViewport?.addEventListener('scroll', scheduleDialogFit);
  fitDialogs();
})();
