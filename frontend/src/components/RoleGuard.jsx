import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function RoleGuard({ minRole = 'Member', children }) {
    const { user, loading, hasRole } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!loading) {
            if (!user) navigate('/login', { replace: true });
            else if (!hasRole(minRole)) navigate('/dashboard', { replace: true });
        }
    }, [user, loading, hasRole, minRole, navigate]);

    if (loading) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
            <div className="spinner" />
        </div>
    );
    if (!user || !hasRole(minRole)) return null;
    return children;
}
