import { getApiBaseUrl } from './api';

export type Todo = {
	_id: string;
	title: string;
	description?: string;
	status?: 'pending' | 'in-progress' | 'completed';
	priority?: 'low' | 'medium' | 'high';
	dueDate?: string;
	createdAt?: string;
	updatedAt?: string;
};

function authHeaders() {
	if (typeof window !== 'undefined') {
		const token = localStorage.getItem('auth_token');
		return token ? { Authorization: `Bearer ${token}` } : {};
	}
	return {};
}

export async function listTodos(): Promise<Todo[]> {
	const res = await fetch(`${getApiBaseUrl()}/api/todos`, { headers: { ...authHeaders() } });
	if (!res.ok) throw new Error('Failed to fetch todos');
	return res.json();
}

export async function createTodo(data: Partial<Todo>): Promise<Todo> {
	const res = await fetch(`${getApiBaseUrl()}/api/todos`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json', ...authHeaders() },
		body: JSON.stringify(data),
	});
	if (!res.ok) throw new Error('Failed to create todo');
	return res.json();
}

export async function updateTodo(id: string, data: Partial<Todo>): Promise<Todo> {
	const res = await fetch(`${getApiBaseUrl()}/api/todos/${id}`, {
		method: 'PUT',
		headers: { 'Content-Type': 'application/json', ...authHeaders() },
		body: JSON.stringify(data),
	});
	if (!res.ok) throw new Error('Failed to update todo');
	return res.json();
}

export async function deleteTodo(id: string): Promise<void> {
	const res = await fetch(`${getApiBaseUrl()}/api/todos/${id}`, {
		method: 'DELETE',
		headers: { ...authHeaders() },
	});
	if (!res.ok) throw new Error('Failed to delete todo');
}
