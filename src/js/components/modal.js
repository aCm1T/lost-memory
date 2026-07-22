let previousFocus = null;

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
    document.removeEventListener('keydown', onKeyDown);
    if (previousFocus && typeof previousFocus.focus === 'function') {
      previousFocus.focus();
    }
  };

  const onKeyDown = (event) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      close();
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
  document.addEventListener('keydown', onKeyDown);

  const focusable = dialog.querySelector(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
  );
  if (focusable) focusable.focus();

  return { close, overlay, dialog };
}
