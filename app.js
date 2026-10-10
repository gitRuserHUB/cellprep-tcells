(function () {
  'use strict';
  const core = window.CellPrep;
  const input = document.getElementById('cell-count');
  const summary = document.getElementById('count-summary');
  const copy = document.getElementById('copy');
  const dialog = document.getElementById('rules-dialog');
  const STORAGE_KEY = 'cellprep-settings-v1';
  let exponent = 6;
  let result = null;
  let toastTimer;

  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    if (saved && typeof saved === 'object') {
      input.value = typeof saved.value === 'string' ? saved.value.slice(0, 20) : '';
      exponent = saved.exponent === 7 ? 7 : 6;
    }
  } catch (_) { /* Storage is optional. */ }

  function render() {
    result = core.calculate(input.value, exponent);
    const hasError = input.value.trim().length > 0 && !result;
    input.setAttribute('aria-invalid', String(hasError));
    summary.classList.toggle('error-text', hasError);
    summary.replaceChildren();
    if (hasError) summary.textContent = '请输入大于 0 的数字，在右侧选择数量级';
    else if (result) {
      const dot = document.createElement('i'); dot.className = 'status-dot';
      const count = document.createElement('span'); count.textContent = core.formatCount(result.cellCount) + ' 个细胞';
      summary.append(dot, count);
    } else summary.textContent = '例如 10 × 10⁶ = 1 × 10⁷';
    document.querySelectorAll('[data-output]').forEach(node => {
      node.textContent = result ? core.formatVolume(result[node.dataset.output]) : '—';
      node.classList.toggle('empty-value', !result);
    });
    document.querySelectorAll('[data-exponent]').forEach(button => {
      const selected = Number(button.dataset.exponent) === exponent;
      button.classList.toggle('selected', selected);
      button.setAttribute('aria-pressed', String(selected));
    });
    document.getElementById('small-volume').hidden = !result || ![result.cd11bUl, result.cd49bUl, result.cd45rUl, result.beadUl]
      .some(value => value > 0 && value < 0.0005);
    copy.disabled = !result;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ value: input.value, exponent })); } catch (_) {}
  }

  function showToast(message) {
    const toast = document.getElementById('toast');
    clearTimeout(toastTimer);
    toast.textContent = message; toast.hidden = false;
    toastTimer = setTimeout(() => { toast.hidden = true; }, 2400);
  }

  input.addEventListener('input', render);
  document.querySelectorAll('[data-exponent]').forEach(button => button.addEventListener('click', () => {
    exponent = Number(button.dataset.exponent); render();
  }));
  document.getElementById('clear').addEventListener('click', () => { input.value = ''; render(); input.focus(); });
  document.getElementById('rules').addEventListener('click', () => dialog.showModal());
  ['close-rules', 'done-rules'].forEach(id => document.getElementById(id).addEventListener('click', () => dialog.close()));
  dialog.addEventListener('click', event => {
    const box = dialog.getBoundingClientRect();
    if (event.target === dialog && (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom)) dialog.close();
  });
  copy.addEventListener('click', async () => {
    if (!result) return;
    const text = core.createCopyText(result);
    try {
      if (navigator.clipboard && window.isSecureContext) await navigator.clipboard.writeText(text);
      else {
        const area = document.createElement('textarea');
        area.value = text; area.style.position = 'fixed'; area.style.top = '-1000px';
        document.body.append(area); area.select();
        const copied = document.execCommand('copy'); area.remove();
        if (!copied) throw new Error('Clipboard unavailable');
      }
      showToast('用量清单已复制');
    } catch (_) { showToast('复制失败，请检查浏览器剪贴板权限'); }
  });
  render();
})();
