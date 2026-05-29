const axios = require("axios");

const PAYSTACK_BASE_URL = "https://api.paystack.co";

const paystackAPI = axios.create({
  baseURL: PAYSTACK_BASE_URL,
  headers: {
    Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
    "Content-Type": "application/json",
  },
});

// Verify a transaction
const verifyTransaction = async (reference) => {
  try {
    const response = await paystackAPI.get(`/transaction/verify/${reference}`);
    return response.data;
  } catch (error) {
    const payload = error.response?.data || null;
    const status = error.response?.status || null;

    console.error(
      "Paystack verification error:",
      payload || error.message,
      "status:",
      status
    );

    // Throw with details so orderController/errorHandler can return useful info
    const err = new Error(payload?.message || "Payment verification failed");
    err.status = status;
    err.payload = payload;
    throw err;
  }
};

module.exports = { verifyTransaction };