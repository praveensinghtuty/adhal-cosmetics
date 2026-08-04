export type SaleFields = {
  sale_name: string | null;
  discount_percentage: number | null;
};

export const hasSale = (product: SaleFields) =>
  Boolean(product.sale_name?.trim()) &&
  Number(product.discount_percentage) > 0 &&
  Number(product.discount_percentage) < 100;

export const getSalePrice = (price: number, discountPercentage: number | null) =>
  Math.round(price * (1 - Number(discountPercentage || 0) / 100) * 100) / 100;

export const formatPrice = (price: number) =>
  new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 }).format(price);
