export interface RateLimitHandler {
  calculateWaitTime(token: number): number;
  startRequest(estimatedToken: number): void;
  processResponse(responseHeaders: Headers, estimatedToken: number): void;
}
