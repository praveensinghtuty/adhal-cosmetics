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
    <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-end sm:items-center justify-center">
      {/* Modal */}
      <div className="w-full sm:max-w-md bg-[#faf9f6] rounded-t-2xl sm:rounded-2xl p-5 max-h-[85vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-lg font-serif text-gray-900">Your Order</h2>
          <button
            onClick={onClose}
            className="text-gray-500 text-xl"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Items */}
        <div className="space-y-3 mb-5">
          {Object.values(cart).map((item: any) => (
            <div
              key={item.id}
              className="bg-white rounded-xl px-4 py-3 flex justify-between items-center shadow-sm"
            >
              <div>
                <p className="text-sm font-medium text-gray-900">{item.name}</p>
                <p className="text-xs text-gray-500">
                  ₹{item.price} × {item.quantity}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-gray-900">
                  ₹{item.price * item.quantity}
                </span>

                <button
                  onClick={() => onRemoveItem(item.id)}
                  className="text-xs text-gray-400 hover:text-red-500"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Total */}
        <div className="flex justify-between items-center mb-6 px-1">
          <span className="text-sm text-gray-600">Total</span>
          <span className="text-lg font-semibold text-gray-900">
            ₹{totalAmount}
          </span>
        </div>

        {/* Primary CTA */}
        {!isCartEmpty ? (
          <a
            href={`https://wa.me/${WHATSAPP_NUMBER}?text=${message}`}
            target="_blank"
            rel="noopener noreferrer"
            className="
              block w-full text-center
              bg-[#6b7d3a]
              text-white
              py-3
              rounded-full
              font-medium
              shadow-sm
              active:scale-[0.98]
            "
          >
            Order on WhatsApp
          </a>
        ) : (
          <button
            disabled
            className="
              w-full
              bg-gray-300
              text-gray-500
              py-3
              rounded-full
              cursor-not-allowed
            "
          >
            Order on WhatsApp
          </button>
        )}

        {/* Secondary Actions */}
        <div className="flex gap-3 mt-4">
          <button
            onClick={onClose}
            className="
              flex-1
              border border-gray-300
              rounded-full
              py-2
              text-sm
              text-gray-700
            "
          >
            Continue
          </button>

          <button
            onClick={onClearCart}
            className="
              flex-1
              text-sm
              text-gray-400
            "
          >
            Clear
          </button>
        </div>
      </div>
    </div>
  );
}
