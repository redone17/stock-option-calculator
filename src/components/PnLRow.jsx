function fmt(n) {
  const abs = Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return n < 0 ? `(${abs})` : abs;
}

function fmtPct(n) {
  return (n >= 0 ? '+' : '') + n.toFixed(2) + '%';
}

function PnLCell({ value, isPercent }) {
  const cls = value >= 0 ? 'gain' : 'loss';
  return (
    <td className={`cell pnl-cell ${cls}`}>
      {isPercent ? fmtPct(value) : `$ ${fmt(value)}`}
    </td>
  );
}

export default function PnLRow({ pnl1, pnl2, pnlPct1, pnlPct2 }) {
  const combined = pnl1 + pnl2;
  return (
    <>
      <tr className="pnl-row">
        <td className="cell label">盈亏</td>
        <PnLCell value={pnl1} />
        <PnLCell value={pnl2} />
      </tr>
      <tr className="pnl-row">
        <td className="cell label combined-label">合计</td>
        <td className={`cell pnl-cell combined ${combined >= 0 ? 'gain' : 'loss'}`} colSpan={2}>
          $ {fmt(combined)}
        </td>
      </tr>
      <tr className="pnl-row">
        <td className="cell label">盈亏%</td>
        <PnLCell value={pnlPct1} isPercent />
        <PnLCell value={pnlPct2} isPercent />
      </tr>
    </>
  );
}
