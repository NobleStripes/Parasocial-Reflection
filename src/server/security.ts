import type { Express, Request, Response, NextFunction } from "express";
import cors from "cors";

export interface SecurityConfig {
  corsAllowedOrigins: string[] | null;
  rateLimitWindowMs: number;
  rateLimitMaxRequests: number;
  enableHsts: boolean;
  maxTranscriptChars: number;
  maxNotesChars: number;
}

interface RateLimitEntry {
  count: number;
  windowStart: number;
}

export function getSecurityConfig(): SecurityConfig {
  const rawOrigins = process.env.CORS_ALLOWED_ORIGINS?.trim();

  return {
    corsAllowedOrigins: rawOrigins ? rawOrigins.split(",").map((origin) => origin.trim()).filter(Boolean) : null,
    rateLimitWindowMs: Number(process.env.API_RATE_LIMIT_WINDOW_MS || 60_000),
    rateLimitMaxRequests: Number(process.env.API_RATE_LIMIT_MAX || 120),
    enableHsts: (process.env.ENABLE_HSTS || "true").toLowerCase() === "true",
    maxTranscriptChars: Number(process.env.MAX_TRANSCRIPT_CHARS || 50_000),
    maxNotesChars: Number(process.env.MAX_NOTES_CHARS || 2_000),
  };
}

export function applyCors(app: Express, config: SecurityConfig): void {
  if (!config.corsAllowedOrigins || config.corsAllowedOrigins.length === 0) {
    app.use(cors());
    return;
  }

  app.use(
    cors({
      origin(origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
        if (!origin || config.corsAllowedOrigins?.includes(origin)) {
          callback(null, true);
          return;
        }

        callback(new Error("Origin not allowed by CORS policy"));
      },
    })
  );
}

export function applySecurityHeaders(app: Express, config: SecurityConfig): void {
  app.use((req: Request, res: Response, next: NextFunction) => {
    const isProduction = process.env.NODE_ENV === "production";
    const contentSecurityPolicy = isProduction
      ? "default-src 'self'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; img-src 'self' data: https:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; script-src 'self'; connect-src 'self'"
      : "default-src 'self'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; img-src 'self' data: https:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; script-src 'self' 'unsafe-inline'; connect-src 'self' ws: wss:";

    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("Referrer-Policy", "no-referrer");
    res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
    res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
    res.setHeader("Cross-Origin-Resource-Policy", "same-origin");
    res.setHeader("Content-Security-Policy", contentSecurityPolicy);

    if (config.enableHsts && isProduction) {
      res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
    }

    next();
  });
}

export function createRateLimiter(config: SecurityConfig) {
  const buckets = new Map<string, RateLimitEntry>();

  return (req: Request, res: Response, next: NextFunction) => {
    const key = req.ip || req.socket.remoteAddress || "unknown";
    const now = Date.now();
    const current = buckets.get(key);

    if (!current || now - current.windowStart >= config.rateLimitWindowMs) {
      buckets.set(key, { count: 1, windowStart: now });
      next();
      return;
    }

    if (current.count >= config.rateLimitMaxRequests) {
      res.status(429).json({ error: "Rate limit exceeded" });
      return;
    }

    current.count += 1;
    buckets.set(key, current);
    next();
  };
}
