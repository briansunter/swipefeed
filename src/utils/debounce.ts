export function debounce<A extends unknown[]>(fn: (...args: A) => void, wait: number) {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  const debounced = (...args: A) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => {
      timeout = null;
      fn(...args);
    }, wait);
  };

  debounced.cancel = () => {
    if (timeout) {
      clearTimeout(timeout);
      timeout = null;
    }
  };

  return debounced;
}

