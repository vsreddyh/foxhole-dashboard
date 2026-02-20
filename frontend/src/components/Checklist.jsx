import { useState, useEffect } from 'react';

export default function Checklist({ items = [], onChange, readOnly = false }) {
    const [list, setList] = useState(items);
    const [newText, setNewText] = useState('');

    // Sync with parent when it re-fetches after a server round-trip
    // eslint-disable-next-line react-hooks/set-state-in-effect
    useEffect(() => { setList(items ?? []); }, [items]);

    const update = (updated) => { setList(updated); onChange?.(updated); };

    const toggle = (i) => update(list.map((item, idx) => idx === i ? { ...item, done: !item.done } : item));
    const remove = (i) => update(list.filter((_, idx) => idx !== i));
    const add = () => {
        if (!newText.trim()) return;
        update([...list, { _id: crypto.randomUUID(), text: newText.trim(), done: false }]);
        setNewText('');
    };

    const done = list.filter(i => i.done).length;

    return (
        <div>
            {list.length > 0 && (
                <div style={{ marginBottom: '.75rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.75rem', color: 'var(--text3)', marginBottom: '.3rem' }}>
                        <span>Progress</span><span>{done}/{list.length}</span>
                    </div>
                    <div style={{ height: 4, background: 'var(--border)', borderRadius: 2, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${list.length ? (done / list.length) * 100 : 0}%`, background: 'var(--accent)', borderRadius: 2, transition: 'width .3s ease' }} />
                    </div>
                </div>
            )}

            {list.length === 0 && <p style={{ color: 'var(--text3)', fontSize: '.8rem', margin: '.5rem 0' }}>No checklist items yet.</p>}

            {list.map((item, i) => (
                <div key={item._id ?? i} className={`cl-item${item.done ? ' done' : ''}`}>
                    <input type="checkbox" checked={item.done} onChange={() => toggle(i)} disabled={readOnly} />
                    <span style={{ flex: 1 }}>{item.text}</span>
                    {!readOnly && (
                        <button onClick={() => remove(i)} style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', fontSize: '.9rem', padding: '0 .25rem' }}>×</button>
                    )}
                </div>
            ))}

            {!readOnly && (
                <div style={{ display: 'flex', gap: '.5rem', marginTop: '.75rem' }}>
                    <input className="input" placeholder="Add item…" value={newText} onChange={e => setNewText(e.target.value)} onKeyDown={e => e.key === 'Enter' && add()} />
                    <button className="btn btn-ghost btn-sm" onClick={add} style={{ whiteSpace: 'nowrap' }}>+ Add</button>
                </div>
            )}
        </div>
    );
}
