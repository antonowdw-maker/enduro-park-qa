import axios from 'axios';

const api = axios.create({
  baseURL: '/api', // Благодаря proxy в vite.config, это перенаправит на порт 5000
});

export const getBikes = async () => {
  const response = await api.get('/bikes');
  return response.data;
};