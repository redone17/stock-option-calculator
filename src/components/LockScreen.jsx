import { useState } from 'react';
import { tryLogin } from '../utils/auth';

export default function LockScreen({ onUnlock }) {
  const [pw, setPw] = useState('');
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError(false);
    const ok = await tryLogin(pw);
    setLoading(false);
    if (ok) onUnlock();
    else { setError(true); setPw(''); }
  }

  return (
    <div className="lock-screen">
      <form className="lock-box" onSubmit={handleSubmit}>
        <div className="lock-title">Stock Option Calculator</div>
        <input
          className={`lock-input${error ? ' lock-error' : ''}`}
          type="password"
          placeholder="密码"
          value={pw}
          onChange={e => { setPw(e.target.value); setError(false); }}
          autoFocus
        />
        {error && <div className="lock-msg">密码错误</div>}
        <button className="lock-btn" type="submit" disabled={loading || !pw}>
          {loading ? '…' : '进入'}
        </button>
      </form>
    </div>
  );
}
