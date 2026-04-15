export default function Header({ ticker, onTickerChange }) {
  return (
    <div className="header">
      <input
        className="ticker-input"
        value={ticker}
        onChange={e => onTickerChange(e.target.value.toUpperCase())}
        maxLength={8}
        spellCheck={false}
      />
    </div>
  );
}
