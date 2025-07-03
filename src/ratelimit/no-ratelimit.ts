export class NoRateLimit {
  calculateWaitTime(token: number): number {
    return 0;
  }
  startRequest(estimatedToken: number): void {
    // do nothing
  }
  updateLimits(responseHeaders: Headers): void {
    // do nothing
  }
}
