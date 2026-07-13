import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

/**
 * ЗАЩИЩЁННЫЙ МАРШРУТ (ProtectedRoute)
 * Оборачивает страницы, доступные только авторизованным пользователям.
 * С v2.1 главная публична; компонент оставлен для будущих закрытых страниц.
 */
export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500 font-semibold">
        Загрузка...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <>{children}</>;
}
