import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="container">
      <div className="card p-8 space-y-3">
        <h1 className="text-2xl font-semibold">Page not found</h1>
        <p className="text-muted">The page you are looking for doesn’t exist.</p>
        <Link className="text-accent hover:underline" href="/">
          Go home
        </Link>
      </div>
    </div>
  );
}
