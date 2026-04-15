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

function makeOption(strike, premium, direction, iv) {
  return { type: 'call', direction, premium, strike, buyDate: todayStr, expiry: defaultExpiry, contracts: 1, iv };
}

export default function App() {
  const [ticker, setTicker]           = useState('TSLA');
  const [stockPrice, setStockPrice]   = useState(389.67);
  const [closeDate, setCloseDate]     = useState(defaultClose);
  const [closePrice, setClosePrice]   = useState(388.00);
  const [options, setOptions]         = useState([
    makeOption(350, 21.24, 'buy',  50),
    makeOption(425,  2.23, 'sell', 50),
  ]);
  const [sliderStock, setSliderStock] = useState(null);
  const [sliderDays,  setSliderDays]  = useState(null);
  const [sliderIV,    setSliderIV]    = useState(null);

  function updateOption(idx, updated) {
    setOptions(prev => prev.map((o, i) => i === idx ? updated : o));
    setSliderStock(null); setSliderDays(null); setSliderIV(null);
  }

  // Derived
  const refExpiry    = options[0].expiry;
  const daysToExpiry = Math.max(0, daysBetween(todayStr, refExpiry));
  const remainingDays = Math.max(0, daysBetween(closeDate, refExpiry));
  const daysHeld     = Math.max(0, daysBetween(options[0].buyDate, todayStr));
  const avgIV        = (options[0].iv + options[1].iv) / 2;

  // Effective values for B-S (sliders override)
  const effStock = sliderStock ?? closePrice;
  const effDays  = sliderDays  ?? remainingDays;
  const effIV0   = (sliderIV   ?? options[0].iv) / 100;
  const effIV1   = (sliderIV   ?? options[1].iv) / 100;

  const { pnl1, pnlPct1, pnl2, pnlPct2 } = useMemo(() => {
    function calc(opt, effIV) {
      const T        = effDays / 365;
      const curPrice = bsPrice(effStock, opt.strike, T, 0.045, effIV, opt.type);
      const cost     = opt.premium * 100 * opt.contracts;
      const value    = curPrice * 100 * opt.contracts;
      const pnl      = opt.direction === 'buy' ? value - cost : cost - value;
      return { pnl, pnlPct: cost > 0 ? (pnl / cost) * 100 : 0 };
    }
    const r1 = calc(options[0], effIV0);
    const r2 = calc(options[1], effIV1);
    return { pnl1: r1.pnl, pnlPct1: r1.pnlPct, pnl2: r2.pnl, pnlPct2: r2.pnlPct };
  }, [options, effStock, effDays, effIV0, effIV1]);

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
            onStockPriceChange={v => { setStockPrice(v); setSliderStock(null); }}
            daysToExpiry={daysToExpiry}
            remainingDays={remainingDays}
            closeDate={closeDate}
            onCloseDateChange={setCloseDate}
            daysHeld={daysHeld}
            closePrice={closePrice}
            onClosePriceChange={setClosePrice}
          />
          <tr className="section-gap"><td colSpan={3}></td></tr>
          <PnLRow pnl1={pnl1} pnl2={pnl2} pnlPct1={pnlPct1} pnlPct2={pnlPct2} />
        </tbody>
      </table>

      <Sliders
        stockPrice={stockPrice}
        sliderStock={sliderStock}
        onSliderStock={setSliderStock}
        daysToExpiry={daysToExpiry}
        sliderDays={sliderDays}
        onSliderDays={setSliderDays}
        avgIV={avgIV}
        sliderIV={sliderIV}
        onSliderIV={setSliderIV}
      />
    </div>
  );
}
