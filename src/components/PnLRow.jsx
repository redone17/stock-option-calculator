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
  const [r1, r2] = results;
  const combined = r1.pnl + r2.pnl;
  return (
    <>
      <tr className="pnl-row">
        <td className="cell label">盈亏</td>
        <PnLCell value={r1.pnl} isClosed={r1.isClosed} />
        <PnLCell value={r2.pnl} isClosed={r2.isClosed} />
      </tr>
      <tr className="pnl-row">
        <td className="cell label combined-label">合计</td>
        <td className={`cell pnl-cell combined ${combined >= 0 ? 'gain' : 'loss'}`} colSpan={2}>
          $ {fmt(combined)}
        </td>
      </tr>
      <tr className="pnl-row">
        <td className="cell label">盈亏%</td>
        <PnLCell value={r1.pnlPct} isPercent isClosed={r1.isClosed} />
        <PnLCell value={r2.pnlPct} isPercent isClosed={r2.isClosed} />
      </tr>
    </>
  );
}
