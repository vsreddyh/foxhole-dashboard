import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import RoleGuard from '../components/RoleGuard';
import Checklist from '../components/Checklist';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';

const STATUS = ['Planning', 'Active', 'Complete'];
const STATUS_COLOR = { Planning: 'var(--blue)', Active: 'var(--green)', Complete: 'var(--text2)' };

export default function MissionDetail() {
    const { id } = useParams();
    const { hasRole } = useAuth();
    const navigate = useNavigate();
    const [mission, setMission] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [editingDesc, setEditingDesc] = useState(false);
    const [editDescValue, setEditDescValue] = useState('');

    useEffect(() => { api.missions.get(id).then(setMission).finally(() => setLoading(false)); }, [id]);

    const update = async (data) => {
        setSaving(true);
        try { setMission(await api.missions.update(id, data)); }
        finally { setSaving(false); }
    };

    const handleDelete = async () => {
        if (!confirmDelete) { setConfirmDelete(true); return; }
        try { await api.missions.remove(id); navigate('/missions'); }
        catch (err) { alert(err.message); setConfirmDelete(false); }
    };

    if (loading) return (
        <RoleGuard><div style={{ display: 'flex', minHeight: '100vh' }}><Sidebar /><main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div className="spinner" /></main></div></RoleGuard>
    );
    if (!mission) return null;

    return (
        <RoleGuard>
            <div style={{ display: 'flex', minHeight: '100vh' }}>
                <Sidebar />
                <main style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>
                    <div className="fade-up" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', margin: '0 0 .25rem' }}>
                                <h2 style={{ margin: 0, fontSize: '1.75rem' }}>{mission.title}</h2>
                                {hasRole('Trusted') && !editingDesc && (
                                    <button className="btn btn-ghost btn-sm" onClick={() => { setEditDescValue(mission.description || ''); setEditingDesc(true); }}>Edit Description</button>
                                )}
                            </div>
                            {editingDesc ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem', maxWidth: 500, marginTop: '.5rem' }}>
                                    <textarea
                                        className="input"
                                        rows={4}
                                        value={editDescValue}
                                        onChange={e => setEditDescValue(e.target.value)}
                                        style={{ resize: 'vertical' }}
                                        placeholder="Enter mission description..."
                                    />
                                    <div style={{ display: 'flex', gap: '.5rem' }}>
                                        <button
                                            className="btn btn-primary btn-sm"
                                            onClick={async () => {
                                                setSaving(true);
                                                try {
                                                    const r = await api.missions.update(id, { description: editDescValue });
                                                    setMission(r);
                                                    setEditingDesc(false);
                                                } finally {
                                                    setSaving(false);
                                                }
                                            }}
                                            disabled={saving}
                                        >
                                            {saving ? 'Saving…' : 'Save'}
                                        </button>
                                        <button className="btn btn-ghost btn-sm" onClick={() => setEditingDesc(false)} disabled={saving}>Cancel</button>
                                    </div>
                                </div>
                            ) : (
                                (mission.description || hasRole('Trusted')) && (
                                    <p style={{ margin: 0, color: 'var(--text3)', fontSize: '.875rem', maxWidth: 500, whiteSpace: 'pre-wrap' }}>
                                        {mission.description || <span style={{ fontStyle: 'italic' }}>No description provided.</span>}
                                    </p>
                                )
                            )}
                        </div>
                        <div style={{ display: 'flex', gap: '.5rem', alignItems: 'center' }}>
                            {saving && <span style={{ color: 'var(--text3)', fontSize: '.8rem' }}>Saving…</span>}
                            {hasRole('Admin') && (
                                <button
                                    className={`btn btn-sm ${confirmDelete ? 'btn-primary' : 'btn-danger'}`}
                                    onClick={handleDelete}
                                >
                                    {confirmDelete ? 'Confirm Delete?' : 'Delete'}
                                </button>
                            )}
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                        <div className="card fade-up">
                            <h3 style={{ margin: '0 0 1rem', fontSize: '1rem' }}>Status</h3>
                            <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap' }}>
                                {STATUS.map(s => (
                                    <button key={s} className="btn btn-ghost btn-sm"
                                        style={{ color: mission.status === s ? STATUS_COLOR[s] : undefined, borderColor: mission.status === s ? STATUS_COLOR[s] : undefined, fontWeight: mission.status === s ? 700 : 400 }}
                                        onClick={() => hasRole('Trusted') && update({ status: s })}
                                        disabled={!hasRole('Trusted') || mission.status === s}>
                                        {s}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="card fade-up" style={{ fontSize: '.875rem' }}>
                            <h3 style={{ margin: '0 0 1rem', fontSize: '1rem' }}>Info</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem', color: 'var(--text2)' }}>
                                <div><span style={{ color: 'var(--text3)', marginRight: '.5rem' }}>Created:</span>{new Date(mission.createdAt).toLocaleDateString()}</div>
                            </div>
                        </div>

                        <div className="card fade-up" style={{ gridColumn: '1/-1' }}>
                            <h3 style={{ margin: '0 0 1rem', fontSize: '1rem' }}>Checklist</h3>
                            <Checklist items={mission.checklist} onChange={hasRole('Trusted') ? (updated) => update({ checklist: updated }) : undefined} readOnly={!hasRole('Trusted')} />
                        </div>
                    </div>
                </main>
            </div>
        </RoleGuard>
    );
}
