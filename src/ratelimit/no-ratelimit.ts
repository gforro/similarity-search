import { RateLimitHandler } from "./types";

export class NoRateLimit implements RateLimitHandler {
  calculateWaitTime(): number {
    return 0;
  }
  startRequest(): void {
    // do nothing
  }
  processResponse(): void {
    // do nothing
  }
}
