// Simple in-memory rate limiter (use Redis in production)
const requests = new Map<string, number[]>();

export function rateLimit(ip: string, maxRequests = 10, windowMs = 60_000): boolean {
  const now = Date.now();
  const windowStart = now - windowMs;
  
  const userRequests = (requests.get(ip) || []).filter((t) => t > windowStart);
  
  if (userRequests.length >= maxRequests) return false;
  
  userRequests.push(now);
  requests.set(ip, userRequests);
  
  // Cleanup old entries every 100 calls
  if (Math.random() < 0.01) {
    for (const [key, times] of Array.from(requests.entries())) {
      if (times.every((t) => t <= windowStart)) requests.delete(key);
    }
  }
  
  return true;
}

export function getClientIp(req: Request): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0] ||
    req.headers.get('x-real-ip') ||
    'unknown'
  );
}
