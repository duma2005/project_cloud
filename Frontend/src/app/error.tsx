'use client';

export default function ErrorPage({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="container">
      <div className="card p-6 space-y-3">
        <h1 className="text-xl font-semibold">Something went wrong</h1>
        <div className="text-sm text-muted">{error.message}</div>
        <button className="focus-ring rounded-md bg-accent px-4 py-2 font-medium text-black" onClick={reset}>
          Retry
        </button>
      </div>
    </div>
  );
}
