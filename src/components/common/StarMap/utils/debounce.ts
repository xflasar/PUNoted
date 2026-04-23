/**
 * Debounces a function, ensuring it is only executed once after a specified
 * delay since the last time it was called.
 *
 * @template F The type of the function to debounce.
 * @param func The function to debounce.
 * @param waitFor The delay in milliseconds to wait before executing the function.
 * @returns A debounced version of the function, which also includes a .cancel() method.
 */
export function debounce<F extends (...args: any[]) => any>(
  func: F,
  waitFor: number,
): F & { cancel: () => void } {
  // Use ReturnType<typeof setTimeout> to correctly type the timer ID (number in browser, Timeout in Node)
  let timeout: ReturnType<typeof setTimeout> | undefined;

  const debounced = function (this: ThisParameterType<F>, ...args: Parameters<F>) {
    // 1. Clear the previous timer (resetting the delay)
    if (timeout) {
      clearTimeout(timeout);
    }
    
    // 2. Set a new timer
    timeout = setTimeout(() => {
      // Execute the function with the correct 'this' context and arguments
      func.apply(this, args);
      // Clean up the timeout reference after execution
      timeout = undefined;
    }, waitFor);
  } as F & { cancel: () => void };

  /**
   * Immediately cancels any pending execution of the debounced function.
   */
  debounced.cancel = () => {
    if (timeout) {
      clearTimeout(timeout);
      timeout = undefined;
    }
  };

  return debounced;
}