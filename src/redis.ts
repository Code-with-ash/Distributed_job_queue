import Redis from "ioredis";

const REDIS_HOST = process.env.REDIS_HOST || "localhost";
const REDIS_PORT = Number(process.env.REDIS_PORT) || 6379;

// Subscriber instance — used by workers to listen for orders
export function createSubscriber() {
  const sub = new Redis({
    host: REDIS_HOST,
    port: REDIS_PORT,
  });

  sub.on("error", (err) => {
    console.error("Redis subscriber error:", err);
  });

  return sub;
}

const redis = new Redis({
  host: REDIS_HOST,
  port: REDIS_PORT,
});

redis.on("connect", () => {
  console.log(`Connected to Redis at ${REDIS_HOST}:${REDIS_PORT}`);
});

redis.on("error", (err) => {
  console.error("Redis connection error:", err);
});

export default redis;
