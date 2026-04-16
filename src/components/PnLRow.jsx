function fmt(n) {
  const abs = Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return n < 0 ? `(${abs})` : abs;
}

function fmtPct(n) {
  return (n >= 0 ? '+' : '') + n.toFixed(2) + '%';
}

function PnLCell({ value, isPercent, isClosed }) {
  const cls = value >= 0 ? 'gain' : 'loss';
  return (
    <td className={`cell pnl-cell ${cls}${isClosed ? ' is-closed' : ''}`}>
      {isPercent ? fmtPct(value) : `$ ${fmt(value)}`}
      {isClosed && <span className="closed-tag">已平</span>}
    </td>
  );
}

export default function PnLRow({ results }) {
  const combined = results.reduce((sum, r) => sum + r.pnl, 0);
  const n = results.length;
  return (
    <>
      <tr className="pnl-row">
        <td className="cell label">盈亏</td>
        {results.map((r, i) => (
          <PnLCell key={i} value={r.pnl} isClosed={r.isClosed} />
        ))}
        <td className="add-col-td" />
      </tr>
      {n > 1 && (
        <tr className="pnl-row">
          <td className="cell label combined-label">合计</td>
          <td className={`cell pnl-cell combined ${combined >= 0 ? 'gain' : 'loss'}`} colSpan={n}>
            $ {fmt(combined)}
          </td>
          <td className="add-col-td" />
        </tr>
      )}
      <tr className="pnl-row">
        <td className="cell label">盈亏%</td>
        {results.map((r, i) => (
          <PnLCell key={i} value={r.pnlPct} isPercent isClosed={r.isClosed} />
        ))}
        <td className="add-col-td" />
      </tr>
    </>
  );
}
