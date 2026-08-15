import Razorpay from "razorpay";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

async function test() {
  try {
    const options = {
      amount: 100,
      currency: "INR",
      receipt: `rcpt_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);
    console.log("Success:", order);
  } catch (error) {
    console.error("Error creating Razorpay order:", error);
  }
}

test();
