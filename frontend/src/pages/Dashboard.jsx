import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import RoleGuard from '../components/RoleGuard';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';

function StatCard({ label, value, icon, color = 'var(--accent)' }) {
    return (
        <div className="card">
            <div style={{ fontSize: '1.4rem' }}>{icon}</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 700, color, fontFamily: 'var(--font-head)' }}>{value}</div>
            <div style={{ fontSize: '.78rem', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.05em' }}>{label}</div>
        </div>
    );
}

export default function Dashboard() {
    const { user } = useAuth();
    const [bases, setBases] = useState([]);
    const [missions, setMissions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([api.bases.list(), api.missions.list()])
            .then(([b, m]) => { setBases(b); setMissions(m); })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const active = missions.filter(m => m.status === 'Active').length;
    const planning = missions.filter(m => m.status === 'Planning').length;
    const complete = missions.filter(m => m.status === 'Complete').length;
    const alerts = bases.filter(b => b.alerts?.some(a => a.includes('⚠'))).length;

    return (
        <RoleGuard>
            <div style={{ display: 'flex', minHeight: '100vh' }}>
                <Sidebar />
                <main style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>
                    <div className="fade-up" style={{ marginBottom: '2rem' }}>
                        <h2 style={{ fontSize: '1.75rem', margin: '0 0 .25rem' }}>
                            Welcome, <span style={{ color: 'var(--accent)' }}>{user?.username}</span>
                        </h2>
                        <p style={{ color: 'var(--text3)', fontSize: '.875rem', margin: 0 }}>Regiment situation overview</p>
                    </div>

                    <div className="fade-up" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))', gap: '1rem', marginBottom: '2rem' }}>
                        <StatCard label="Total Bases" value={loading ? '…' : bases.length} icon="🏗" />
                        <StatCard label="Bases on Alert" value={loading ? '…' : alerts} icon="⚠️" color="var(--red)" />
                        <StatCard label="Active Missions" value={loading ? '…' : active} icon="🎯" color="var(--green)" />
                        <StatCard label="In Planning" value={loading ? '…' : planning} icon="📋" color="var(--blue)" />
                        <StatCard label="Completed" value={loading ? '…' : complete} icon="✓" color="var(--text2)" />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                        <div className="card fade-up">
                            <h3 style={{ margin: '0 0 1rem', fontSize: '1rem' }}>Recent Bases</h3>
                            {loading ? <div style={{ display: 'flex', justifyContent: 'center' }}><div className="spinner" /></div>
                                : bases.length === 0 ? <p style={{ color: 'var(--text3)', textAlign: 'center' }}>No bases yet.</p>
                                    : bases.slice(0, 5).map(b => (
                                        <div key={b._id} style={{ padding: '.5rem 0', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div>
                                                <Link to={`/bases/${b._id}`} style={{ color: 'var(--accent)', textDecoration: 'none', fontSize: '.875rem' }}>{b.name}</Link>
                                                <div style={{ fontSize: '.75rem', color: 'var(--text3)' }}>{b.region} › {b.subRegion}</div>
                                            </div>
                                            {b.alerts?.some(a => a.includes('⚠')) && <span className="badge badge-red">Alert</span>}
                                        </div>
                                    ))}
                        </div>

                        <div className="card fade-up">
                            <h3 style={{ margin: '0 0 1rem', fontSize: '1rem' }}>Recent Missions</h3>
                            {loading ? <div style={{ display: 'flex', justifyContent: 'center' }}><div className="spinner" /></div>
                                : missions.length === 0 ? <p style={{ color: 'var(--text3)', textAlign: 'center' }}>No missions yet.</p>
                                    : missions.slice(0, 5).map(m => (
                                        <div key={m._id} style={{ padding: '.5rem 0', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between' }}>
                                            <Link to={`/missions/${m._id}`} style={{ color: 'var(--accent)', textDecoration: 'none', fontSize: '.875rem' }}>{m.title}</Link>
                                            <span className={`badge status-${m.status.toLowerCase()}`}>{m.status}</span>
                                        </div>
                                    ))}
                        </div>
                    </div>
                </main>
            </div>
        </RoleGuard>
    );
}
