import { useState, useEffect } from 'react';

/**
 * 값의 변경을 지연시켜 debounce 처리하는 hook
 * @param {any} value - debounce 처리할 값
 * @param {number} delay - 지연 시간 (ms)
 * @returns {any} - debounced 값
 */
export const useDebounce = (value, delay = 500) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};
