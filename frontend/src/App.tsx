import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import LoginPage from './pages/LoginPage';
import MainPage from './pages/MainPage';

/**
 * КОРНЕВОЙ КОМПОНЕНТ ПРИЛОЖЕНИЯ
 * Настраивает маршрутизацию и оборачивает всё в AuthProvider.
 *
 * Маршруты:
 *   /      — главная с таблицей байков (публичная, просмотр без входа)
 *   /login — страница входа (для mechanic / admin)
 */
function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<MainPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
