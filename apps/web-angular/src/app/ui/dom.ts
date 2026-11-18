/** Reads the value of the input/select that dispatched an event (typed alternative to `$any`). */
export function eventValue(event: Event): string {
  const target = event.target;
  return target instanceof HTMLInputElement || target instanceof HTMLSelectElement || target instanceof HTMLTextAreaElement
    ? target.value
    : '';
}
