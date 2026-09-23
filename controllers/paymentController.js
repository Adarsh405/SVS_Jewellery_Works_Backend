const axios = require("axios");

const PHONEPE_BASE_URL = "https://api.phonepe.com/apis";

/*
|--------------------------------------------------------------------------
| Get PhonePe OAuth Access Token
|--------------------------------------------------------------------------
*/

const getPhonePeAccessToken = async () => {
  try {
    const params = new URLSearchParams();

    params.append("client_id", process.env.PHONEPE_CLIENT_ID);
    params.append(
      "client_version",
      process.env.PHONEPE_CLIENT_VERSION
    );
    params.append(
      "client_secret",
      process.env.PHONEPE_CLIENT_SECRET
    );
    params.append(
      "grant_type",
      "client_credentials"
    );

    const response = await axios.post(
      `${PHONEPE_BASE_URL}/identity-manager/v1/oauth/token`,
      params.toString(),
      {
        headers: {
          "Content-Type":
            "application/x-www-form-urlencoded",
        },
      }
    );

    return response.data.access_token;
  } catch (error) {
    console.error(
      "PhonePe authentication error:",
      error.response?.data || error.message
    );

    throw new Error("PhonePe authentication failed");
  }
};

/*
|--------------------------------------------------------------------------
| Create Payment
|--------------------------------------------------------------------------
*/

const createPayment = async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount) {
      return res.status(400).json({
        success: false,
        message: "Amount is required",
      });
    }

    const numericAmount = Number(amount);

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid amount",
      });
    }

    /*
     * PhonePe expects amount in paise.
     *
     * ₹100 = 10000 paise
     */

    const amountInPaise = Math.round(
      numericAmount * 100
    );

    /*
     * Generate unique merchant order ID
     */

    const merchantOrderId =
      `SVS_${Date.now()}_${Math.floor(
        Math.random() * 10000
      )}`;

    /*
     * Get OAuth token
     */

    const accessToken =
      await getPhonePeAccessToken();

    /*
     * Create PhonePe order
     */

    const paymentPayload = {
      merchantOrderId: merchantOrderId,

      amount: amountInPaise,

      paymentFlow: {
        type: "PG_CHECKOUT",

        merchantUrls: {
          redirectUrl:
            `${process.env.FRONTEND_URL}/payment?orderId=${merchantOrderId}`,
        },
      },
    };

    const response = await axios.post(
      `${PHONEPE_BASE_URL}/pg/checkout/v2/pay`,
      paymentPayload,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `O-Bearer ${accessToken}`,
        },
      }
    );

    const data = response.data;

    console.log(
      "PhonePe payment created:",
      data
    );

    /*
     * Return payment information to React
     */

    return res.status(200).json({
      success: true,

      orderId: merchantOrderId,

      amount: numericAmount,

      phonePeResponse: data,
    });

  } catch (error) {

    console.error(
      "Create payment error:",
      error.response?.data || error.message
    );

    return res.status(500).json({
      success: false,
      message: "Unable to create payment",
      error:
        error.response?.data ||
        error.message,
    });
  }
};

/*
|--------------------------------------------------------------------------
| Check Payment Status
|--------------------------------------------------------------------------
*/

const checkPaymentStatus = async (req, res) => {
  try {

    const { orderId } = req.params;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: "Order ID is required",
      });
    }

    /*
     * Get PhonePe token
     */

    const accessToken =
      await getPhonePeAccessToken();

    /*
     * Check order status
     */

    const response = await axios.get(
      `${PHONEPE_BASE_URL}/pg/checkout/v2/order/${orderId}/status`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `O-Bearer ${accessToken}`,
        },
      }
    );

    const data = response.data;

    console.log(
      "PhonePe payment status:",
      data
    );

    /*
     * Convert PhonePe response into a simple
     * response for your React frontend.
     */

    let status = "PENDING";

    if (
      data.state === "COMPLETED" ||
      data.status === "COMPLETED"
    ) {
      status = "SUCCESS";
    }

    if (
      data.state === "FAILED" ||
      data.status === "FAILED"
    ) {
      status = "FAILED";
    }

    /*
     * Get transaction information if available
     */

    const paymentDetails =
      data.paymentDetails?.[0];

    return res.status(200).json({

      success: true,

      orderId: orderId,

      status: status,

      amount:
        data.amount
          ? data.amount / 100
          : null,

      transactionId:
        paymentDetails?.transactionId ||
        paymentDetails?.transactionReferenceId ||
        null,

      phonePeResponse: data,
    });

  } catch (error) {

    console.error(
      "Payment status error:",
      error.response?.data ||
        error.message
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to check payment status",
      error:
        error.response?.data ||
        error.message,
    });
  }
};

module.exports = {
  createPayment,
  checkPaymentStatus,
};