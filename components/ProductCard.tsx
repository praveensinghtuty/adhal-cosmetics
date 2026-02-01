type Product = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  tags: string[];
};

export default function ProductCard({
  product,
  quantity,
  onQuantityChange,
}: {
  product: Product;
  quantity: number;
  onQuantityChange: (product: Product, quantity: number) => void;
}) {
  return (
    <div
      className="h-full bg-white border border-gray-300 rounded-xl p-4
             shadow-sm transition
             hover:shadow-xl hover:-translate-y-1"
    >
      {/* Image */}
      <div className="h-48 rounded-lg mb-4 overflow-hidden bg-gray-100">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            No image
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="mb-4">
        <h2 className="font-semibold text-gray-900 text-[15px] leading-snug">
          {product.name}
        </h2>

        <p className="text-rose-600 font-semibold text-lg mt-1">
          ₹{product.price}
        </p>
      </div>

      {/* Spacer pushes controls to bottom */}
      <div className="mt-auto pt-4">
        {/* Quantity Controls */}
        <div
          className="flex items-center justify-between
                border border-gray-300 rounded-lg
                px-3 py-2 bg-white shadow-sm"
        >
          <button
            onClick={() => onQuantityChange(product, quantity - 1)}
            className="w-10 h-10 sm:w-9 sm:h-9
            flex items-center justify-center
            rounded-full border border-gray-300
            text-gray-700 text-lg
            hover:bg-gray-100 active:scale-95"
            aria-label="Decrease quantity"
            disabled={quantity === 0}
          >
            −
          </button>

          <span className="font-semibold text-gray-900 text-base">
            {quantity}
          </span>

          <button
            onClick={() => onQuantityChange(product, quantity + 1)}
            className="w-10 h-10 sm:w-9 sm:h-9
            flex items-center justify-center
            rounded-full border border-gray-300
            text-gray-700 text-lg
            hover:bg-gray-100 active:scale-95"
            aria-label="Increase quantity"
          >
            +
          </button>
        </div>
      </div>
    </div>
  );
}
