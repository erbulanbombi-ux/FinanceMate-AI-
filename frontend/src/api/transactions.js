import apiClient, { isMockMode } from './client';
import {
  getMockTransactions,
  addMockTransaction,
  deleteMockTransaction,
} from './mockData';

export async function getTransactions(userId, period) {
  if (isMockMode()) {
    return Promise.resolve(getMockTransactions(userId, period));
  }

  const params = {};
  if (userId !== undefined && userId !== null) params.user_id = userId;
  if (period) params.period = period;

  const response = await apiClient.get('/api/transactions', { params });
  return response.data;
}

export async function addTransaction(data) {
  if (isMockMode()) {
    return Promise.resolve(addMockTransaction(data));
  }

  const response = await apiClient.post('/api/transactions', data);
  return response.data;
}

export async function deleteTransaction(transactionId, userId) {
  if (isMockMode()) {
    return Promise.resolve(deleteMockTransaction(transactionId));
  }

  const params = {};
  if (userId !== undefined && userId !== null) params.user_id = userId;

  const response = await apiClient.delete(`/api/transactions/${transactionId}`, {
    params,
  });
  return response.data;
}
