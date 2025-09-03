const DEFAULT_TIMEOUT_MS = 10000;

export const getApiBaseUrl = (): string => {
	if (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_API_URL) {
		return process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, '');
	}
	return 'http://localhost:3001';
};

function withTimeout<T>(promise: Promise<T>, ms = DEFAULT_TIMEOUT_MS): Promise<T> {
	return new Promise((resolve, reject) => {
		const t = setTimeout(() => reject(new Error(`Request timed out after ${ms}ms`)), ms);
		promise
			.then((v) => { clearTimeout(t); resolve(v); })
			.catch((e) => { clearTimeout(t); reject(e); });
	});
}

export type SignupPayload = { name: string; email: string; password: string };
export type LoginPayload = { email: string; password: string };

export async function signup(payload: SignupPayload) {
	try {
		const res = await withTimeout(fetch(`${getApiBaseUrl()}/api/auth/signup`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(payload),
		}));
		if (!res.ok) {
			const err = await res.json().catch(() => ({}));
			throw new Error(err?.message || `Signup failed: ${res.status}`);
		}
		return res.json();
	} catch (e: any) {
		throw new Error(e?.message || 'Network error');
	}
}

export async function login(payload: LoginPayload) {
	try {
		const res = await withTimeout(fetch(`${getApiBaseUrl()}/api/auth/login`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(payload),
		}));
		if (!res.ok) {
			const err = await res.json().catch(() => ({}));
			throw new Error(err?.message || `Login failed: ${res.status}`);
		}
		return res.json();
	} catch (e: any) {
		throw new Error(e?.message || 'Network error');
	}
}
