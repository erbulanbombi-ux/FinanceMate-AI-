import apiClient, { isMockMode } from './client';
import { getMockChatReply } from './mockData';

export async function sendChatMessage(data) {
  if (isMockMode()) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          reply: getMockChatReply(data.message || data.prompt || ''),
        });
      }, 700);
    });
  }

  const response = await apiClient.post('/api/chat', data);
  return response.data;
}
