import axios from 'axios';
import { ipcMain } from 'electron';

interface Todo {
  userId: number;
  id: number;
  title: string;
  completed: boolean;
}

export function setupIpcHandlers() {
  console.log('Setting up IPC handlers...');

  ipcMain.handle('fetch-data', async () => {
    try {
      console.log('fetch-data handler called');
      const response = await axios.get<Todo[]>('https://jsonplaceholder.typicode.com/todos');
      console.log('API response received, data length:', response.data.length);
      return response.data;
    } catch (error) {
      console.error('Error fetching todos:', error);
      throw error;
    }
  });

  console.log('IPC handlers setup complete');
}