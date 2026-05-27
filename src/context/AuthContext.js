import { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';

const AuthContext = createContext(null);

const SESSION_KEY = 'choir_user_session';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoadingSession, setIsLoadingSession] = useState(true);

  // Restore session on startup
  useEffect(() => {
    SecureStore.getItemAsync(SESSION_KEY)
      .then(raw => {
        if (raw) {
          setUser(JSON.parse(raw));
        }
      })
      .catch(() => {})
      .finally(() => setIsLoadingSession(false));
  }, []);

  const login = async (member) => {
    setUser(member);
    await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(member));
  };

  const logout = async () => {
    setUser(null);
    await SecureStore.deleteItemAsync(SESSION_KEY);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoadingSession }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
