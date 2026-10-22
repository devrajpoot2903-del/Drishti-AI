import IORedis from "ioredis";

export const redis = new IORedis(
  process.env.REDIS_URL ?? "redis://localhost:6379",
  {
    maxRetriesPerRequest: null,
    enableReadyCheck: true,
    lazyConnect: true,
  }
);

redis.on("error", (error) => {
  // Log error without crashing process in environments where Redis is not active
  console.warn("[Redis] Connection error:", error.message);
});

redis.on("connect", () => {
  console.log("[Redis] Connected to Redis server successfully");
});
