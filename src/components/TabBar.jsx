import { useState, useEffect, useRef } from 'react';

function SavedDot({ savedAt }) {
  const [visible, setVisible] = useState(false);
  const timer = useRef(null);

  useEffect(() => {
    if (!savedAt) return;
    setVisible(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setVisible(false), 2000);
    return () => clearTimeout(timer.current);
  }, [savedAt]);

  return (
    <span className={`saved-indicator ${visible ? 'show' : ''}`}>
      已保存 ✓
    </span>
  );
}

export default function TabBar({ pages, activeId, savedAt, onSelect, onAdd, onDelete, onRename }) {
  return (
    <div className="tab-bar-wrapper">
      <div className="tab-bar">
        {pages.map(p => (
          <div
            key={p.id}
            className={`tab ${p.id === activeId ? 'active' : ''}`}
            onClick={() => onSelect(p.id)}
          >
            <input
              className="tab-name"
              value={p.name}
              onChange={e => onRename(p.id, e.target.value)}
              onClick={e => e.stopPropagation()}
              onFocus={e => e.target.select()}
              maxLength={20}
            />
            {pages.length > 1 && (
              <button
                className="tab-close"
                onClick={e => { e.stopPropagation(); onDelete(p.id); }}
                title="删除"
              >
                ×
              </button>
            )}
          </div>
        ))}
        <button className="tab-add" onClick={onAdd} title="新建计算页">+</button>
      </div>
      <SavedDot savedAt={savedAt} />
    </div>
  );
}
