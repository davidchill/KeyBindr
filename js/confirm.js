let _callback = null;

export function showConfirm(message, onConfirm) {
  _callback = onConfirm;
  document.getElementById('confirm-message').textContent = message;
  document.getElementById('confirm-overlay').classList.remove('hidden');
  document.getElementById('confirm-modal').classList.remove('hidden');
  document.getElementById('confirm-ok').focus();
}

export function closeConfirm(confirmed) {
  document.getElementById('confirm-overlay').classList.add('hidden');
  document.getElementById('confirm-modal').classList.add('hidden');
  const cb = _callback;
  _callback = null;
  if (confirmed && cb) cb();
}

export function initConfirmEvents() {
  document.getElementById('confirm-ok').addEventListener('click', () => closeConfirm(true));
  document.getElementById('confirm-cancel').addEventListener('click', () => closeConfirm(false));
  document.getElementById('confirm-overlay').addEventListener('click', () => closeConfirm(false));
}
