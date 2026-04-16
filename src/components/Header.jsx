export default function Header({ ticker, onTickerChange, onFetch, fetchLoading, fetchError, lastFetched }) {
  const lastFetchedStr = lastFetched
    ? new Date(lastFetched).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : null;

  return (
    <div className="header">
      <input
        className="ticker-input"
        value={ticker}
        onChange={e => onTickerChange(e.target.value.toUpperCase())}
        maxLength={8}
        spellCheck={false}
      />
      <div className="fetch-group">
        {lastFetchedStr && !fetchError && (
          <span className="fetch-time">更新于 {lastFetchedStr}</span>
        )}
        {fetchError && <span className="fetch-error">{fetchError}</span>}
        <button className="fetch-btn" onClick={onFetch} disabled={fetchLoading} title="获取最新股价和期权数据">
          <span className={fetchLoading ? 'spin' : ''}>↻</span>
          {fetchLoading ? ' 加载中…' : ' 刷新行情'}
        </button>
      </div>
    </div>
  );
}
