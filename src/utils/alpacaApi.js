const DATA_BASE = 'https://data.alpaca.markets';

function authHeaders() {
  return {
    'APCA-API-KEY-ID': import.meta.env.VITE_ALPACA_KEY,
    'APCA-API-SECRET-KEY': import.meta.env.VITE_ALPACA_SECRET,
  };
}

async function apiFetch(url) {
  const res = await fetch(url, { headers: authHeaders() });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status}: ${text}`);
  }
  return res.json();
}

// Parse strike from OCC symbol: TSLA250620C00350000 → 350
function parseStrikeFromOCC(occSymbol, underlying) {
  const strikeStr = occSymbol.slice(underlying.length + 7); // skip underlying+YYMMDD+C/P
  return parseInt(strikeStr, 10) / 1000;
}

// Parse expiry from OCC symbol: TSLA250620C00350000 → "2025-06-20"
function parseExpiryFromOCC(occSymbol, underlying) {
  const rest = occSymbol.slice(underlying.length); // "250620C00350000"
  return `20${rest.slice(0, 2)}-${rest.slice(2, 4)}-${rest.slice(4, 6)}`;
}

// Latest trade price for a stock (no feed param → free IEX tier works)
async function fetchStockPrice(symbol) {
  const url = `${DATA_BASE}/v2/stocks/${encodeURIComponent(symbol)}/trades/latest`;
  const data = await apiFetch(url);
  const price = data.trade?.p;
  if (price == null) throw new Error('无法解析股价响应');
  return price;
}

// IV + Greeks for a specific option leg
async function fetchOptionSnapshot(symbol, type, strike, expiry) {
  // Use ±14 day window: options expire on specific Fridays, the user's date
  // may not be an exact expiration date.
  const expiryMs = new Date(expiry + 'T00:00:00Z').getTime();
  const gte = new Date(expiryMs - 14 * 86400000).toISOString().slice(0, 10);
  const lte = new Date(expiryMs + 14 * 86400000).toISOString().slice(0, 10);

  const params = new URLSearchParams({
    type,
    expiration_date_gte: gte,
    expiration_date_lte: lte,
    strike_price_gte: (strike * 0.95).toFixed(2),
    strike_price_lte: (strike * 1.05).toFixed(2),
    limit: 20,
  });
  const url = `${DATA_BASE}/v1beta1/options/snapshots/${encodeURIComponent(symbol)}?${params}`;
  const data = await apiFetch(url);
  const snapshots = data.snapshots;
  if (!snapshots || Object.keys(snapshots).length === 0) return null;

  // Pick contract closest to target strike+expiry using a combined score
  let best = null;
  let bestScore = Infinity;
  for (const [key, snap] of Object.entries(snapshots)) {
    const s = parseStrikeFromOCC(key, symbol);
    const expMs = new Date(parseExpiryFromOCC(key, symbol) + 'T00:00:00Z').getTime();
    const strikeDiff = Math.abs(s - strike) / strike;          // normalised
    const expiryDiff = Math.abs(expMs - expiryMs) / 86400000 / 30; // normalised by 30 days
    const score = strikeDiff + expiryDiff;
    if (score < bestScore) { bestScore = score; best = snap; }
  }

  if (!best) return null;
  // greeks can be null outside market hours — still return IV if available
  const g = best.greeks ?? {};
  return {
    iv:    best.impliedVolatility != null ? best.impliedVolatility * 100 : null,
    delta: g.delta ?? null,
    gamma: g.gamma ?? null,
    theta: g.theta ?? null,
    vega:  g.vega  ?? null,
  };
}

// 30-day historical volatility (annualised %) from daily bars
async function fetchHistoricalVolatility(symbol, days = 30) {
  const params = new URLSearchParams({
    timeframe: '1Day',
    limit: days + 1,
    sort: 'desc',
    adjustment: 'raw',
  });
  const url = `${DATA_BASE}/v2/stocks/${encodeURIComponent(symbol)}/bars?${params}`;
  const data = await apiFetch(url);
  const bars = data.bars;
  if (!bars || bars.length < 2) return null;

  // bars are newest-first; compute log returns
  const closes = bars.map(b => b.c);
  const logReturns = [];
  for (let i = 0; i < closes.length - 1; i++) {
    logReturns.push(Math.log(closes[i] / closes[i + 1]));
  }
  const mean = logReturns.reduce((a, b) => a + b, 0) / logReturns.length;
  const variance = logReturns.reduce((s, r) => s + (r - mean) ** 2, 0) / (logReturns.length - 1);
  return Math.sqrt(variance) * Math.sqrt(252) * 100;
}

// Fetch everything at once.
// Stock price failure throws (critical). Option/HV failures return null (non-critical).
export async function fetchAllMarketData(symbol, legs) {
  // Stock price is required — let it throw if it fails so the caller can show the error
  const stockPrice = await fetchStockPrice(symbol);

  // HV and per-leg greeks are best-effort
  const [hvResult, ...legResults] = await Promise.allSettled([
    fetchHistoricalVolatility(symbol),
    ...legs.map(leg => fetchOptionSnapshot(symbol, leg.type, leg.strike, leg.expiry)),
  ]);

  return {
    stockPrice,
    hv:   hvResult.status === 'fulfilled' ? hvResult.value : null,
    legs: legResults.map(r => r.status === 'fulfilled' ? r.value : null),
  };
}
