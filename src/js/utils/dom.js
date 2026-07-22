export function $(selector, root = document) {
  return root.querySelector(selector);
}

export function $all(selector, root = document) {
  return [...root.querySelectorAll(selector)];
}

export function el(tag, props = {}, children = []) {
  const node = document.createElement(tag);
  const { className, dataset, attrs, on, ...rest } = props;

  if (className) node.className = className;

  if (dataset) {
    Object.entries(dataset).forEach(([key, value]) => {
      node.dataset[key] = value;
    });
  }

  if (attrs) {
    Object.entries(attrs).forEach(([key, value]) => {
      if (value === false || value == null) return;
      if (value === true) node.setAttribute(key, '');
      else node.setAttribute(key, String(value));
    });
  }

  if (on) {
    Object.entries(on).forEach(([eventName, handler]) => {
      node.addEventListener(eventName, handler);
    });
  }

  Object.entries(rest).forEach(([key, value]) => {
    if (key === 'text') {
      node.textContent = value;
      return;
    }
    if (key === 'html') {
      node.innerHTML = value;
      return;
    }
    node[key] = value;
  });

  const list = Array.isArray(children) ? children : [children];
  list.flat().forEach((child) => {
    if (child == null || child === false) return;
    node.append(child.nodeType ? child : document.createTextNode(String(child)));
  });

  return node;
}

export function clear(node) {
  while (node.firstChild) node.removeChild(node.firstChild);
  return node;
}

export function assetUrl(path) {
  const cleaned = String(path || '').replace(/^\//, '');
  return `${import.meta.env.BASE_URL}${cleaned}`;
}
