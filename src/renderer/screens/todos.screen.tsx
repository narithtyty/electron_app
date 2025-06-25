import { useState, useEffect } from 'react';
import { safeIpcInvoke, openDevTools } from '../utils/electron';

// Test console log at module level
console.log('🎯 TodosScreen module loaded at:', new Date().toISOString());
console.log('🌍 Window object available:', typeof window !== 'undefined');
console.log('🔧 Console methods available:', {
  log: typeof console.log,
  warn: typeof console.warn,
  error: typeof console.error
});

interface Todo {
  userId: number;
  id: number;
  title: string;
  completed: boolean;
}

export function TodosScreen() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Debug: Component mounted
  console.log('🚀 TodosScreen component mounted');
  console.log('📊 Current state:', { todosLength: todos.length, loading, error });

  useEffect(() => {
    const fetchTodos = async () => {
      try {
        setLoading(true);
        console.log('🔄 Attempting to fetch data...');
        console.log('🔧 Environment check:', {
          isDev: process.env.NODE_ENV === 'development',
          userAgent: navigator.userAgent.includes('Electron')
        });        const data = await safeIpcInvoke('fetch-todos');
        console.log('✅ Data received from main process:', data);
        console.log('📝 Data type:', typeof data);
        console.log('📊 Data length:', Array.isArray(data) ? data.length : 'Not an array');

        if (Array.isArray(data) && data.length > 0) {
          console.log('🎯 First todo item:', data[0]);
        }

        setTodos(data.slice(0, 10)); // Use slice instead of splice to avoid mutating the original array
        setError(null);
        console.log('✅ State updated successfully');
      } catch (error) {
        console.error('❌ Error receiving data:', error);
        console.error('🔍 Error details:', error);
        setError(`Failed to fetch todos: ${error instanceof Error ? error.message : String(error)}`);
        setTodos([]); // Clear todos on error
      } finally {
        setLoading(false);
        console.log('🏁 Fetch operation completed');
      }
    };

    fetchTodos();
  }, []); // Empty dependency array means this effect runs once on mount

  if (loading) {
    return <div>Loading todos...</div>;
  }

  if (error) {
    return <div>Error fetching todos: {error}</div>;
  }

  const handleOpenDevTools = () => {
    console.log('🔧 Opening DevTools...');
    openDevTools();
  };

  const handleTestConsole = () => {
    console.log('🧪 Test console log from React component');
    console.warn('⚠️ Test warning log');
    console.error('❌ Test error log');
    alert('Check the console for test logs!');
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Todo List Examples</h1>

      {/* Debug buttons */}
      <div className="mb-4 space-x-2">
        <button
          onClick={handleTestConsole}
          className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
        >
          Test Console Logs
        </button>
        <button
          onClick={handleOpenDevTools}
          className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
        >
          Open DevTools (F12)
        </button>
      </div>

      <p className="mb-4 text-sm text-gray-600">
        Showing {todos.length} todos (fetched from JSONPlaceholder API)
      </p>
      <ul>
        {todos.map(todo => (
          <li key={todo.id} className={`border-b py-2 ${todo.completed ? 'line-through text-gray-500' : ''}`}>
            <span className="font-medium">#{todo.id}</span> - {todo.title}
          </li>
        ))}
      </ul>
    </div>
  );
}
