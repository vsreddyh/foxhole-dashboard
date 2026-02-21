import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import RoleGuard from '../components/RoleGuard';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { fetchMaps, fetchMapLocations, formatMapName } from '../lib/foxholeApi';

const EMPTY_FORM = { name: '', region: '', regionKey: '', subRegion: '', landmark: '', notes: '' };

export default function Bases() {
    const { hasRole } = useAuth();
    const [bases, setBases] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState(EMPTY_FORM);
    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState('');
    const [deletingId, setDeletingId] = useState(null);
    const deleteTimer = useRef(null);

    const armDelete = (id) => {
        clearTimeout(deleteTimer.current);
        setDeletingId(id);
        deleteTimer.current = setTimeout(() => setDeletingId(null), 4000);
    };

    // Foxhole API map data
    const [maps, setMaps] = useState([]);       // raw map names e.g. "TheFingersHex"
    const [mapsLoading, setMapsLoading] = useState(false);
    const [subRegions, setSubRegions] = useState([]);
    const [subLoading, setSubLoading] = useState(false);

    const fetchBases = () => api.bases.list().then(setBases).finally(() => setLoading(false));
    useEffect(() => { fetchBases(); }, []);

    // Load map list when form is opened
    useEffect(() => {
        if (!showForm || maps.length > 0) return;
        setMapsLoading(true);
        fetchMaps()
            .then(setMaps)
            .catch(() => setMaps([]))
            .finally(() => setMapsLoading(false));
    }, [showForm, maps.length]);

    // Load sub-regions when region changes
    const handleRegionChange = async (mapName) => {
        setForm(p => ({ ...p, region: formatMapName(mapName), regionKey: mapName, subRegion: '' }));
        if (!mapName) { setSubRegions([]); return; }
        setSubLoading(true);
        try {
            const locs = await fetchMapLocations(mapName);
            setSubRegions(locs);
        } catch {
            setSubRegions([]);
        } finally {
            setSubLoading(false);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault(); setFormError(''); setSaving(true);
        try {
            await api.bases.create({ ...form, checklist: [] });
            setForm(EMPTY_FORM);
            setSubRegions([]);
            setShowForm(false);
            await fetchBases();
        } catch (err) { setFormError(err.message); }
        finally { setSaving(false); }
    };

    const handleDelete = async (id) => {
        if (deletingId !== id) { armDelete(id); return; }
        clearTimeout(deleteTimer.current);
        setDeletingId(null);
        try {
            await api.bases.remove(id);
            setBases(b => b.filter(x => x._id !== id));
        } catch (err) {
            console.error('Delete failed:', err);
        }
    };

    const toggleForm = () => {
        setShowForm(s => !s);
        setForm(EMPTY_FORM);
        setSubRegions([]);
        setFormError('');
    };

    return (
        <RoleGuard>
            <div style={{ display: 'flex', minHeight: '100vh' }}>
                <Sidebar />
                <main style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>
                    <div className="fade-up" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <div>
                            <h2 style={{ margin: 0, fontSize: '1.75rem' }}>Bases</h2>
                            <p style={{ margin: 0, color: 'var(--text3)', fontSize: '.875rem' }}>Manage regiment forward operating bases</p>
                        </div>
                        {hasRole('Admin') && <button className="btn btn-primary" onClick={toggleForm}>{showForm ? '✕ Cancel' : '+ New Base'}</button>}
                    </div>

                    {showForm && (
                        <div className="card fade-up" style={{ marginBottom: '1.5rem' }}>
                            <h3 style={{ margin: '0 0 1rem', fontSize: '1rem' }}>New Base</h3>
                            <form onSubmit={handleCreate} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.75rem' }}>

                                {/* Name */}
                                <div style={{ gridColumn: '1/-1' }}>
                                    <label className="field-label">Base Name</label>
                                    <input className="input" required value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Forward Operating Base Alpha" />
                                </div>

                                {/* Region dropdown from Foxhole API */}
                                <div>
                                    <label className="field-label">Region (Map) {mapsLoading && <span style={{ color: 'var(--text3)' }}>Loading…</span>}</label>
                                    <select
                                        className="input"
                                        required
                                        value={maps.find(m => formatMapName(m) === form.region) ?? ''}
                                        onChange={e => handleRegionChange(e.target.value)}
                                        disabled={mapsLoading}
                                    >
                                        <option value="">— Select region —</option>
                                        {maps.map(m => (
                                            <option key={m} value={m}>{formatMapName(m)}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Sub-region dropdown */}
                                <div>
                                    <label className="field-label">Sub-Region {subLoading && <span style={{ color: 'var(--text3)' }}>Loading…</span>}</label>
                                    {subRegions.length > 0 ? (
                                        <select
                                            className="input"
                                            required
                                            value={form.subRegion}
                                            onChange={e => setForm(p => ({ ...p, subRegion: e.target.value }))}
                                        >
                                            <option value="">— Select location —</option>
                                            {subRegions.map(s => (
                                                <option key={s} value={s}>{s}</option>
                                            ))}
                                        </select>
                                    ) : (
                                        <input
                                            className="input"
                                            required
                                            value={form.subRegion}
                                            onChange={e => setForm(p => ({ ...p, subRegion: e.target.value }))}
                                            placeholder={form.region ? (subLoading ? 'Loading locations…' : 'Type location name') : 'Select a region first'}
                                            disabled={!form.region || subLoading}
                                        />
                                    )}
                                </div>

                                {/* Landmark */}
                                <div>
                                    <label className="field-label">Landmark</label>
                                    <input className="input" value={form.landmark} onChange={e => setForm(p => ({ ...p, landmark: e.target.value }))} placeholder="e.g. bridge, factory, ridge…" />
                                </div>

                                {/* Notes */}
                                <div>
                                    <label className="field-label">Notes</label>
                                    <textarea className="input" rows={2} value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} style={{ resize: 'vertical' }} />
                                </div>

                                {formError && <div className="alert-bar alert-danger" style={{ gridColumn: '1/-1' }}>{formError}</div>}
                                <div style={{ gridColumn: '1/-1', display: 'flex', gap: '.5rem' }}>
                                    <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Creating…' : 'Create Base'}</button>
                                    <button type="button" className="btn btn-ghost" onClick={toggleForm}>Cancel</button>
                                </div>
                            </form>
                        </div>
                    )}

                    {loading ? (
                        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}><div className="spinner" /></div>
                    ) : bases.length === 0 ? (
                        <div className="card" style={{ textAlign: 'center', color: 'var(--text3)', padding: '3rem' }}>No bases yet. Create the first one.</div>
                    ) : (
                        <div className="card fade-up table-wrap" style={{ padding: 0 }}>
                            <table>
                                <thead><tr><th>Name</th><th>Region</th><th>Sub-Region</th><th>Landmark</th><th>Alerts</th><th /></tr></thead>
                                <tbody>
                                    {bases.map(b => {
                                        const done = b.checklist?.filter(c => c.done).length ?? 0;
                                        const hasAlerts = b.alerts?.some(a => a.includes('⚠'));
                                        return (
                                            <tr key={b._id}>
                                                <td><Link to={`/bases/${b._id}`} style={{ color: 'var(--accent)', textDecoration: 'none' }}>{b.name}</Link></td>
                                                <td>{b.region}</td><td>{b.subRegion}</td><td>{b.landmark || '—'}</td>
                                                <td>{hasAlerts ? <span className="badge badge-red">⚠ Alert</span> : <span className="badge badge-green">Clear</span>}</td>
                                                <td style={{ display: 'flex', gap: '.4rem' }}>
                                                    <Link to={`/bases/${b._id}`} className="btn btn-ghost btn-sm">View</Link>
                                                    {hasRole('Admin') && (
                                                        <button
                                                            className={`btn btn-sm ${deletingId === b._id ? 'btn-primary' : 'btn-danger'}`}
                                                            onClick={() => handleDelete(b._id)}
                                                        >
                                                            {deletingId === b._id ? 'Confirm?' : 'Delete'}
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
