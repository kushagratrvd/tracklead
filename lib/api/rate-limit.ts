import { NextRequest } from "next/server";
import { apiError } from "./response";

// Sliding window in-memory store
// Note: In production with distributed serverless functions on Vercel, replace with Redis / Upstash KV
interface RateLimitRecord {
  timestamps: number[];
}

const ipStore = new Map<string, RateLimitRecord>();

// Cleanup stale records periodically
setInterval(() => {
  const now = Date.now();
  const windowMs = 60 * 1000;
  for (const [ip, record] of ipStore.entries()) {
    const validTimestamps = record.timestamps.filter((t) => now - t < windowMs);
    if (validTimestamps.length === 0) {
      ipStore.delete(ip);
    } else {
      record.timestamps = validTimestamps;
    }
  }
}, 60 * 1000);

export function checkRateLimit(
  req: NextRequest,
  limit = 5,
  windowMs = 60 * 1000
) {
  // Extract client IP address
  const forwardedFor = req.headers.get("x-forwarded-for");
  const realIp = req.headers.get("x-real-ip");
  const ip = forwardedFor ? forwardedFor.split(",")[0].trim() : realIp || "127.0.0.1";

  const now = Date.now();
  const record = ipStore.get(ip) || { timestamps: [] };

  // Filter timestamps within current sliding window
  const timestampsInWindow = record.timestamps.filter((t) => now - t < windowMs);

  if (timestampsInWindow.length >= limit) {
    const retryAfter = Math.ceil(
      (timestampsInWindow[0] + windowMs - now) / 1000
    );
    const response = apiError(
      "Too many lead submission attempts. Please wait before trying again.",
      "RATE_LIMIT_EXCEEDED",
      429,
      { retryAfterSeconds: retryAfter }
    );
    response.headers.set("Retry-After", String(retryAfter));
    return response;
  }

  // Record this request
  timestampsInWindow.push(now);
  ipStore.set(ip, { timestamps: timestampsInWindow });
  return null;
}
