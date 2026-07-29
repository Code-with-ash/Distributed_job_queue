import { createSubscriber } from "../redis";
import redis from "../redis";

const subscriber = createSubscriber();

async function startAnalyticService() {
  await subscriber.subscribe("orders");
  console.log("[AnalyticService] Listening for orders...");

  subscriber.on("message", async (_channel, orderId) => {
    await redis.hset(`order:${orderId}`, "analytics", "processing");
    console.log(`[AnalyticService] Processing analytics for order ${orderId}...`);

    setTimeout(async () => {
      await redis.hset(`order:${orderId}`, "analytics", "done");
      console.log(`[AnalyticService] Analytics recorded for order ${orderId}`);
    }, 5000);
  });
}

startAnalyticService();
