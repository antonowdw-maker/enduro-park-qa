import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import MainPage from './pages/MainPage';

/**
 * КОРНЕВОЙ КОМПОНЕНТ ПРИЛОЖЕНИЯ
 * Настраивает маршрутизацию и оборачивает всё в AuthProvider.
 *
 * Маршруты:
 *   /login — страница входа (публичная)
 *   /      — главная с таблицей байков (только для авторизованных)
 */
function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Публичная страница входа */}
          <Route path="/login" element={<LoginPage />} />

          {/* Главная — защищена middleware на фронте (ProtectedRoute) */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <MainPage />
              </ProtectedRoute>
            }
          />

          {/* Любой неизвестный URL — на главную */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
