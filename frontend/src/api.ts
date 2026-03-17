import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
});

// Добавляем параметр status
export const getBikes = async (status: string = '') => {
  const response = await api.get(`/bikes${status ? `?status=${status}` : ''}`);
  return response.data;
};

export const createBike = async (bikeData: any) => {
  const response = await api.post('/bikes', bikeData);
  return response.data;
};
