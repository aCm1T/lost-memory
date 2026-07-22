export function showToast(
  message,
  { root = document.getElementById('toast-root'), timeout = 2800 } = {},
) {
  if (!root) return null;

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.setAttribute('role', 'status');
  toast.textContent = message;
  root.append(toast);

  window.setTimeout(() => {
    toast.remove();
  }, timeout);

  return toast;
}
