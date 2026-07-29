import express, { Request, Response } from "express";
import path from "path";
import { v4 as uuid } from "uuid";
import redis from "./redis";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "../public")));


// place a new order
app.post("/api/order", async (req: Request, res: Response) => {
  const { items } = req.body;
  if (!items || items.length === 0) {
    res.status(400).json({ error: "No items provided" });
    return;
  }

  const orderId = uuid().slice(0, 8); 

  // store the order in redis
  await redis.hset(`order:${orderId}`, {
    id: orderId,
    items: JSON.stringify(items),
    createdAt: new Date().toISOString(),
    email: "pending",
    analytics: "pending",
    inventory: "pending",
  });

  // keep track of all order ids
  await redis.lpush("allOrders", orderId);

  // publish so all workers pick it up
  await redis.publish("orders", orderId);

  res.status(202).json({ message: "Order placed", orderId });
});

// get all orders with their status
app.get("/api/orders", async (_req: Request, res: Response) => {
  const orderIds = await redis.lrange("allOrders", 0, 49); // last 50
  const orders = [];

  for (const id of orderIds) {
    const data = await redis.hgetall(`order:${id}`);
    if (data && data.id) {
      orders.push({
        ...data,
        items: JSON.parse(data.items || "[]"),
      });
    }
  }

  res.json(orders);
});

// get a single order
app.get("/api/order/:id", async (req: Request, res: Response) => {
  const data = await redis.hgetall(`order:${req.params.id}`);
  if (!data || !data.id) {
    res.status(404).json({ error: "Order not found" });
    return;
  }
  res.json({ ...data, items: JSON.parse(data.items || "[]") });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
