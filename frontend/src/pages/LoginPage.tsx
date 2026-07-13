import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { Bike, LogIn, Lock, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

/**
 * СТРАНИЦА ВХОДА (/login)
 * Требования: F-AUTH-01, F-AUTH-03
 * data-testid: input-username, input-password, login-btn, login-error-message
 */
export default function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();

  // --- СОСТОЯНИЯ ФОРМЫ ---
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Уже залогинен — не показываем форму, уходим на главную
  if (user) {
    return <Navigate to="/" replace />;
  }

  // --- ОБРАБОТКА ОТПРАВКИ ФОРМЫ ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await login(username, password);
      // Успех — редирект на главную (F-AUTH-02)
      navigate('/', { replace: true });
    } catch (err) {
      // Ошибка 401 — показываем текст под формой, не alert (F-AUTH-03)
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        setError(err.response.data?.error || 'Неверные учётные данные');
      } else {
        setError('Не удалось выполнить вход. Попробуйте позже.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
      <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md border border-slate-200">
        {/* Шапка формы */}
        <div className="flex flex-col items-center mb-8">
          <div className="bg-blue-600 p-4 rounded-full text-white mb-4 shadow-lg shadow-blue-900/20">
            <Bike size={40} />
          </div>
          <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Enduro Park Manager</h1>
          <p className="text-slate-400 text-sm mt-1 text-center font-medium uppercase tracking-tighter">
            Вход в систему управления
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Поле: имя пользователя */}
          <div className="relative">
            <User className="absolute left-3 top-3 text-slate-400" size={18} />
            <input
              data-testid="input-username"
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 transition-all font-semibold"
              placeholder="Имя пользователя"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoComplete="username"
            />
          </div>

          {/* Поле: пароль */}
          <div className="relative">
            <Lock className="absolute left-3 top-3 text-slate-400" size={18} />
            <input
              data-testid="input-password"
              type="password"
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 transition-all font-semibold"
              placeholder="Пароль"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>

          {/* Сообщение об ошибке (видно только при неудачном входе) */}
          {error && (
            <p
              data-testid="login-error-message"
              className="text-sm text-rose-600 font-semibold text-center bg-rose-50 border border-rose-200 rounded-lg py-2 px-3"
            >
              {error}
            </p>
          )}

          <button
            data-testid="login-btn"
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold py-3 rounded-xl shadow-lg shadow-blue-200 transition-all active:scale-[0.98] flex items-center justify-center gap-2 uppercase tracking-wider"
          >
            <LogIn size={20} /> Войти
          </button>
        </form>

        <p className="mt-6 text-center">
          <Link
            to="/"
            data-testid="back-to-home-btn"
            className="text-xs font-bold uppercase tracking-widest text-slate-400 transition-colors hover:text-blue-600"
          >
            ← На главную без входа
          </Link>
        </p>
      </div>
    </div>
  );
}
