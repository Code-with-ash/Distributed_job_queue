import { createSubscriber } from "../redis";
import redis from "../redis";

const subscriber = createSubscriber();

async function startEmailService() {
  await subscriber.subscribe("orders");
  console.log("[EmailService] Listening for orders...");

  subscriber.on("message", async (_channel, orderId) => {
    // mark as processing
    await redis.hset(`order:${orderId}`, "email", "processing");
    console.log(`[EmailService] Sending email for order ${orderId}...`);

    // simulate sending email
    setTimeout(async () => {
      await redis.hset(`order:${orderId}`, "email", "done");
      console.log(`[EmailService] Email sent for order ${orderId}`);
    }, 3000);
  });
}

startEmailService();
