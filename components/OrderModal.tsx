import { WHATSAPP_NUMBER } from "@/lib/config";

export default function OrderModal({
  cart,
  totalAmount,
  onClose,
  onClearCart,
  onRemoveItem,
}: {
  cart: any;
  totalAmount: number;
  onClose: () => void;
  onClearCart: () => void;
  onRemoveItem: (productId: string) => void;
}) {
  const message = encodeURIComponent(
    `Hello, I would like to place an order:\n\n` +
      Object.values(cart)
        .map(
          (item: any) =>
            `${item.name} × ${item.quantity} = ₹${item.price * item.quantity}`
        )
        .join("\n") +
      `\n\nTotal: ₹${totalAmount}`
  );
  const isCartEmpty = Object.keys(cart).length === 0;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
      <div
        className="bg-white rounded-xl p-6 w-full max-w-md
                max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Order Summary</h2>
          <button
            onClick={onClose}
            className="text-gray-700 hover:text-gray-900 text-xl leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Items */}
        <div className="border-t border-b border-gray-300 py-3 mb-4">
          <ul className="space-y-3 text-sm">
            {Object.values(cart).map((item: any) => (
              <li key={item.id} className="flex justify-between items-start">
                <div>
                  <p className="font-medium text-gray-900">
                    {item.name} × {item.quantity}
                  </p>
                  <p className="text-gray-700 text-xs">₹{item.price} each</p>
                </div>

                <div className="flex items-center gap-3">
                  <span className="font-semibold text-gray-900">
                    ₹{item.price * item.quantity}
                  </span>

                  <button
                    onClick={() => onRemoveItem(item.id)}
                    className="text-red-500 font-bold text-lg"
                    aria-label="Remove item"
                  >
                    ×
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Total */}
        <div className="flex justify-between font-semibold text-gray-900 mb-4">
          <span>Total</span>
          <span>₹{totalAmount}</span>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <button
            onClick={onClearCart}
            className="border border-red-500 text-red-600 rounded-lg py-2"
          >
            Clear Cart
          </button>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 border rounded-lg py-2 text-gray-700 hover:text-gray-900"
            >
              Continue Shopping
            </button>

            {!isCartEmpty ? (
              <a
                href={`https://wa.me/${WHATSAPP_NUMBER}?text=${message}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 bg-green-600 text-white text-center py-2 rounded-lg"
              >
                Order on WhatsApp
              </a>
            ) : (
              <button
                disabled
                className="flex-1 bg-gray-300 text-gray-500 py-2 rounded-lg cursor-not-allowed"
              >
                Order on WhatsApp
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
