import apiClient, { isMockMode } from './client';
import { getMockForecast } from './mockData';

export async function getForecast(userId, period) {
  if (isMockMode()) {
    return Promise.resolve(getMockForecast(userId, period));
  }

  const params = {};
  if (userId !== undefined && userId !== null) params.user_id = userId;
  if (period) params.period = period;

  const response = await apiClient.get('/api/forecast', { params });
  return response.data;
}
