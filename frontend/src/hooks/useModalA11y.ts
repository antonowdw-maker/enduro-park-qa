import { useEffect, useRef, type RefObject } from 'react';

const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Волна F: focus trap + Escape для модалок.
 * initialFocus — селектор или элемент; иначе первый focusable.
 */
export function useModalA11y(
  open: boolean,
  containerRef: RefObject<HTMLElement | null>,
  onEscape: () => void,
  options?: { escapeDisabled?: boolean; initialFocusSelector?: string },
) {
  const onEscapeRef = useRef(onEscape);

  useEffect(() => {
    onEscapeRef.current = onEscape;
  }, [onEscape]);

  useEffect(() => {
    if (!open) return;
    const root = containerRef.current;
    if (!root) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;

    const focusables = () =>
      Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((el) => {
        if (el.hasAttribute('disabled') || el.getAttribute('aria-disabled') === 'true') {
          return false;
        }
        // offsetParent === null у fixed — нельзя отфильтровывать (модалка fixed)
        const style = window.getComputedStyle(el);
        if (style.visibility === 'hidden' || style.display === 'none') return false;
        return el.getClientRects().length > 0;
      });

    const initial =
      (options?.initialFocusSelector &&
        root.querySelector<HTMLElement>(options.initialFocusSelector)) ||
      focusables()[0];
    // rAF: дать React дорисовать input после mount
    const focusTimer = window.requestAnimationFrame(() => initial?.focus());

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !options?.escapeDisabled) {
        event.preventDefault();
        onEscapeRef.current();
        return;
      }
      if (event.key !== 'Tab') return;

      const list = focusables();
      if (list.length === 0) return;
      const first = list[0];
      const last = list[list.length - 1];
      const active = document.activeElement as HTMLElement | null;

      if (event.shiftKey) {
        if (active === first || !root.contains(active)) {
          event.preventDefault();
          last.focus();
        }
      } else if (active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      window.cancelAnimationFrame(focusTimer);
      document.removeEventListener('keydown', onKeyDown);
      previouslyFocused?.focus?.();
    };
  }, [open, containerRef, options?.escapeDisabled, options?.initialFocusSelector]);
}
