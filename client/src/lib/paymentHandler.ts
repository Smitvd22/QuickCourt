import axios from "axios";

interface PaymentVerificationResponse {
  success: boolean;
  status: string;
  amount: number;
  currency: string;
  metadata: unknown;
  message?: string;
}

export const handlePaymentSuccess = async (): Promise<boolean> => {
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const paymentIntentId = urlParams.get("payment_intent");

    if (!paymentIntentId) {
      console.error("No payment intent ID found in URL");
      return false;
    }

    const token = localStorage.getItem("quickcourt_token");
    const response = await axios.post<PaymentVerificationResponse>(
      "/api/confirm-payment",
      { paymentIntentId },
      {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      }
    );

    if (response.data.success && response.data.status === "succeeded") {
      console.log("Payment verification successful:", response.data);
      return true;
    }

    console.error("Payment verification failed:", response.data);
    return false;
  } catch (error: any) {
    console.error("Error processing payment success:", error?.message || error);
    return false;
  }
};
