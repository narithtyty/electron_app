import { useState, useEffect } from 'react';
import { safeIpcInvoke } from '../utils/electron';
import { Button } from '../components/button';
import { useAuth } from '../contexts/AuthContext';

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

export function ApiDemoScreen() {
  const { user } = useAuth();
  const [todos, setTodos] = useState<Todo[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState<Record<string, boolean>>({});

  // Helper function to set loading state for specific API
  const setApiLoading = (apiName: string, isLoading: boolean) => {
    setLoading(prev => ({ ...prev, [apiName]: isLoading }));
  };

  // Fetch todos
  const fetchTodos = async () => {
    try {
      setApiLoading('todos', true);
      const data = await safeIpcInvoke('fetch-todos');
      setTodos(data.slice(0, 10)); // Show first 10
      console.log('✅ Todos fetched:', data.length);
    } catch (error) {
      console.error('❌ Error fetching todos:', error);
    } finally {
      setApiLoading('todos', false);
    }
  };

  // Fetch users
  const fetchUsers = async () => {
    try {
      setApiLoading('users', true);
      const data = await safeIpcInvoke('fetch-users');
      setUsers(data);
      console.log('✅ Users fetched:', data.length);
    } catch (error) {
      console.error('❌ Error fetching users:', error);
    } finally {
      setApiLoading('users', false);
    }
  };

  // Fetch posts
  const fetchPosts = async () => {
    try {
      setApiLoading('posts', true);
      const data = await safeIpcInvoke('fetch-posts');
      setPosts(data.slice(0, 10)); // Show first 10
      console.log('✅ Posts fetched:', data.length);
    } catch (error) {
      console.error('❌ Error fetching posts:', error);
    } finally {
      setApiLoading('posts', false);
    }
  };

  // Fetch comments
  const fetchComments = async () => {
    try {
      setApiLoading('comments', true);
      const data = await safeIpcInvoke('fetch-comments');
      setComments(data.slice(0, 10)); // Show first 10
      console.log('✅ Comments fetched:', data.length);
    } catch (error) {
      console.error('❌ Error fetching comments:', error);
    } finally {
      setApiLoading('comments', false);
    }
  };

  // Fetch specific user by ID
  const fetchUserById = async (userId: number) => {
    try {
      setApiLoading('userById', true);
      const user = await safeIpcInvoke('fetch-user-by-id', userId);
      setSelectedUser(user);
      console.log('✅ User fetched:', user);
    } catch (error) {
      console.error('❌ Error fetching user:', error);
    } finally {
      setApiLoading('userById', false);
    }
  };

  // Fetch posts by user ID
  const fetchPostsByUser = async (userId: number) => {
    try {
      setApiLoading('userPosts', true);
      const posts = await safeIpcInvoke('fetch-posts-by-user', userId);
      setUserPosts(posts);
      console.log('✅ User posts fetched:', posts.length);
    } catch (error) {
      console.error('❌ Error fetching user posts:', error);
    } finally {
      setApiLoading('userPosts', false);
    }
  };

  // Fetch all data at once
  const fetchAllData = async () => {
    await Promise.all([
      fetchTodos(),
      fetchUsers(),
      fetchPosts(),
      fetchComments()
    ]);
  };

  // Auto-fetch users on component mount
  useEffect(() => {
    fetchUsers();
  }, []);

  return (    <div className="container mx-auto p-6 max-w-6xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">API Demo - Multiple Endpoints</h1>
        {user && (
          <div className="text-right">
            <p className="text-sm text-gray-600">Logged in as:</p>
            <p className="font-semibold text-blue-600">{user.username}</p>
          </div>
        )}
      </div>
      
      {/* Control Panel */}
      <div className="mb-8 p-4 bg-gray-50 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">API Controls</h2>
        <div className="flex flex-wrap gap-2">
          <Button 
            onClick={fetchTodos} 
            disabled={loading.todos}
            size="sm"
          >
            {loading.todos ? 'Loading...' : 'Fetch Todos'}
          </Button>
          <Button 
            onClick={fetchUsers} 
            disabled={loading.users}
            size="sm"
          >
            {loading.users ? 'Loading...' : 'Fetch Users'}
          </Button>
          <Button 
            onClick={fetchPosts} 
            disabled={loading.posts}
            size="sm"
          >
            {loading.posts ? 'Loading...' : 'Fetch Posts'}
          </Button>
          <Button 
            onClick={fetchComments} 
            disabled={loading.comments}
            size="sm"
          >
            {loading.comments ? 'Loading...' : 'Fetch Comments'}
          </Button>
          <Button 
            onClick={fetchAllData} 
            variant="primary"
            size="sm"
          >
            Fetch All Data
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Todos Section */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-3">Todos ({todos.length})</h3>
          {todos.length > 0 ? (
            <ul className="space-y-2 max-h-40 overflow-y-auto">
              {todos.map(todo => (
                <li key={todo.id} className={`text-sm ${todo.completed ? 'line-through text-gray-500' : ''}`}>
                  #{todo.id}: {todo.title}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">No todos loaded. Click "Fetch Todos" to load.</p>
          )}
        </div>

        {/* Users Section */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-3">Users ({users.length})</h3>
          {users.length > 0 ? (
            <ul className="space-y-2 max-h-40 overflow-y-auto">
              {users.map(user => (
                <li key={user.id} className="text-sm">
                  <button
                    onClick={() => fetchUserById(user.id)}
                    className="text-blue-600 hover:underline"
                  >
                    {user.name} (@{user.username})
                  </button>
                  <button
                    onClick={() => fetchPostsByUser(user.id)}
                    className="ml-2 text-green-600 hover:underline text-xs"
                  >
                    [Posts]
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">Loading users...</p>
          )}
        </div>

        {/* Posts Section */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-3">Posts ({posts.length})</h3>
          {posts.length > 0 ? (
            <ul className="space-y-2 max-h-40 overflow-y-auto">
              {posts.map(post => (
                <li key={post.id} className="text-sm">
                  <strong>#{post.id}:</strong> {post.title}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">No posts loaded. Click "Fetch Posts" to load.</p>
          )}
        </div>

        {/* Comments Section */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-3">Comments ({comments.length})</h3>
          {comments.length > 0 ? (
            <ul className="space-y-2 max-h-40 overflow-y-auto">
              {comments.map(comment => (
                <li key={comment.id} className="text-sm">
                  <strong>{comment.name}:</strong> {comment.body.substring(0, 50)}...
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">No comments loaded. Click "Fetch Comments" to load.</p>
          )}
        </div>
      </div>

      {/* Selected User Details */}
      {selectedUser && (
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="text-lg font-semibold mb-3">Selected User Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p><strong>Name:</strong> {selectedUser.name}</p>
              <p><strong>Username:</strong> {selectedUser.username}</p>
              <p><strong>Email:</strong> {selectedUser.email}</p>
              <p><strong>Phone:</strong> {selectedUser.phone}</p>
              <p><strong>Website:</strong> {selectedUser.website}</p>
            </div>
            <div>
              <p><strong>Company:</strong> {selectedUser.company.name}</p>
              <p><strong>Address:</strong> {selectedUser.address.street}, {selectedUser.address.city}</p>
              <p><strong>Zipcode:</strong> {selectedUser.address.zipcode}</p>
            </div>
          </div>
        </div>
      )}

      {/* User Posts */}
      {userPosts.length > 0 && (
        <div className="mt-6 p-4 bg-green-50 rounded-lg">
          <h3 className="text-lg font-semibold mb-3">Posts by Selected User ({userPosts.length})</h3>
          <ul className="space-y-3">
            {userPosts.map(post => (
              <li key={post.id} className="border-b pb-2">
                <h4 className="font-medium">#{post.id}: {post.title}</h4>
                <p className="text-sm text-gray-600 mt-1">{post.body}</p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Text Selection Demo */}
      <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
        <h3 className="text-lg font-semibold mb-3">📝 Text Selection Test</h3>
        <div className="space-y-2">
          <p className="text-selectable">
            <strong>Try selecting this text:</strong> You should now be able to select and copy this text. 
            Use Ctrl+C (Cmd+C on Mac) to copy, or right-click for context menu.
          </p>
          <p className="text-selectable text-sm text-gray-600">
            <strong>Instructions:</strong> Select any text in this section, right-click to see the context menu, 
            or use keyboard shortcuts (Ctrl+C to copy, Ctrl+A to select all).
          </p>
          <div className="mt-3 p-3 bg-white rounded border">
            <h4 className="font-medium text-selectable">Sample Content to Copy:</h4>
            <ul className="mt-2 space-y-1 text-selectable">
              <li>• API Endpoint: https://jsonplaceholder.typicode.com/users</li>
              <li>• Sample User ID: 1</li>
              <li>• Sample Email: john@example.com</li>
              <li>• Copy this JSON: {`{"id": 1, "name": "John Doe", "email": "john@example.com"}`}</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Todos Section */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-3">Todos ({todos.length})</h3>
          {todos.length > 0 ? (
            <ul className="space-y-2 max-h-40 overflow-y-auto">
              {todos.map(todo => (
                <li key={todo.id} className={`text-sm ${todo.completed ? 'line-through text-gray-500' : ''}`}>
                  #{todo.id}: {todo.title}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">No todos loaded. Click "Fetch Todos" to load.</p>
          )}
        </div>

        {/* Users Section */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-3">Users ({users.length})</h3>
          {users.length > 0 ? (
            <ul className="space-y-2 max-h-40 overflow-y-auto">
              {users.map(user => (
                <li key={user.id} className="text-sm">
                  <button
                    onClick={() => fetchUserById(user.id)}
                    className="text-blue-600 hover:underline"
                  >
                    {user.name} (@{user.username})
                  </button>
                  <button
                    onClick={() => fetchPostsByUser(user.id)}
                    className="ml-2 text-green-600 hover:underline text-xs"
                  >
                    [Posts]
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">Loading users...</p>
          )}
        </div>

        {/* Posts Section */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-3">Posts ({posts.length})</h3>
          {posts.length > 0 ? (
            <ul className="space-y-2 max-h-40 overflow-y-auto">
              {posts.map(post => (
                <li key={post.id} className="text-sm">
                  <strong>#{post.id}:</strong> {post.title}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">No posts loaded. Click "Fetch Posts" to load.</p>
          )}
        </div>

        {/* Comments Section */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-3">Comments ({comments.length})</h3>
          {comments.length > 0 ? (
            <ul className="space-y-2 max-h-40 overflow-y-auto">
              {comments.map(comment => (
                <li key={comment.id} className="text-sm">
                  <strong>{comment.name}:</strong> {comment.body.substring(0, 50)}...
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">No comments loaded. Click "Fetch Comments" to load.</p>
          )}
        </div>
      </div>

      {/* Selected User Details */}
      {selectedUser && (
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="text-lg font-semibold mb-3">Selected User Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p><strong>Name:</strong> {selectedUser.name}</p>
              <p><strong>Username:</strong> {selectedUser.username}</p>
              <p><strong>Email:</strong> {selectedUser.email}</p>
              <p><strong>Phone:</strong> {selectedUser.phone}</p>
              <p><strong>Website:</strong> {selectedUser.website}</p>
            </div>
            <div>
              <p><strong>Company:</strong> {selectedUser.company.name}</p>
              <p><strong>Address:</strong> {selectedUser.address.street}, {selectedUser.address.city}</p>
              <p><strong>Zipcode:</strong> {selectedUser.address.zipcode}</p>
            </div>
          </div>
        </div>
      )}

      {/* User Posts */}
      {userPosts.length > 0 && (
        <div className="mt-6 p-4 bg-green-50 rounded-lg">
          <h3 className="text-lg font-semibold mb-3">Posts by Selected User ({userPosts.length})</h3>
          <ul className="space-y-3">
            {userPosts.map(post => (
              <li key={post.id} className="border-b pb-2">
                <h4 className="font-medium">#{post.id}: {post.title}</h4>
                <p className="text-sm text-gray-600 mt-1">{post.body}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
