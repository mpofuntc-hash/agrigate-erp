export function formatCurrency(amount: number, currency = "ZAR"): string {
  return new Intl.NumberFormat("en-ZA", { style: "currency", currency }).format(amount);
}

export function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat("en-ZA").format(new Date(dateString));
}

export function formatNumber(value: number, decimals = 2): string {
  return value.toFixed(decimals);
}

export function generateReference(prefix: string): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  return `${prefix}-${timestamp}`;
}
