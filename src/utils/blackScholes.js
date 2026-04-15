// Cumulative normal distribution via rational approximation (Abramowitz & Stegun)
function cnd(x) {
  if (x < -10) return 0;
  if (x > 10) return 1;
  const a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741;
  const a4 = -1.453152027, a5 = 1.061405429, p = 0.3275911;
  const sign = x < 0 ? -1 : 1;
  const t = 1 / (1 + p * Math.abs(x) / Math.SQRT2);
  const poly = t * (a1 + t * (a2 + t * (a3 + t * (a4 + t * a5))));
  const erf = 1 - poly * Math.exp(-(x * x) / 2);
  return 0.5 * (1 + sign * erf);
}

/**
 * Black-Scholes European option price.
 * @param {number} S   - Current stock price
 * @param {number} K   - Strike price
 * @param {number} T   - Time to expiration in years (e.g. 30/365)
 * @param {number} r   - Risk-free rate (e.g. 0.045)
 * @param {number} sigma - Implied volatility as decimal (e.g. 0.50 for 50%)
 * @param {string} type  - "call" or "put"
 * @returns {number} Option price per share
 */
export function bsPrice(S, K, T, r, sigma, type) {
  if (T <= 0 || sigma <= 0 || S <= 0 || K <= 0) {
    // At or past expiry: intrinsic value only
    if (type === 'call') return Math.max(0, S - K);
    return Math.max(0, K - S);
  }
  const sqrtT = Math.sqrt(T);
  const d1 = (Math.log(S / K) + (r + (sigma * sigma) / 2) * T) / (sigma * sqrtT);
  const d2 = d1 - sigma * sqrtT;
  if (type === 'call') {
    return S * cnd(d1) - K * Math.exp(-r * T) * cnd(d2);
  }
  return K * Math.exp(-r * T) * cnd(-d2) - S * cnd(-d1);
}
