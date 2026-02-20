import { useEffect, useState, useRef } from 'react';
import Sidebar from '../components/Sidebar';
import RoleGuard from '../components/RoleGuard';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';

const ROLES = ['Member', 'Trusted', 'Admin', 'Super Admin', 'Maintainer'];
const ROLE_BADGE = { Maintainer: 'badge-gold', 'Super Admin': 'badge-gold', Admin: 'badge-blue', Trusted: 'badge-green', Member: 'badge-gray' };

export default function Users() {
    const { user: currentUser, hasRole } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ username: '', password: '', role: 'Member' });
    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState('');
    const [roleUpdating, setRoleUpdating] = useState(null);
    const [deletingId, setDeletingId] = useState(null);
    const deleteTimer = useRef(null);

    const armDelete = (id) => {
        clearTimeout(deleteTimer.current);
        setDeletingId(id);
        deleteTimer.current = setTimeout(() => setDeletingId(null), 4000);
    };

    const fetchUsers = () => api.users.list().then(setUsers).finally(() => setLoading(false));
    useEffect(() => { fetchUsers(); }, []);

    const handleCreate = async (e) => {
        e.preventDefault(); setFormError(''); setSaving(true);
        try { await api.users.create(form); setForm({ username: '', password: '', role: 'Member' }); setShowForm(false); await fetchUsers(); }
        catch (err) { setFormError(err.message); }
        finally { setSaving(false); }
    };

    const handleRoleChange = async (id, role) => {
        setRoleUpdating(id);
        try { const u = await api.users.updateRole(id, role); setUsers(us => us.map(x => x._id === u._id ? u : x)); }
        catch (err) { alert(err.message); }
        finally { setRoleUpdating(null); }
    };

    const handleDelete = async (id) => {
        if (deletingId !== id) { armDelete(id); return; }
        clearTimeout(deleteTimer.current);
        setDeletingId(null);
        try { await api.users.remove(id); setUsers(us => us.filter(x => x._id !== id)); }
        catch (err) { alert(err.message); }
    };

    const currentIdx = ROLES.indexOf(currentUser?.role);
    // Maintainer role can never be assigned through the UI
    const maintainerIdx = ROLES.indexOf('Maintainer');
    const assignableRoles = ROLES.filter((_, i) => i < maintainerIdx && (currentUser?.role === 'Maintainer' || i < currentIdx));

    return (
        <RoleGuard minRole="Admin">
            <div style={{ display: 'flex', minHeight: '100vh' }}>
                <Sidebar />
                <main style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>
                    <div className="fade-up" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <div>
                            <h2 style={{ margin: 0, fontSize: '1.75rem' }}>Users</h2>
                            <p style={{ margin: 0, color: 'var(--text3)', fontSize: '.875rem' }}>Manage regiment members and roles</p>
                        </div>
                        <button className="btn btn-primary" onClick={() => setShowForm(s => !s)}>{showForm ? '✕ Cancel' : '+ New User'}</button>
                    </div>

                    {showForm && (
                        <div className="card fade-up" style={{ marginBottom: '1.5rem' }}>
                            <h3 style={{ margin: '0 0 1rem', fontSize: '1rem' }}>New User</h3>
                            <form onSubmit={handleCreate} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '.75rem' }}>
                                <div><label className="field-label">Username</label><input className="input" required autoComplete="off" value={form.username} onChange={e => setForm(p => ({ ...p, username: e.target.value }))} /></div>
                                <div><label className="field-label">Password</label><input className="input" type="password" required autoComplete="new-password" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} /></div>
                                <div>
                                    <label className="field-label">Role</label>
                                    <select className="input" value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))}>
                                        {assignableRoles.map(r => <option key={r} value={r}>{r}</option>)}
                                    </select>
                                </div>
                                {formError && <div className="alert-bar alert-danger" style={{ gridColumn: '1/-1' }}>{formError}</div>}
                                <div style={{ gridColumn: '1/-1', display: 'flex', gap: '.5rem' }}>
                                    <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Creating…' : 'Create User'}</button>
                                    <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
                                </div>
                            </form>
                        </div>
                    )}

                    {loading ? (
                        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}><div className="spinner" /></div>
                    ) : (
                        <div className="card fade-up table-wrap" style={{ padding: 0 }}>
                            <table>
                                <thead><tr><th>Username</th><th>Role</th><th>Joined</th><th>Actions</th></tr></thead>
                                <tbody>
                                    {users.map(u => {
                                        const isSelf = u._id === currentUser?._id;
                                        const targetIdx = ROLES.indexOf(u.role);
                                        const canModify = !isSelf && (currentUser?.role === 'Maintainer' || targetIdx < currentIdx);
                                        const canChangeRole = hasRole('Super Admin') && canModify;
                                        return (
                                            <tr key={u._id}>
                                                <td style={{ color: isSelf ? 'var(--accent)' : undefined, fontWeight: isSelf ? 600 : undefined }}>
                                                    {u.username} {isSelf && <span style={{ color: 'var(--text3)', fontSize: '.72rem' }}>(you)</span>}
                                                </td>
                                                <td>
                                                    {canChangeRole ? (
                                                        <select className="input" value={u.role} onChange={e => handleRoleChange(u._id, e.target.value)} disabled={roleUpdating === u._id} style={{ width: 'auto', padding: '.2rem .5rem', fontSize: '.8rem' }}>
                                                            {assignableRoles.map(r => <option key={r} value={r}>{r}</option>)}
                                                        </select>
                                                    ) : <span className={`badge ${ROLE_BADGE[u.role] ?? 'badge-gray'}`}>{u.role}</span>}
                                                </td>
                                                <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                                                <td>
                                                    {canModify && hasRole('Admin') && (
                                                        <button
                                                            className={`btn btn-sm ${deletingId === u._id ? 'btn-primary' : 'btn-danger'}`}
                                                            onClick={() => handleDelete(u._id)}
                                                        >
                                                            {deletingId === u._id ? 'Confirm?' : 'Remove'}
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
