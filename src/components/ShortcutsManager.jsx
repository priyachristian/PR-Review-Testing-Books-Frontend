import { useEffect } from 'react';

const ACTIONS = {
  create: ['add', 'create new', 'create', 'new'],
  print: ['print'],
  edit: ['edit'],
  delete: ['delete', 'del'],
};

const isEditableTarget = element => {
  if (!element) return false;
  const tag = element.tagName?.toLowerCase();
  return ['input', 'textarea', 'select'].includes(tag) || element.isContentEditable;
};

const isVisible = element => !!element && !!(element.offsetWidth || element.offsetHeight || element.getClientRects().length);

const clickBestMatch = keywords => {
  const elements = document.querySelectorAll('button, a, [role="button"], input[type="button"]');

  for (const element of elements) {
    if (!isVisible(element)) continue;

    const text = (element.getAttribute('aria-label') || element.getAttribute('title') || element.textContent || '').toLowerCase();

    if (keywords.some(keyword => text.includes(keyword))) {
      element.click();
      return true;
    }
  }

  return false;
};

const SHORTCUTS = [
  {
    action: 'create',
    match: e => e.altKey && e.code === 'KeyN',
  },
  {
    action: 'print',
    match: e => (e.ctrlKey || e.metaKey) && e.code === 'KeyP',
    fallback: () => window.print(),
  },
  {
    action: 'edit',
    match: e => e.altKey && !e.ctrlKey && e.code === 'KeyE',
  },
  {
    action: 'delete',
    match: e => !e.ctrlKey && !e.altKey && e.code === 'Delete',
  },
];

const ShortcutsManager = () => {
  useEffect(() => {
    const handleKeyDown = e => {
      if (isEditableTarget(document.activeElement)) return;

      const shortcut = SHORTCUTS.find(item => item.match(e));

      if (!shortcut) return;

      const clicked = clickBestMatch(ACTIONS[shortcut.action]);

      if (clicked || shortcut.fallback) {
        e.preventDefault();

        if (clicked) {
          window.dispatchEvent(new CustomEvent('app-shortcut', { detail: { action: shortcut.action } }));
        } else {
          shortcut.fallback();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);

    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, []);

  return null;
};

export default ShortcutsManager;
