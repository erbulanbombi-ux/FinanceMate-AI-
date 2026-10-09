import apiClient, { isMockMode } from './client';
import { getMockSimulation } from './mockData';

export async function simulatePurchase(data) {
  if (isMockMode()) {
    return Promise.resolve(getMockSimulation(data));
  }

  const response = await apiClient.post('/api/simulate', data);
  return response.data;
}
