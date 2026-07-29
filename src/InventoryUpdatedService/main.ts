import { createSubscriber } from "../redis";
import redis from "../redis";

const subscriber = createSubscriber();

async function startInventoryService() {
  await subscriber.subscribe("orders");
  console.log("[InventoryService] Listening for orders...");

  subscriber.on("message", async (_channel, orderId) => {
    await redis.hset(`order:${orderId}`, "inventory", "processing");
    console.log(`[InventoryService] Updating inventory for order ${orderId}...`);

    setTimeout(async () => {
      await redis.hset(`order:${orderId}`, "inventory", "done");
      console.log(`[InventoryService] Inventory updated for order ${orderId}`);
    }, 4000);
  });
}

startInventoryService();
