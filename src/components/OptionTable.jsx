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

// Returns <tr> row fragments — must be rendered inside a <tbody>
export default function OptionTableRows({
  options, onOptionChange,
  stockPrice, onStockPriceChange,
  daysToExpiry, remainingDays,
  closeDate, onCloseDateChange,
  daysHeld,
  closePrice, onClosePriceChange,
}) {
  function upd(idx, field, val) {
    onOptionChange(idx, { ...options[idx], [field]: val });
  }

  return (
    <>
      {/* ── Option inputs ── */}
      <tr>
        <td className="cell label">期权类型</td>
        <td className="cell"><Select value={options[0].type} onChange={v => upd(0,'type',v)} options={typeOpts} /></td>
        <td className="cell"><Select value={options[1].type} onChange={v => upd(1,'type',v)} options={typeOpts} /></td>
      </tr>
      <tr>
        <td className="cell label">买入方向</td>
        <td className="cell"><Select value={options[0].direction} onChange={v => upd(0,'direction',v)} options={dirOpts} /></td>
        <td className="cell"><Select value={options[1].direction} onChange={v => upd(1,'direction',v)} options={dirOpts} /></td>
      </tr>
      <tr>
        <td className="cell label">买入价 Premium</td>
        <td className="cell"><NumInput value={options[0].premium} onChange={v => upd(0,'premium',v)} /></td>
        <td className="cell"><NumInput value={options[1].premium} onChange={v => upd(1,'premium',v)} /></td>
      </tr>
      <tr>
        <td className="cell label">行权价</td>
        <td className="cell"><NumInput value={options[0].strike} onChange={v => upd(0,'strike',v)} step="1" /></td>
        <td className="cell"><NumInput value={options[1].strike} onChange={v => upd(1,'strike',v)} step="1" /></td>
      </tr>
      <tr>
        <td className="cell label">买入日期</td>
        <td className="cell"><DateInput value={options[0].buyDate} onChange={v => upd(0,'buyDate',v)} /></td>
        <td className="cell"><DateInput value={options[1].buyDate} onChange={v => upd(1,'buyDate',v)} /></td>
      </tr>
      <tr>
        <td className="cell label">到期日</td>
        <td className="cell"><DateInput value={options[0].expiry} onChange={v => upd(0,'expiry',v)} /></td>
        <td className="cell"><DateInput value={options[1].expiry} onChange={v => upd(1,'expiry',v)} /></td>
      </tr>
      <tr>
        <td className="cell label">合约数量</td>
        <td className="cell"><NumInput value={options[0].contracts} onChange={v => upd(0,'contracts',v)} step="1" min="1" /></td>
        <td className="cell"><NumInput value={options[1].contracts} onChange={v => upd(1,'contracts',v)} step="1" min="1" /></td>
      </tr>

      {/* ── Market data ── */}
      <tr className="section-gap"><td colSpan={3}></td></tr>
      <tr className="dark-row">
        <td className="cell label">股票价格</td>
        <td className="cell" colSpan={2}>
          <NumInput value={stockPrice} onChange={onStockPriceChange} step="0.01" />
        </td>
      </tr>
      <tr className="dark-row">
        <td className="cell label">天数 (到期)</td>
        <td className="cell readonly" colSpan={2}>{daysToExpiry}</td>
      </tr>
      <tr className="dark-row">
        <td className="cell label">剩余天数</td>
        <td className="cell readonly" colSpan={2}>{remainingDays}</td>
      </tr>
      <tr className="dark-row">
        <td className="cell label">预计平仓日期</td>
        <td className="cell" colSpan={2}><DateInput value={closeDate} onChange={onCloseDateChange} /></td>
      </tr>

      {/* ── Holding ── */}
      <tr className="section-gap"><td colSpan={3}></td></tr>
      <tr>
        <td className="cell label">持有天数</td>
        <td className="cell readonly" colSpan={2}>{daysHeld}</td>
      </tr>
      <tr>
        <td className="cell label">预期平仓股价</td>
        <td className="cell" colSpan={2}>
          <NumInput value={closePrice} onChange={onClosePriceChange} step="0.01" />
        </td>
      </tr>
      <tr>
        <td className="cell label">IV (%)</td>
        <td className="cell"><NumInput value={options[0].iv} onChange={v => upd(0,'iv',v)} step="0.5" /></td>
        <td className="cell"><NumInput value={options[1].iv} onChange={v => upd(1,'iv',v)} step="0.5" /></td>
      </tr>
    </>
  );
}
