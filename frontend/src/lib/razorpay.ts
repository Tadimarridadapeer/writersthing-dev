export const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => {
      resolve(true);
    };
    script.onerror = () => {
      resolve(false);
    };
    document.body.appendChild(script);
  });
};

interface RazorpayCheckoutOptions {
  orderId: string;
  amount: number;
  currency?: string;
  name?: string;
  description?: string;
  image?: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  theme?: {
    color?: string;
  };
  onSuccess: (response: unknown) => void;
  onError: (error: unknown) => void;
  onDismiss?: () => void;
}

export const openRazorpayCheckout = async (options: RazorpayCheckoutOptions) => {
  const res = await loadRazorpayScript();

  if (!res) {
    options.onError(new Error("Razorpay SDK failed to load. Are you online?"));
    return;
  }

  const rzpOptions = {
    key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID, // Enter the Key ID generated from the Dashboard
    amount: options.amount,
    currency: options.currency || "INR",
    name: options.name || "Writer's Thing",
    description: options.description || "Payment Transaction",
    image: options.image || "/logo.png", // Add your logo here
    order_id: options.orderId,
    handler: function (response: unknown) {
      options.onSuccess(response);
    },
    prefill: {
      name: options.prefill?.name,
      email: options.prefill?.email,
      contact: options.prefill?.contact,
    },
    theme: {
      color: options.theme?.color || "#3399cc",
    },
    modal: {
      ondismiss: function () {
        if (options.onDismiss) {
          options.onDismiss();
        }
      },
    },
  };

  // @ts-expect-error Razorpay SDK types are not available
  const paymentObject = new window.Razorpay(rzpOptions);
  paymentObject.on("payment.failed", function (response: { error: unknown }) {
    options.onError(response.error);
  });
  
  paymentObject.open();
};
