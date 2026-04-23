/**
 * Formats a number with a thousand separator and appends "ICA".
 * @param price The number to format.
 * @returns A formatted string.
 */
export const formatPrice = (price: number | null | undefined): string => {
  if (price === null || price === undefined) {
    return 'N/A';
  }
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(price) + ' ICA';
};

/**
 * Formats a number with a thousand separator.
 * @param amount The number to format.
 * @returns A formatted string.
 */
export const formatAmount = (amount: number | null | undefined): string => {
  if (amount === null || amount === undefined || amount < 0) {
    return '0';
  }
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
};