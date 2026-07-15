import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { ensureCsrf, getMe, loginRequest, logoutRequest } from '../api';

/**
 * КОНТЕКСТ АВТОРИЗАЦИИ (AuthContext)
 * Хранит состояние текущего пользователя и предоставляет методы login/logout
 * всему приложению без «пробрасывания» props через каждый компонент.
 */

export type AuthUser = {
  id: string;
  username: string;
  role: string;
};

type AuthContextValue = {
  user: AuthUser | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Восстановление сессии при загрузке приложения (F5, перезаход на сайт)
  const restoreSession = useCallback(async () => {
    try {
      const data = await getMe();
      setUser(data);
    } catch {
      // Cookie нет или протухла — пользователь остается неавторизованным
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // CSRF cookie до любых мутаций (logout и т.д.)
    ensureCsrf()
      .catch(() => undefined)
      .finally(() => {
        restoreSession();
      });
  }, [restoreSession]);

  // Вход: отправляем логин/пароль на бэкенд, сохраняем пользователя в state
  const login = async (username: string, password: string) => {
    const data = await loginRequest({ username, password });
    setUser(data);
  };

  // Выход: очищаем cookie на сервере и сбрасываем state
  const logout = async () => {
    await logoutRequest();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

/** Хук для доступа к AuthContext из любого компонента */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
