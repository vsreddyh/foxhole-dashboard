import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NAV = [
    { to: '/dashboard', label: 'Dashboard', icon: '⬡' },
    { to: '/bases', label: 'Bases', icon: '🏗' },
    { to: '/missions', label: 'Missions', icon: '🎯' },
    { to: '/users', label: 'Users', icon: '👥', minRole: 'Admin' },
];

const roleBadge = { Maintainer: 'badge-gold', 'Super Admin': 'badge-gold', Admin: 'badge-blue', Trusted: 'badge-green', Member: 'badge-gray' };

export default function Sidebar() {
    const { user, logout, hasRole } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => { logout(); navigate('/login'); };

    return (
        <aside style={{ width: 220, minHeight: '100vh', background: 'var(--bg-card)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', padding: '1.5rem 1rem', flexShrink: 0 }}>
            <div style={{ marginBottom: '2rem', paddingLeft: '.5rem' }}>
                <h1 style={{ fontFamily: 'var(--font-head)', fontSize: '1.4rem', color: 'var(--accent)', margin: 0, letterSpacing: '.1em' }}>FOXHOLE</h1>
                <div style={{ fontSize: '.68rem', color: 'var(--text3)', letterSpacing: '.15em', textTransform: 'uppercase' }}>Regiment HQ</div>
            </div>

            <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '.25rem' }}>
                {NAV.filter(n => !n.minRole || hasRole(n.minRole)).map(({ to, label, icon }) => (
                    <NavLink key={to} to={to} style={({ isActive }) => ({
                        display: 'flex', alignItems: 'center', gap: '.6rem',
                        padding: '.55rem .75rem', borderRadius: 6,
                        color: isActive ? 'var(--accent)' : 'var(--text2)',
                        background: isActive ? 'var(--accent-dim)' : 'transparent',
                        textDecoration: 'none', fontSize: '.875rem', fontWeight: 500,
                        transition: 'all .15s',
                    })}>
                        <span>{icon}</span>{label}
                    </NavLink>
                ))}
            </nav>

            {user && (
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem', marginTop: '1rem' }}>
                    <div style={{ fontSize: '.8rem', color: 'var(--text)', fontWeight: 600, marginBottom: '.25rem' }}>{user.username}</div>
                    <span className={`badge ${roleBadge[user.role] ?? 'badge-gray'}`} style={{ marginBottom: '.75rem', display: 'inline-block' }}>{user.role}</span>
                    <button onClick={handleLogout} className="btn btn-ghost btn-sm" style={{ width: '100%', justifyContent: 'center', marginTop: '.5rem' }}>
                        Log out
                    </button>
                </div>
            )}
        </aside>
    );
}
