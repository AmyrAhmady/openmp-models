export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
export type RequestValue = string | number | boolean | null | undefined;
export type RequestData = Record<string, RequestValue>;

export class ApiRequestError extends Error {
    readonly status: number;

    constructor(message: string, status: number) {
        super(message);
        this.name = 'ApiRequestError';
        this.status = status;
    }
}

export interface RequestOptions<Response> {
    signal?: AbortSignal;
    parse: (value: unknown) => Response;
}

export async function request<Request extends RequestData, Response>(
    method: HttpMethod,
    path: string,
    data: Request | undefined,
    options: RequestOptions<Response>
): Promise<Response> {
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    const query =
        method === 'GET' && data
            ? Object.entries(data).filter(([, value]) => value !== undefined && value !== null)
            : [];
    const queryString = query.length
        ? `?${new URLSearchParams(query.map(([key, value]) => [key, String(value)]))}`
        : '';

    const requestInit: RequestInit = { method };
    if (options?.signal) {
        requestInit.signal = options.signal;
    }
    if (method !== 'GET') {
        requestInit.body = JSON.stringify(data);
        requestInit.headers = { 'Content-Type': 'application/json' };
    }

    const response = await fetch(`${normalizedPath}${queryString}`, requestInit);

    if (!response.ok) {
        throw new ApiRequestError(`Request to ${normalizedPath} failed.`, response.status);
    }

    let body: unknown;
    try {
        body = await response.json();
    } catch {
        throw new ApiRequestError(`Invalid JSON response from ${normalizedPath}.`, response.status);
    }

    return options.parse(body);
}
