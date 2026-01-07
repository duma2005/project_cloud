import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About'
};

export default function AboutPage() {
  return (
    <div className="container space-y-4">
      <h1 className="text-2xl font-semibold">About</h1>
      <div className="card p-6 space-y-3 text-muted">
        <p>
          FilmConsensus is a movie discovery site inspired by IMDb, built around a curated movie catalog with ratings and
          metadata stored in the database.
        </p>
        <ul className="list-disc pl-6">
          <li>Search titles quickly with autocomplete.</li>
          <li>Browse popular and recent releases.</li>
          <li>Metadata is served directly from the catalog.</li>
        </ul>
      </div>
    </div>
  );
}
