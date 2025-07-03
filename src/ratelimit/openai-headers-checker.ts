import { parseNumber } from "../helpers";
import { RateLimitHandler } from "./types";

export class OpenAIHeadersChecker implements RateLimitHandler {
  private requestsLimit: number | undefined;
  private requestsRemaining: number | undefined;
  private requestsResetMs: number | undefined;
  private tokensLimit: number | undefined;
  private tokensRemaining: number | undefined;
  private tokensResetMs: number | undefined;
  private lastUpdated: number | undefined;

  private pendingRequests: number = 0;
  private pendingTokensEstimate: number = 0;

  calculateWaitTime(estimatedTokens: number): number {
    if (!this.lastUpdated) {
      return 0; // No rate limit info yet
    }

    const now = Date.now();
    let waitTime = 0;

    // Check if we're out of requests (accounting for pending requests)
    if (typeof this.requestsRemaining === "number") {
      const effectiveRequestsRemaining =
        this.requestsRemaining - this.pendingRequests;
      if (
        effectiveRequestsRemaining <= 0 &&
        typeof this.requestsResetMs === "number"
      ) {
        const requestsWait = Math.max(0, this.requestsResetMs - now);
        waitTime = Math.max(waitTime, requestsWait);
      }
    }

    // Check if we're out of tokens (accounting for pending token estimates)
    if (typeof this.tokensRemaining === "number") {
      const effectiveTokensRemaining =
        this.tokensRemaining - this.pendingTokensEstimate;
      if (
        effectiveTokensRemaining < estimatedTokens &&
        typeof this.tokensResetMs === "number"
      ) {
        const tokensWait = Math.max(0, this.tokensResetMs - now);
        waitTime = Math.max(waitTime, tokensWait);
      }
    }

    // Add a small buffer to avoid edge cases
    return waitTime > 0 ? waitTime + 100 : 0;
  }

  startRequest(estimatedToken: number): void {
    this.pendingRequests++;
    this.pendingTokensEstimate += estimatedToken;
  }

  processResponse(responseHeaders: Headers, estimatedToken: number): void {
    const now = Date.now();

    this.pendingRequests--;
    this.pendingTokensEstimate -= estimatedToken;
    // Parse reset times from duration format (e.g., "12ms", "5s", "23h47m36.648s")
    const requestsResetMs = parseDuration(
      responseHeaders.get("x-ratelimit-reset-requests")
    );
    const tokensResetMs = parseDuration(
      responseHeaders.get("x-ratelimit-reset-tokens")
    );

    // Update rate limits from response header
    this.requestsLimit = parseNumber(
      responseHeaders.get("x-ratelimit-limit-requests")
    );
    this.requestsRemaining = parseNumber(
      responseHeaders.get("x-ratelimit-remaining-requests")
    );
    this.requestsResetMs =
      typeof requestsResetMs === "number" ? now + requestsResetMs : undefined;
    this.tokensLimit = parseNumber(
      responseHeaders.get("x-ratelimit-limit-tokens")
    );
    this.tokensRemaining = parseNumber(
      responseHeaders.get("x-ratelimit-remaining-tokens")
    );
    this.tokensResetMs = tokensResetMs ? now + tokensResetMs : undefined;
    this.lastUpdated = now;
  }

  toString() {
    const now = Date.now();
    return `requestsLimit=${this.requestsRemaining}/${
      this.requestsLimit
    }, tokensLimit=${this.tokensRemaining}/${this.tokensLimit},
 requestResetMs=${
   this.requestsResetMs ? this.requestsResetMs - now : "-"
 }, tokensResetMs=${this.tokensResetMs ? this.tokensResetMs - now : "-"}`;
  }
}

export function parseDuration(durationStr: string | null): number | undefined {
  if (!durationStr) {
    return undefined;
  }

  let totalMs = 0;

  // Handle hours
  const hoursMatch = durationStr.match(/(\d+(?:\.\d+)?)h/);
  if (hoursMatch && hoursMatch[1]) {
    totalMs += parseFloat(hoursMatch[1]) * 60 * 60 * 1000;
  }

  // Handle minutes
  const minutesMatch = durationStr.match(/(\d+(?:\.\d+)?)m(?!s)/);
  if (minutesMatch && minutesMatch[1]) {
    totalMs += parseFloat(minutesMatch[1]) * 60 * 1000;
  }

  // Handle seconds
  const secondsMatch = durationStr.match(/(\d+(?:\.\d+)?)s/);
  if (secondsMatch && secondsMatch[1]) {
    totalMs += parseFloat(secondsMatch[1]) * 1000;
  }

  // Handle milliseconds
  const msMatch = durationStr.match(/(\d+(?:\.\d+)?)ms/);
  if (msMatch && msMatch[1]) {
    totalMs += parseFloat(msMatch[1]);
  }

  return Math.ceil(totalMs);
}
