import { useState, useEffect } from 'react';

/**
 * Hook personalizado para debounce
 * Retrasa la actualización de un valor hasta que el usuario deje de escribir
 * 
 * @param {any} value - El valor a hacer debounce
 * @param {number} delay - Tiempo de espera en milisegundos (default: 500ms)
 * @returns {any} - El valor con debounce aplicado
 */
export function useDebounce(value, delay = 500) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    // Establecer un timeout para actualizar el valor después del delay
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Limpiar el timeout si el valor cambia antes de que se cumpla el delay
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default useDebounce;
