import { Request, Response, NextFunction } from "express";

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const startTime = Date.now();
  const method = req.method;
  const url = req.originalUrl || req.url;

  res.on("finish", () => {
    const duration = Date.now() - startTime;
    const statusCode = res.statusCode;
    const statusEmoji = statusCode >= 500 ? "💥" : statusCode >= 400 ? "⚠️" : "✨";

    console.log(
      `${statusEmoji} [${method}] ${url} -> ${statusCode} (${duration}ms)`
    );
  });

  next();
}
