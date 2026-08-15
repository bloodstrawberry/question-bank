/**
 * Helper to navigate focus exclusively between visible input fields
 * (FastTextField input/textarea, TipTap markdown contenteditable, MUI Select combobox)
 * skipping all buttons, icons, drag handles, and hidden/collapsed fields.
 */
export function focusNextInput(currentElement: HTMLElement, reverse: boolean = false): boolean {
  const container =
    currentElement.closest('.problem-editor-card-container') ||
    currentElement.closest('.MuiCard-root') ||
    document.body;

  const selector = [
    'input:not([type="hidden"]):not([type="checkbox"]):not([type="radio"]):not([disabled]):not([tabindex="-1"])',
    'textarea:not([disabled]):not([tabindex="-1"])',
    '[contenteditable="true"]:not([tabindex="-1"])',
    '[role="combobox"]:not([disabled]):not([tabindex="-1"])',
  ].join(', ');

  const candidateElements = Array.from(container.querySelectorAll<HTMLElement>(selector));

  const visibleInputs = candidateElements.filter((el) => {
    if (el.offsetWidth === 0 && el.offsetHeight === 0) return false;
    const style = window.getComputedStyle(el);
    if (style.display === 'none' || style.visibility === 'hidden') return false;
    return true;
  });

  const currentIndex = visibleInputs.findIndex(
    (el) => el === currentElement || el.contains(currentElement)
  );

  if (currentIndex !== -1) {
    const targetIndex = reverse ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex >= 0 && targetIndex < visibleInputs.length) {
      visibleInputs[targetIndex].focus();
      return true;
    }
  }

  return false;
}
