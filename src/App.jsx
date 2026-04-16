import { useState, useMemo, useEffect, useRef } from 'react';
import LockScreen from './components/LockScreen';
import { isAuthenticated } from './utils/auth';
import Header from './components/Header';
import TabBar from './components/TabBar';
import OptionTableRows from './components/OptionTable';
import PnLRow from './components/PnLRow';
import Sliders from './components/Sliders';
import { bsPrice } from './utils/blackScholes';
import { fetchAllMarketData } from './utils/alpacaApi';
import './App.css';

const STORAGE_KEY = 'option-calc-v2';
const todayStr = new Date().toISOString().slice(0, 10);

function addDays(dateStr, n) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

function daysBetween(a, b) {
  return Math.round((new Date(b) - new Date(a)) / 86400000);
}

function makeOption(strike, premium, direction, iv, expiryOffset = 30) {
  return {
    type: 'call', direction, premium, strike,
    buyDate: todayStr,
    expiry: addDays(todayStr, expiryOffset),
    contracts: 1, iv,
    isClosed: false, closedPrice: 0,
  };
}

function newPage(id) {
  return {
    id,
    name: `计算 ${id}`,
    ticker: 'TSLA',
    stockPrice: 389.67,
    closeDate: addDays(todayStr, 3),
    closePrice: 388.00,
    options: [
      makeOption(350, 21.24, 'buy',  50, 30),
      makeOption(425,  2.23, 'sell', 50, 30),
    ],
    sliderStock:   null,
    sliderDays:    null,
    sliderIVDelta: 0,
  };
}

function loadState() {
  try {
    const s = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (s && Array.isArray(s.pages) && s.pages.length > 0) return s;
  } catch {}
  return null;
}

export default function App() {
  const [authed, setAuthed] = useState(isAuthenticated);
  const [appState, setAppState] = useState(() => {
    return loadState() ?? { pages: [newPage(1)], activeId: 1, nextId: 2 };
  });
  const [savedAt, setSavedAt] = useState(null);
  const saveTimer = useRef(null);
  const [marketData, setMarketData] = useState({ loading: false, error: null, hv: null, greeks: [null, null], lastFetched: null });

  const { pages, activeId, nextId } = appState;
  const page = pages.find(p => p.id === activeId) ?? pages[0];

  // Auto-save: debounced 800 ms after last change, then flash "已保存"
  useEffect(() => {
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
      setSavedAt(Date.now());
    }, 800);
    return () => clearTimeout(saveTimer.current);
  }, [appState]);

  // ── State helpers ────────────────────────────────────────────
  function updatePage(changes) {
    setAppState(prev => ({
      ...prev,
      pages: prev.pages.map(p => p.id === prev.activeId ? { ...p, ...changes } : p),
    }));
  }

  function updateOption(idx, updated) {
    updatePage({ options: page.options.map((o, i) => i === idx ? updated : o) });
  }

  function addPage() {
    setAppState(prev => {
      const id = prev.nextId;
      return { ...prev, pages: [...prev.pages, newPage(id)], activeId: id, nextId: id + 1 };
    });
  }

  function deletePage(id) {
    setAppState(prev => {
      const remaining = prev.pages.filter(p => p.id !== id);
      const newActive = prev.activeId === id ? remaining[remaining.length - 1].id : prev.activeId;
      return { ...prev, pages: remaining, activeId: newActive };
    });
  }

  function renamePage(id, name) {
    setAppState(prev => ({
      ...prev,
      pages: prev.pages.map(p => p.id === id ? { ...p, name } : p),
    }));
  }

  function selectPage(id) {
    setAppState(prev => ({ ...prev, activeId: id }));
    setMarketData({ loading: false, error: null, hv: null, greeks: [null, null], lastFetched: null });
  }

  async function handleFetchMarketData() {
    setMarketData(prev => ({ ...prev, loading: true, error: null }));
    try {
      const result = await fetchAllMarketData(page.ticker, page.options);
      const changes = {};
      if (result.stockPrice != null) changes.stockPrice = result.stockPrice;
      const updatedOptions = page.options.map((opt, i) =>
        result.legs[i]?.iv != null ? { ...opt, iv: parseFloat(result.legs[i].iv.toFixed(1)) } : opt
      );
      if (updatedOptions.some((o, i) => o.iv !== page.options[i].iv)) changes.options = updatedOptions;
      if (Object.keys(changes).length > 0) updatePage(changes);
      setMarketData({ loading: false, error: null, hv: result.hv, greeks: result.legs, lastFetched: Date.now() });
    } catch (err) {
      setMarketData({ loading: false, error: err.message, hv: null, greeks: [null, null] });
    }
  }

  // ── Derived values ───────────────────────────────────────────
  const daysHeld      = Math.max(0, daysBetween(page.options[0].buyDate, todayStr));
  const daysToExpiry  = page.options.map(opt => Math.max(0, daysBetween(todayStr, opt.expiry)));
  const remainingDays = page.options.map(opt => Math.max(0, daysBetween(page.closeDate, opt.expiry)));

  const effStock = page.sliderStock ?? page.closePrice;
  const effDays  = page.options.map((_, i) => {
    const base0 = remainingDays[0];
    const days0 = page.sliderDays ?? base0;
    return Math.max(0, days0 + (remainingDays[i] - base0));
  });
  const effIV = page.options.map(opt => Math.max(0.5, opt.iv + page.sliderIVDelta) / 100);

  const results = useMemo(() => {
    return page.options.map((opt, i) => {
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
  }, [page.options, effStock, effDays, effIV]);

  if (!authed) return <LockScreen onUnlock={() => setAuthed(true)} />;

  return (
    <div className="app">
      <TabBar
        pages={pages}
        activeId={activeId}
        savedAt={savedAt}
        onSelect={selectPage}
        onAdd={addPage}
        onDelete={deletePage}
      />

      <div className="content">
      <Header
        ticker={page.ticker}
        onTickerChange={v => updatePage({ ticker: v })}
        onFetch={handleFetchMarketData}
        fetchLoading={marketData.loading}
        fetchError={marketData.error}
        lastFetched={marketData.lastFetched}
      />

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
            options={page.options}
            onOptionChange={updateOption}
            stockPrice={page.stockPrice}
            onStockPriceChange={v => updatePage({ stockPrice: v })}
            daysToExpiry={daysToExpiry}
            remainingDays={remainingDays}
            closeDate={page.closeDate}
            onCloseDateChange={v => updatePage({ closeDate: v })}
            daysHeld={daysHeld}
            closePrice={page.closePrice}
            onClosePriceChange={v => updatePage({ closePrice: v })}
            greeks={marketData.greeks}
            hv={marketData.hv}
          />
          <tr className="section-gap"><td colSpan={3}></td></tr>
          <PnLRow results={results} />
        </tbody>
      </table>

      <Sliders
        closePrice={page.closePrice}
        stockPrice={page.stockPrice}
        sliderStock={page.sliderStock}
        onSliderStock={v => updatePage({ sliderStock: v })}
        remainingDays0={remainingDays[0]}
        maxDays={Math.max(daysToExpiry[0], daysToExpiry[1], 1)}
        sliderDays={page.sliderDays}
        onSliderDays={v => updatePage({ sliderDays: v })}
        sliderIVDelta={page.sliderIVDelta}
        onSliderIVDelta={v => updatePage({ sliderIVDelta: v })}
      />
      </div>
    </div>
  );
}
