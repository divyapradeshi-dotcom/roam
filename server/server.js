const express = require("express");
const cors = require("cors");
const crypto = require("crypto");
const dotenv = require("dotenv");
const Razorpay = require("razorpay");

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
  console.error("FATAL: Missing RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET in server/.env");
  process.exit(1);
}

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "roam-payment-server",
    testMode: true,
    keyId: process.env.RAZORPAY_KEY_ID,
    timestamp: new Date().toISOString(),
  });
});

// POST /api/orders: Independent pricing validation and Razorpay order creation
app.post("/api/orders", async (req, res) => {
  try {
    const {
      staySlug,
      stayTitle,
      nights = 1,
      pricePerNight = 250,
      cleaningFee = 0,
      guestName = "Guest",
      guestEmail = "guest@roam.com",
    } = req.body;

    const parsedNights = Math.max(parseInt(nights, 10) || 1, 1);
    const parsedPrice = Math.max(parseFloat(pricePerNight) || 0, 0);
    const parsedCleaning = Math.max(parseFloat(cleaningFee) || 0, 0);

    // Calculate total amount from validated inputs
    const totalAmount = parsedPrice * parsedNights + parsedCleaning;
    if (totalAmount <= 0) {
      return res.status(400).json({ success: false, error: "Invalid booking amount." });
    }

    // Razorpay standard amounts are in smallest currency subunit (paise: ₹1 = 100 paise)
    const amountInPaise = Math.round(totalAmount * 100);

    const orderOptions = {
      amount: amountInPaise,
      currency: "INR",
      receipt: `rcpt_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      notes: {
        staySlug: String(staySlug || "unknown"),
        stayTitle: String(stayTitle || "Roam Stay"),
        nights: String(parsedNights),
        guestName: String(guestName),
        guestEmail: String(guestEmail),
      },
    };

    const order = await razorpay.orders.create(orderOptions);

    console.log(`[Order Created] ID: ${order.id} | Amount: ${order.amount} paise | Stay: ${staySlug}`);

    return res.json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error("[Create Order Error]", error);
    return res.status(500).json({
      success: false,
      error: error && error.message ? error.message : "Unable to create Razorpay test order.",
    });
  }
});

// POST /api/verify: Server-side cryptographic HMAC SHA-256 signature verification
app.post("/api/verify", (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        error: "Missing required payment verification parameters.",
      });
    }

    const payload = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(payload)
      .digest("hex");

    const isMatch = expectedSignature === razorpay_signature;

    if (!isMatch) {
      console.warn(`[Verification Failed] Signature mismatch for order: ${razorpay_order_id}`);
      return res.status(400).json({
        success: false,
        error: "Payment signature mismatch. Transaction cannot be verified.",
      });
    }

    console.log(`[Verification Success] Verified payment ${razorpay_payment_id} for order ${razorpay_order_id}`);

    return res.json({
      success: true,
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      verifiedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[Verify Payment Error]", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error verifying payment signature.",
    });
  }
});

// GET /checkout: Serves branded Razorpay Standard Checkout page for in-app browser
app.get("/checkout", (req, res) => {
  const {
    order_id = "",
    key_id = process.env.RAZORPAY_KEY_ID,
    amount = "0",
    currency = "INR",
    title = "Roam Stay",
    name = "Guest",
    email = "guest@roam.com",
  } = req.query;

  const displayAmount = (parseInt(amount, 10) / 100).toFixed(2);

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>Roam — Test Checkout</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@500;700;800&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Manrope', -apple-system, BlinkMacSystemFont, sans-serif;
      background: #F1F4F8;
      color: #111116;
      display: flex;
      flex-direction: column;
      align-items: center;
      justifyContent: center;
      min-height: 100vh;
      padding: 24px 16px;
    }
    .card {
      background: #FFFFFF;
      width: 100%;
      max-width: 420px;
      border-radius: 24px;
      padding: 28px 24px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.06);
      border: 1px solid #E5E7EB;
      text-align: center;
    }
    .logo {
      font-weight: 800;
      font-size: 32px;
      letter-spacing: -2px;
      margin-bottom: 6px;
      color: #111116;
    }
    .badge {
      display: inline-block;
      background: #FFE1A1;
      color: #7E5200;
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      padding: 4px 12px;
      border-radius: 12px;
      margin-bottom: 20px;
    }
    .title {
      font-size: 18px;
      font-weight: 800;
      color: #111116;
      margin-bottom: 6px;
    }
    .amount {
      font-size: 32px;
      font-weight: 800;
      color: #111116;
      margin: 14px 0;
    }
    .subtext {
      font-size: 13px;
      color: #68728B;
      line-height: 1.5;
      margin-bottom: 24px;
    }
    .btn {
      display: block;
      width: 100%;
      background: #FFC629;
      color: #111116;
      font-size: 15px;
      font-weight: 800;
      border: none;
      border-radius: 28px;
      padding: 16px;
      cursor: pointer;
      text-decoration: none;
      transition: opacity 0.2s;
    }
    .btn:active { opacity: 0.8; }
    .cancel-link {
      display: inline-block;
      margin-top: 16px;
      color: #85879A;
      font-size: 13px;
      font-weight: 600;
      text-decoration: none;
    }
  </style>
  <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
</head>
<body>
  <div class="card">
    <div class="logo">roam</div>
    <div class="badge">Test Mode Checkout</div>
    <div class="title">${title}</div>
    <div class="amount">₹${displayAmount}</div>
    <div class="subtext">
      Complete your test booking using any test UPI ID or test card in Razorpay Test Mode.
    </div>

    <button id="pay-btn" class="btn" onclick="openRazorpay()">Launch Payment Sheet</button>
    <a href="roam1://payment-callback?cancelled=true" class="cancel-link">Return to Roam without paying</a>
  </div>

  <script>
    const options = {
      key: "${key_id}",
      amount: "${amount}",
      currency: "${currency}",
      name: "Roam Stays (Test Mode)",
      description: "${title.replace(/"/g, '\\"')}",
      order_id: "${order_id}",
      prefill: {
        name: "${name.replace(/"/g, '\\"')}",
        email: "${email.replace(/"/g, '\\"')}",
      },
      theme: {
        color: "#FFC629"
      },
      handler: function (response) {
        const callbackUrl = "roam1://payment-callback?" +
          "razorpay_payment_id=" + encodeURIComponent(response.razorpay_payment_id) +
          "&razorpay_order_id=" + encodeURIComponent(response.razorpay_order_id) +
          "&razorpay_signature=" + encodeURIComponent(response.razorpay_signature);
        window.location.href = callbackUrl;
      },
      modal: {
        ondismiss: function () {
          window.location.href = "roam1://payment-callback?cancelled=true";
        }
      }
    };

    function openRazorpay() {
      const rzp = new Razorpay(options);
      rzp.on('payment.failed', function (response) {
        alert("Test payment failed: " + response.error.description);
      });
      rzp.open();
    }

    // Automatically trigger on page load
    window.onload = function() {
      setTimeout(openRazorpay, 300);
    };
  </script>
</body>
</html>`;

  res.send(html);
});

app.listen(port, "0.0.0.0", () => {
  console.log(`Roam Payment Server running on http://0.0.0.0:${port}`);
  console.log(`Local Access: http://localhost:${port}`);
  console.log(`Razorpay Test Key: ${process.env.RAZORPAY_KEY_ID}`);
});

