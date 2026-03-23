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
      className="
        h-full flex flex-col
        bg-white rounded-2xl p-3
        border border-gray-100
        shadow-sm
        transition
        active:scale-[0.98]
      "
    >
      {/* Image */}
      <div className="h-44 rounded-xl mb-3 overflow-hidden bg-[#f5f4ef]">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
            No image
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="flex-1">
        <h2 className="text-[15px] leading-snug text-gray-900 font-medium">
          {product.name}
        </h2>

        {/* Description */}
        {product.description && (
          <p className="text-[12.5px] text-gray-500 mt-1 line-clamp-2">
            {product.description}
          </p>
        )}

        <p className="text-[#6b7d3a] font-semibold text-lg mt-2">
          ₹{product.price}
        </p>
      </div>

      {/* Controls */}
      <div className="mt-3">
        {quantity === 0 ? (
          <button
            onClick={() => onQuantityChange(product, 1)}
            className="
              w-full
              bg-[#6b7d3a]
              text-white
              py-2
              rounded-full
              text-sm
              font-medium
              shadow-sm
              active:scale-[0.98]
            "
          >
            Add
          </button>
        ) : (
          <div
            className="
              flex items-center justify-between
              bg-[#f5f4ef]
              rounded-full
              px-2 py-1
            "
          >
            <button
              onClick={() => onQuantityChange(product, quantity - 1)}
              className="
                w-8 h-8
                flex items-center justify-center
                rounded-full
                bg-white
                text-gray-700
                text-lg
                shadow-sm
                active:scale-90
              "
              aria-label="Decrease quantity"
            >
              −
            </button>

            <span className="text-sm font-semibold text-gray-900">
              {quantity}
            </span>

            <button
              onClick={() => onQuantityChange(product, quantity + 1)}
              className="
                w-8 h-8
                flex items-center justify-center
                rounded-full
                bg-white
                text-gray-700
                text-lg
                shadow-sm
                active:scale-90
              "
              aria-label="Increase quantity"
            >
              +
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
