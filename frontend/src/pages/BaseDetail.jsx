import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import RoleGuard from '../components/RoleGuard';
import Checklist from '../components/Checklist';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';

export default function BaseDetail() {
    const { id } = useParams();
    const { hasRole } = useAuth();
    const navigate = useNavigate();
    const [base, setBase] = useState(null);
    const [loading, setLoading] = useState(true);
    const [threatData, setThreatData] = useState(null); // { threatened, wardenCount, colonialCount, alerts }
    const [alertLoading, setAlertLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);

    useEffect(() => { api.bases.get(id).then(setBase).finally(() => setLoading(false)); }, [id]);

    const handleChecklistChange = async (updated) => {
        setSaving(true);
        try { const r = await api.bases.update(id, { checklist: updated }); setBase(r); }
        finally { setSaving(false); }
    };

    const fetchAlerts = async () => {
        setAlertLoading(true);
        try {
            const r = await api.bases.alerts(id);
            setThreatData(r);
        } catch {
            setThreatData({ threatened: null, alerts: ['Failed to fetch — Foxhole API may be unavailable.'] });
        } finally {
            setAlertLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!confirmDelete) { setConfirmDelete(true); return; }
        try { await api.bases.remove(id); navigate('/bases'); }
        catch (err) { alert(err.message); setConfirmDelete(false); }
    };

    if (loading) return (
        <RoleGuard><div style={{ display: 'flex', minHeight: '100vh' }}><Sidebar /><main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div className="spinner" /></main></div></RoleGuard>
    );
    if (!base) return null;

    // Determine display: prefer freshly-fetched threatData, fall back to cached base.alerts
    const displayAlerts = threatData?.alerts ?? base.alerts ?? [];
    const isThreatened = threatData ? threatData.threatened : base.alerts?.some(a => a.includes('⚠'));

    return (
        <RoleGuard>
            <div style={{ display: 'flex', minHeight: '100vh' }}>
                <Sidebar />
                <main style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>
                    <div className="fade-up" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <h2 style={{ margin: '0 0 .25rem', fontSize: '1.75rem' }}>{base.name}</h2>
                            <p style={{ margin: 0, color: 'var(--text3)', fontSize: '.875rem' }}>
                                {base.region} › {base.subRegion}{base.landmark ? ` › ${base.landmark}` : ''}
                            </p>
                        </div>
                        <div style={{ display: 'flex', gap: '.5rem', alignItems: 'center' }}>
                            {saving && <span style={{ color: 'var(--text3)', fontSize: '.8rem' }}>Saving…</span>}
                            {hasRole('Admin') && (
                                <button
                                    className={`btn btn-sm ${confirmDelete ? 'btn-primary' : 'btn-danger'}`}
                                    onClick={handleDelete}
                                    onBlur={() => setConfirmDelete(false)}
                                >
                                    {confirmDelete ? 'Confirm Delete?' : 'Delete Base'}
                                </button>
                            )}
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                        <div className="card fade-up">
                            <h3 style={{ margin: '0 0 1rem', fontSize: '1rem' }}>Checklist</h3>
                            <Checklist items={base.checklist} onChange={hasRole('Trusted') ? handleChecklistChange : undefined} readOnly={!hasRole('Trusted')} />
                        </div>

                        <div className="card fade-up">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem' }}>
                                    <h3 style={{ margin: 0, fontSize: '1rem' }}>Threat Intel</h3>
                                    {isThreatened === true && <span className="badge badge-red">⚠ THREAT</span>}
                                    {isThreatened === false && <span className="badge badge-green">✓ CLEAR</span>}
                                </div>
                                <button className="btn btn-ghost btn-sm" onClick={fetchAlerts} disabled={alertLoading}>
                                    {alertLoading ? 'Fetching…' : '↻ Refresh'}
                                </button>
                            </div>
                            {displayAlerts.length === 0 && !alertLoading && (
                                <p style={{ color: 'var(--text3)', fontSize: '.875rem' }}>Click Refresh to check Warden presence via the Foxhole API.</p>
                            )}
                            {displayAlerts.map((a, i) => (
                                <div key={i} className={`alert-bar ${a.includes('⚠') ? 'alert-danger' : a.includes('Colonial') ? 'alert-info' : 'alert-ok'}`}>
                                    {a}
                                </div>
                            ))}
                            {base.alertsUpdatedAt && (
                                <p style={{ color: 'var(--text3)', fontSize: '.7rem', marginTop: '.75rem' }}>
                                    Last updated: {new Date(base.alertsUpdatedAt).toLocaleString()}
                                </p>
                            )}
                        </div>

                        {base.notes && (
                            <div className="card fade-up" style={{ gridColumn: '1/-1' }}>
                                <h3 style={{ margin: '0 0 .75rem', fontSize: '1rem' }}>Notes</h3>
                                <p style={{ color: 'var(--text2)', fontSize: '.875rem', margin: 0, whiteSpace: 'pre-wrap' }}>{base.notes}</p>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </RoleGuard>
    );
}
