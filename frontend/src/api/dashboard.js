import apiClient, { isMockMode } from './client';
import { getMockDashboard } from './mockData';

export async function getDashboard(userId, period) {
  if (isMockMode()) {
    return Promise.resolve(getMockDashboard(userId, period));
  }

  const params = {};
  if (userId !== undefined && userId !== null) params.user_id = userId;
  if (period) params.period = period;

  const response = await apiClient.get('/api/dashboard', { params });
  return response.data;
}
