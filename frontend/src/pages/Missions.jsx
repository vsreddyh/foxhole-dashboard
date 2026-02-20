import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import RoleGuard from '../components/RoleGuard';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';

const STATUS_OPTIONS = ['Planning', 'Active', 'Complete'];

export default function Missions() {
    const { hasRole } = useAuth();
    const [missions, setMissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ title: '', description: '', status: 'Planning' });
    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState('');
    const [deletingId, setDeletingId] = useState(null);
    const deleteTimer = useRef(null);

    const armDelete = (id) => {
        clearTimeout(deleteTimer.current);
        setDeletingId(id);
        deleteTimer.current = setTimeout(() => setDeletingId(null), 4000);
    };

    const fetchMissions = () => api.missions.list().then(setMissions).finally(() => setLoading(false));
    useEffect(() => { fetchMissions(); }, []);

    const handleCreate = async (e) => {
        e.preventDefault(); setFormError(''); setSaving(true);
        try {
            await api.missions.create({ ...form, checklist: [] });
            setForm({ title: '', description: '', status: 'Planning' });
            setShowForm(false); await fetchMissions();
        } catch (err) { setFormError(err.message); }
        finally { setSaving(false); }
    };

    const handleDelete = async (id) => {
        if (deletingId !== id) { armDelete(id); return; }
        clearTimeout(deleteTimer.current);
        setDeletingId(null);
        try {
            await api.missions.remove(id);
            setMissions(m => m.filter(x => x._id !== id));
        } catch (err) {
            console.error('Delete failed:', err);
        }
    };

    return (
        <RoleGuard>
            <div style={{ display: 'flex', minHeight: '100vh' }}>
                <Sidebar />
                <main style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>
                    <div className="fade-up" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <div>
                            <h2 style={{ margin: 0, fontSize: '1.75rem' }}>Missions</h2>
                            <p style={{ margin: 0, color: 'var(--text3)', fontSize: '.875rem' }}>Plan and track regiment operations</p>
                        </div>
                        {hasRole('Admin') && <button className="btn btn-primary" onClick={() => setShowForm(s => !s)}>{showForm ? '✕ Cancel' : '+ New Mission'}</button>}
                    </div>

                    {showForm && (
                        <div className="card fade-up" style={{ marginBottom: '1.5rem' }}>
                            <h3 style={{ margin: '0 0 1rem', fontSize: '1rem' }}>New Mission</h3>
                            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
                                <div><label className="field-label">Title</label><input className="input" required value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} /></div>
                                <div><label className="field-label">Description</label><textarea className="input" rows={2} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} style={{ resize: 'vertical' }} /></div>
                                <div>
                                    <label className="field-label">Status</label>
                                    <select className="input" value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
                                        {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                                {formError && <div className="alert-bar alert-danger">{formError}</div>}
                                <div style={{ display: 'flex', gap: '.5rem' }}>
                                    <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Creating…' : 'Create Mission'}</button>
                                    <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
                                </div>
                            </form>
                        </div>
                    )}

                    {loading ? (
                        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}><div className="spinner" /></div>
                    ) : missions.length === 0 ? (
                        <div className="card" style={{ textAlign: 'center', color: 'var(--text3)', padding: '3rem' }}>No missions yet.</div>
                    ) : (
                        <div className="card fade-up table-wrap" style={{ padding: 0 }}>
                            <table>
                                <thead><tr><th>Title</th><th>Status</th><th>Checklist</th><th>Created By</th><th /></tr></thead>
                                <tbody>
                                    {missions.map(m => {
                                        const done = m.checklist?.filter(c => c.done).length ?? 0;
                                        return (
                                            <tr key={m._id}>
                                                <td><Link to={`/missions/${m._id}`} style={{ color: 'var(--accent)', textDecoration: 'none' }}>{m.title}</Link></td>
                                                <td><span className={`badge status-${m.status.toLowerCase()}`}>{m.status}</span></td>
                                                <td>{m.checklist?.length > 0 ? `${done}/${m.checklist.length}` : '—'}</td>
                                                <td>{m.createdBy?.username ?? '—'}</td>
                                                <td style={{ display: 'flex', gap: '.4rem' }}>
                                                    <Link to={`/missions/${m._id}`} className="btn btn-ghost btn-sm">View</Link>
                                                    {hasRole('Admin') && (
                                                        <button
                                                            className={`btn btn-sm ${deletingId === m._id ? 'btn-primary' : 'btn-danger'}`}
                                                            onClick={() => handleDelete(m._id)}
                                                        >
                                                            {deletingId === m._id ? 'Confirm?' : 'Delete'}
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </main>
            </div>
        </RoleGuard>
    );
}
