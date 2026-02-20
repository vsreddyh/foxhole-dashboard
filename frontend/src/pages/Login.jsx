import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
    const { login, user } = useAuth();
    const navigate = useNavigate();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    if (user) { navigate('/dashboard', { replace: true }); return null; }

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(''); setLoading(true);
        try { await login(username, password); navigate('/dashboard'); }
        catch (err) { setError(err.message); }
        finally { setLoading(false); }
    };

    return (
        <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'radial-gradient(ellipse at 50% 0%, rgba(200,168,75,.07) 0%, var(--bg) 65%)' }}>
            <div className="card fade-up" style={{ width: '100%', maxWidth: 380 }}>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <h1 style={{ fontSize: '2rem', color: 'var(--accent)', margin: '0 0 .25rem' }}>FOXHOLE</h1>
                    <p style={{ color: 'var(--text3)', fontSize: '.8rem', letterSpacing: '.15em', textTransform: 'uppercase', margin: 0 }}>Regiment HQ</p>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                        <label className="field-label">Username</label>
                        <input className="input" value={username} onChange={e => setUsername(e.target.value)} required autoComplete="username" />
                    </div>
                    <div>
                        <label className="field-label">Password</label>
                        <input className="input" type="password" value={password} onChange={e => setPassword(e.target.value)} required autoComplete="current-password" />
                    </div>

                    {error && <div className="alert-bar alert-danger" style={{ justifyContent: 'center' }}>⚠ {error}</div>}

                    <button type="submit" className="btn btn-primary" disabled={loading} style={{ justifyContent: 'center', marginTop: '.5rem' }}>
                        {loading ? <span className="spinner" style={{ width: '.9rem', height: '.9rem' }} /> : 'Sign In'}
                    </button>
                </form>

                <p style={{ textAlign: 'center', color: 'var(--text3)', fontSize: '.75rem', marginTop: '1.5rem' }}>
                    Access is restricted. Contact your Admin for an account.
                </p>
            </div>
        </main>
    );
}
