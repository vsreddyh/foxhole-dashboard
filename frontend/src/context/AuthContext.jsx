/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api, getToken, setToken, clearToken } from '../lib/api';

const ROLES = ['Member', 'Trusted', 'Admin', 'Super Admin', 'Maintainer'];
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchMe = useCallback(async () => {
        if (!getToken()) { setLoading(false); return; }
        try {
            const me = await api.auth.me();
            setUser(me);
        } catch {
            clearToken();
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchMe(); }, [fetchMe]);

    const login = async (username, password) => {
        const { token, user: u } = await api.auth.login(username, password);
        setToken(token);
        setUser(u);
    };

    const logout = () => { clearToken(); setUser(null); };

    const hasRole = (minRole) => {
        if (!user) return false;
        return ROLES.indexOf(user.role) >= ROLES.indexOf(minRole);
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout, hasRole }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
