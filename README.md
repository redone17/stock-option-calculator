# Stock Option Calculator

Multi-leg option P&L calculator with real-time market data.

**[Live](https://redone17.github.io/stock-option-calculator/)**

## Stack

- React 19 + Vite — UI and build
- Black-Scholes — local options pricing engine
- Alpaca Markets API — live stock price, IV, Greeks, HV30
- GitHub Actions + GitHub Pages — CI/CD

## Dev

```bash
# 1. Create .env.local with credentials
echo "VITE_ALPACA_KEY=your_key" >> .env.local
echo "VITE_ALPACA_SECRET=your_secret" >> .env.local
echo "VITE_APP_PASSWORD_HASH=$(node scripts/gen-hash.js your_password)" >> .env.local

# 2. Install and run
npm install
npm run dev
```

Open `http://localhost:5173/stock-option-calculator/`. Enter a ticker, set strikes and expiry dates for each leg, click **刷新行情** to pull live price and IV.

## Change Password

```bash
node scripts/gen-hash.js new_password
```

1. Copy the output hash
2. Update `.env.local`: `VITE_APP_PASSWORD_HASH=<hash>`
3. Update GitHub Secret: `Settings → Secrets and variables → Actions → VITE_APP_PASSWORD_HASH`
4. Push any change to `main` (or re-run the latest Actions workflow)

## Deploy

Push to `main` — GitHub Actions builds and deploys to Pages automatically.

For a new environment, add these repository secrets before the first push:
`Settings → Secrets and variables → Actions`

| Secret | Value |
|--------|-------|
| `VITE_ALPACA_KEY` | Alpaca API key |
| `VITE_ALPACA_SECRET` | Alpaca API secret |
| `VITE_APP_PASSWORD_HASH` | Output of `node scripts/gen-hash.js your_password` |
