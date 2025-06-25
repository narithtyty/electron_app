import axios from 'axios';
import { ipcMain } from 'electron';

interface Todo {
  userId: number;
  id: number;
  title: string;
  completed: boolean;
}

interface User {
  id: number;
  name: string;
  username: string;
  email: string;
  address: {
    street: string;
    suite: string;
    city: string;
    zipcode: string;
    geo: {
      lat: string;
      lng: string;
    };
  };
  phone: string;
  website: string;
  company: {
    name: string;
    catchPhrase: string;
    bs: string;
  };
}

interface Post {
  userId: number;
  id: number;
  title: string;
  body: string;
}

interface Comment {
  postId: number;
  id: number;
  name: string;
  email: string;
  body: string;
}

export function setupIpcHandlers() {
  console.log('Setting up IPC handlers...');

  // Fetch todos
  ipcMain.handle('fetch-todos', async () => {
    try {
      console.log('fetch-todos handler called');
      const response = await axios.get<Todo[]>('https://jsonplaceholder.typicode.com/todos');
      console.log('Todos API response received, data length:', response.data.length);
      return response.data;
    } catch (error) {
      console.error('Error fetching todos:', error);
      throw error;
    }
  });

  // Fetch users
  ipcMain.handle('fetch-users', async () => {
    try {
      console.log('fetch-users handler called');
      const response = await axios.get<User[]>('https://jsonplaceholder.typicode.com/users');
      console.log('Users API response received, data length:', response.data.length);
      return response.data;
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  });

  // Fetch posts
  ipcMain.handle('fetch-posts', async () => {
    try {
      console.log('fetch-posts handler called');
      const response = await axios.get<Post[]>('https://jsonplaceholder.typicode.com/posts');
      console.log('Posts API response received, data length:', response.data.length);
      return response.data;
    } catch (error) {
      console.error('Error fetching posts:', error);
      throw error;
    }
  });

  // Fetch comments
  ipcMain.handle('fetch-comments', async () => {
    try {
      console.log('fetch-comments handler called');
      const response = await axios.get<Comment[]>('https://jsonplaceholder.typicode.com/comments');
      console.log('Comments API response received, data length:', response.data.length);
      return response.data;
    } catch (error) {
      console.error('Error fetching comments:', error);
      throw error;
    }
  });

  // Fetch specific user by ID
  ipcMain.handle('fetch-user-by-id', async (event, userId: number) => {
    try {
      console.log('fetch-user-by-id handler called with ID:', userId);
      const response = await axios.get<User>(`https://jsonplaceholder.typicode.com/users/${userId}`);
      console.log('User API response received for ID:', userId);
      return response.data;
    } catch (error) {
      console.error('Error fetching user by ID:', error);
      throw error;
    }
  });

  // Fetch posts by user ID
  ipcMain.handle('fetch-posts-by-user', async (event, userId: number) => {
    try {
      console.log('fetch-posts-by-user handler called with user ID:', userId);
      const response = await axios.get<Post[]>(`https://jsonplaceholder.typicode.com/users/${userId}/posts`);
      console.log('Posts by user API response received, data length:', response.data.length);
      return response.data;
    } catch (error) {
      console.error('Error fetching posts by user:', error);
      throw error;
    }
  });

  // Legacy handler (keeping for backward compatibility)
  ipcMain.handle('fetch-data', async () => {
    try {
      console.log('fetch-data handler called (legacy)');
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