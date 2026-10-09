import apiClient, { isMockMode } from './client';
import { getMockInsights } from './mockData';

export async function getInsights(userId, period) {
  if (isMockMode()) {
    return Promise.resolve(getMockInsights(userId, period));
  }

  const params = {};
  if (userId !== undefined && userId !== null) params.user_id = userId;
  if (period) params.period = period;

  const response = await apiClient.get('/api/insights', { params });
  return response.data;
}
