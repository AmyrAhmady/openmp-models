export interface ErrorReportContext {
    source: string;
    operation: string;
}

interface ErrorReportingGlobal {
    reportError?: (error: Error) => void;
}

function normalizeError(error: unknown): Error {
    if (error instanceof Error) {
        return error;
    }

    return new Error(typeof error === 'string' ? error : 'Unknown application error');
}

export function reportError(error: unknown, context: ErrorReportContext): void {
    const normalizedError = normalizeError(error);
    const globalWithReporter = globalThis as typeof globalThis & ErrorReportingGlobal;

    try {
        globalWithReporter.reportError?.(normalizedError);
    } catch {
        // A reporting integration must never replace the application error path.
    }

    console.error(`[${context.source}] ${context.operation}`, normalizedError);
}
