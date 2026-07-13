import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

/**
 * ЗАЩИЩЁННЫЙ МАРШРУТ (ProtectedRoute)
 * Оборачивает страницы, доступные только авторизованным пользователям.
 * QA-кейс TC-AUTH-07: без логина редирект на /login.
 */
export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  // Пока проверяем cookie через /me — показываем заглушку
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500 font-semibold">
        Загрузка...
      </div>
    );
  }

  // Не авторизован — отправляем на страницу входа
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <>{children}</>;
}
