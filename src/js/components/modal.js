let previousFocus = null;

function getFocusable(container) {
  return [
    ...container.querySelectorAll(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ),
  ].filter((node) => !node.hasAttribute('disabled') && node.getAttribute('aria-hidden') !== 'true');
}

export function openModal({ title, bodyNodes = [], actions = [], labelledBy = 'modal-title' }) {
  previousFocus = document.activeElement;

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.setAttribute('role', 'presentation');

  const dialog = document.createElement('div');
  dialog.className = 'modal';
  dialog.setAttribute('role', 'dialog');
  dialog.setAttribute('aria-modal', 'true');
  dialog.setAttribute('aria-labelledby', labelledBy);

  const header = document.createElement('header');
  header.className = 'modal__header';
  const heading = document.createElement('h2');
  heading.id = labelledBy;
  heading.textContent = title;
  header.append(heading);

  const body = document.createElement('div');
  body.className = 'modal__body';
  bodyNodes.forEach((node) => {
    if (node) body.append(node);
  });

  const footer = document.createElement('footer');
  footer.className = 'modal__footer';

  const close = () => {
    overlay.remove();
    document.removeEventListener('keydown', onKeyDown, true);
    if (previousFocus && typeof previousFocus.focus === 'function') {
      previousFocus.focus();
    }
  };

  const onKeyDown = (event) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      close();
      return;
    }
    if (event.key !== 'Tab') return;
    const focusable = getFocusable(dialog);
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  actions.forEach((action) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = action.primary ? 'btn btn--primary' : 'btn';
    button.textContent = action.label;
    button.addEventListener('click', () => {
      if (action.onClick) action.onClick();
      if (action.close !== false) close();
    });
    footer.append(button);
  });

  if (!actions.length) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'btn btn--primary';
    button.textContent = '关闭';
    button.addEventListener('click', close);
    footer.append(button);
  }

  dialog.append(header, body, footer);
  overlay.append(dialog);
  overlay.addEventListener('click', (event) => {
    if (event.target === overlay) close();
  });

  document.body.append(overlay);
  document.addEventListener('keydown', onKeyDown, true);

  const focusable = getFocusable(dialog);
  if (focusable[0]) focusable[0].focus();

  return { close, overlay, dialog };
}
