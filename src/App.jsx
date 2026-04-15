import { useState, useMemo } from 'react';
import Header from './components/Header';
import OptionTableRows from './components/OptionTable';
import PnLRow from './components/PnLRow';
import Sliders from './components/Sliders';
import { bsPrice } from './utils/blackScholes';
import './App.css';

const today = new Date();
const todayStr = today.toISOString().slice(0, 10);

function addDays(dateStr, n) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

function daysBetween(a, b) {
  return Math.round((new Date(b) - new Date(a)) / 86400000);
}

const defaultExpiry = addDays(todayStr, 30);
const defaultClose  = addDays(todayStr, 3);

function makeOption(strike, premium, direction, iv, expiryOffset = 30) {
  return {
    type: 'call', direction, premium, strike,
    buyDate: todayStr,
    expiry: addDays(todayStr, expiryOffset),
    contracts: 1, iv,
    isClosed: false, closedPrice: 0,
  };
}

export default function App() {
  const [ticker, setTicker]         = useState('TSLA');
  const [stockPrice, setStockPrice] = useState(389.67);
  const [closeDate, setCloseDate]   = useState(defaultClose);
  const [closePrice, setClosePrice] = useState(388.00);
  const [options, setOptions]       = useState([
    makeOption(350, 21.24, 'buy',  50, 30),
    makeOption(425,  2.23, 'sell', 50, 30),
  ]);

  // Slider state
  // sliderStock: what-if price at close (null = use closePrice)
  // sliderDays:  what-if remaining days for leg 0 (null = use actual); leg 1 preserves spread
  // sliderIVDelta: ±pp added to each leg's IV (0 = no change)
  const [sliderStock,    setSliderStock]    = useState(null);
  const [sliderDays,     setSliderDays]     = useState(null);
  const [sliderIVDelta,  setSliderIVDelta]  = useState(0);

  function updateOption(idx, updated) {
    setOptions(prev => prev.map((o, i) => i === idx ? updated : o));
  }

  // Per-leg derived values
  const daysHeld = Math.max(0, daysBetween(options[0].buyDate, todayStr));

  // Each leg has its own expiry → per-leg arrays
  const daysToExpiry  = options.map(opt => Math.max(0, daysBetween(todayStr, opt.expiry)));
  const remainingDays = options.map(opt => Math.max(0, daysBetween(closeDate, opt.expiry)));

  // Effective values used in B-S calculation
  // Stock: slider overrides closePrice
  const effStock = sliderStock ?? closePrice;

  // Days: slider sets leg 0's remaining days; leg 1 preserves the calendar spread gap
  const effDays = options.map((_, i) => {
    const base0 = remainingDays[0];
    const baseI = remainingDays[i];
    const days0 = sliderDays ?? base0;
    // Preserve the spread between legs (important for calendar spreads)
    return Math.max(0, days0 + (baseI - base0));
  });

  // IV: add delta to each leg's own IV independently (preserves leg-by-leg difference)
  const effIV = options.map(opt => Math.max(0.5, opt.iv + sliderIVDelta) / 100);

  const results = useMemo(() => {
    return options.map((opt, i) => {
      // Closed leg: P&L locked at closedPrice
      if (opt.isClosed) {
        const cost  = opt.premium * 100 * opt.contracts;
        const value = opt.closedPrice * 100 * opt.contracts;
        const pnl   = opt.direction === 'buy' ? value - cost : cost - value;
        return { pnl, pnlPct: cost > 0 ? (pnl / cost) * 100 : 0, isClosed: true };
      }
      const T        = effDays[i] / 365;
      const curPrice = bsPrice(effStock, opt.strike, T, 0.045, effIV[i], opt.type);
      const cost     = opt.premium * 100 * opt.contracts;
      const value    = curPrice * 100 * opt.contracts;
      const pnl      = opt.direction === 'buy' ? value - cost : cost - value;
      return { pnl, pnlPct: cost > 0 ? (pnl / cost) * 100 : 0, isClosed: false };
    });
  }, [options, effStock, effDays, effIV]);

  return (
    <div className="app">
      <Header ticker={ticker} onTickerChange={setTicker} />

      <table className="option-table">
        <thead>
          <tr>
            <th className="label-col">参数</th>
            <th>期权 1</th>
            <th>期权 2</th>
          </tr>
        </thead>
        <tbody>
          <OptionTableRows
            options={options}
            onOptionChange={updateOption}
            stockPrice={stockPrice}
            onStockPriceChange={setStockPrice}
            daysToExpiry={daysToExpiry}
            remainingDays={remainingDays}
            closeDate={closeDate}
            onCloseDateChange={setCloseDate}
            daysHeld={daysHeld}
            closePrice={closePrice}
            onClosePriceChange={setClosePrice}
          />
          <tr className="section-gap"><td colSpan={3}></td></tr>
          <PnLRow results={results} />
        </tbody>
      </table>

      <Sliders
        closePrice={closePrice}
        stockPrice={stockPrice}
        sliderStock={sliderStock}
        onSliderStock={setSliderStock}
        remainingDays0={remainingDays[0]}
        maxDays={Math.max(daysToExpiry[0], daysToExpiry[1], 1)}
        sliderDays={sliderDays}
        onSliderDays={setSliderDays}
        sliderIVDelta={sliderIVDelta}
        onSliderIVDelta={setSliderIVDelta}
      />
    </div>
  );
}
