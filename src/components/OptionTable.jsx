function NumInput({ value, onChange, step = '0.01', min = '0' }) {
  return (
    <input
      type="number"
      className="num-input"
      value={value}
      step={step}
      min={min}
      onChange={e => onChange(parseFloat(e.target.value) || 0)}
    />
  );
}

function DateInput({ value, onChange }) {
  return (
    <input
      type="date"
      className="date-input"
      value={value}
      onChange={e => onChange(e.target.value)}
    />
  );
}

function Select({ value, onChange, options }) {
  return (
    <select className="select-input" value={value} onChange={e => onChange(e.target.value)}>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

const typeOpts = [
  { value: 'call', label: '看涨 (Call)' },
  { value: 'put',  label: '看跌 (Put)' },
];
const dirOpts = [
  { value: 'buy',  label: '买入 (Buy)' },
  { value: 'sell', label: '卖出 (Sell)' },
];

export default function OptionTableRows({
  options, onOptionChange, onAddOption,
  stockPrice, onStockPriceChange,
  daysToExpiry, remainingDays,
  closeDate, onCloseDateChange,
  daysHeld,
  closePrice, onClosePriceChange,
  greeks, hv,
}) {
  function upd(idx, field, val) {
    onOptionChange(idx, { ...options[idx], [field]: val });
  }

  const n = options.length;

  return (
    <>
      {/* ── Option inputs ── */}
      <tr>
        <td className="cell label">期权类型</td>
        {options.map((opt, i) => (
          <td key={i} className="cell">
            <Select value={opt.type} onChange={v => upd(i, 'type', v)} options={typeOpts} />
          </td>
        ))}
      </tr>
      <tr>
        <td className="cell label">买入方向</td>
        {options.map((opt, i) => (
          <td key={i} className="cell">
            <Select value={opt.direction} onChange={v => upd(i, 'direction', v)} options={dirOpts} />
          </td>
        ))}
      </tr>
      <tr>
        <td className="cell label">买入价 Premium</td>
        {options.map((opt, i) => (
          <td key={i} className="cell">
            <NumInput value={opt.premium} onChange={v => upd(i, 'premium', v)} />
          </td>
        ))}
      </tr>
      <tr>
        <td className="cell label">行权价</td>
        {options.map((opt, i) => (
          <td key={i} className="cell">
            <NumInput value={opt.strike} onChange={v => upd(i, 'strike', v)} step="1" />
          </td>
        ))}
      </tr>
      <tr>
        <td className="cell label">买入日期</td>
        {options.map((opt, i) => (
          <td key={i} className="cell">
            <DateInput value={opt.buyDate} onChange={v => upd(i, 'buyDate', v)} />
          </td>
        ))}
      </tr>
      <tr>
        <td className="cell label">到期日</td>
        {options.map((opt, i) => (
          <td key={i} className="cell">
            <DateInput value={opt.expiry} onChange={v => upd(i, 'expiry', v)} />
          </td>
        ))}
      </tr>
      <tr>
        <td className="cell label">合约数量</td>
        {options.map((opt, i) => (
          <td key={i} className="cell">
            <NumInput value={opt.contracts} onChange={v => upd(i, 'contracts', v)} step="1" min="1" />
          </td>
        ))}
      </tr>

      {/* ── Market data ── */}
      <tr className="section-gap"><td colSpan={n + 1}></td></tr>
      <tr className="dark-row">
        <td className="cell label">股票价格</td>
        <td className="cell" colSpan={n}>
          <NumInput value={stockPrice} onChange={onStockPriceChange} step="0.01" />
        </td>
      </tr>
      {hv != null && (
        <tr className="dark-row">
          <td className="cell label">历史波动率 HV30</td>
          <td className="cell readonly" colSpan={n}>{hv.toFixed(1)}%</td>
        </tr>
      )}
      <tr className="dark-row">
        <td className="cell label">天数 (到期)</td>
        {daysToExpiry.map((d, i) => (
          <td key={i} className="cell readonly">{d}</td>
        ))}
      </tr>
      <tr className="dark-row">
        <td className="cell label">剩余天数</td>
        {remainingDays.map((d, i) => (
          <td key={i} className="cell readonly">{d}</td>
        ))}
      </tr>
      <tr className="dark-row">
        <td className="cell label">预计平仓日期</td>
        <td className="cell" colSpan={n}>
          <DateInput value={closeDate} onChange={onCloseDateChange} />
        </td>
      </tr>

      {/* ── Holding ── */}
      <tr className="section-gap"><td colSpan={n + 1}></td></tr>
      <tr>
        <td className="cell label">持有天数</td>
        <td className="cell readonly" colSpan={n}>{daysHeld}</td>
      </tr>
      <tr>
        <td className="cell label">预期平仓股价</td>
        <td className="cell" colSpan={n}>
          <NumInput value={closePrice} onChange={onClosePriceChange} step="0.01" />
        </td>
      </tr>
      <tr>
        <td className="cell label">IV (%)</td>
        {options.map((opt, i) => (
          <td key={i} className="cell">
            <NumInput value={opt.iv} onChange={v => upd(i, 'iv', v)} step="0.5" />
          </td>
        ))}
      </tr>

      {/* ── Greeks (from API) ── */}
      {greeks?.some(g => g != null) && (
        <>
          <tr className="section-gap"><td colSpan={n + 1}></td></tr>
          {[
            { label: 'Δ Delta', key: 'delta', fmt: v => v.toFixed(3) },
            { label: 'Γ Gamma', key: 'gamma', fmt: v => v.toFixed(4) },
            { label: 'Θ Theta', key: 'theta', fmt: v => v.toFixed(3) },
            { label: 'V Vega',  key: 'vega',  fmt: v => v.toFixed(3) },
          ].map(({ label, key, fmt }) => (
            <tr key={key}>
              <td className="cell label">{label}</td>
              {options.map((_, i) => (
                <td key={i} className="cell readonly">
                  {greeks[i]?.[key] != null ? fmt(greeks[i][key]) : '—'}
                </td>
              ))}
            </tr>
          ))}
        </>
      )}

      {/* ── 拆腿 / Leg close ── */}
      <tr className="section-gap"><td colSpan={n + 1}></td></tr>
      <tr>
        <td className="cell label">已平仓</td>
        {options.map((opt, i) => (
          <td key={i} className="cell center">
            <input
              type="checkbox"
              className="checkbox"
              checked={opt.isClosed}
              onChange={e => upd(i, 'isClosed', e.target.checked)}
            />
          </td>
        ))}
      </tr>
      {options.some(opt => opt.isClosed) && (
        <tr>
          <td className="cell label">平仓价格</td>
          {options.map((opt, i) => (
            <td key={i} className="cell">
              {opt.isClosed
                ? <NumInput value={opt.closedPrice} onChange={v => upd(i, 'closedPrice', v)} />
                : <span className="cell readonly">—</span>}
            </td>
          ))}
        </tr>
      )}

      {/* ── Add option ── */}
      <tr className="section-gap"><td colSpan={n + 1}></td></tr>
      <tr>
        <td colSpan={n + 1} className="cell add-option-cell">
          <button className="add-option-btn" onClick={onAddOption}>＋ 添加期权</button>
        </td>
      </tr>
    </>
  );
}
