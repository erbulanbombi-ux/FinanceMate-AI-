import apiClient, { isMockMode } from './client';
import { getMockBudget, setMockBudget } from './mockData';

export async function getBudget(userId, period) {
  if (isMockMode()) {
    return Promise.resolve(getMockBudget(userId, period));
  }

  const params = {};
  if (userId !== undefined && userId !== null) params.user_id = userId;
  if (period) params.period = period;

  const response = await apiClient.get('/api/budget', { params });
  return response.data;
}

export async function setBudget(data) {
  if (isMockMode()) {
    return Promise.resolve(setMockBudget(data));
  }

  const response = await apiClient.post('/api/budget', data);
  return response.data;
}
