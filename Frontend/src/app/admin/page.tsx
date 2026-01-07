'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { AuthGate } from '@/components/auth-gate';
import { useAuth } from '@/components/auth-provider';

type MovieSummary = {
  movie_id: number;
  title: string;
  release_date: string | null;
  imdb_score: number | null;
};

type GenreItem = {
  genre_id: number;
  name: string;
};

type PersonItem = {
  person_id: number;
  full_name: string;
  birth_date: string | null;
  avatar_url: string | null;
  bio: string | null;
};

type CastItem = {
  person_id: number;
  full_name: string;
  role: 'Director' | 'Writer' | 'Actor';
  character_name: string | null;
};

type HomepageSettings = {
  hero_movie_id: number | null;
  hero_tagline: string | null;
  top_ten_title: string | null;
  fan_favorites_title: string | null;
  new_arrivals_title: string | null;
  top_ten_ids: number[] | null;
  fan_favorites_ids: number[] | null;
  new_arrivals_ids: number[] | null;
};

type MovieForm = {
  title: string;
  originalTitle: string;
  releaseDate: string;
  durationMinutes: string;
  ageRating: string;
  imdbScore: string;
  imdbVoteCount: string;
  posterUrl: string;
  coverUrl: string;
  trailerUrl: string;
  genres: string;
  description: string;
  storyline: string;
};

type PersonForm = {
  fullName: string;
  birthDate: string;
  avatarUrl: string;
  bio: string;
};

type HomepageForm = {
  heroMovieId: string;
  heroTagline: string;
  topTenTitle: string;
  fanFavoritesTitle: string;
  newArrivalsTitle: string;
  topTenIds: string;
  fanFavoritesIds: string;
  newArrivalsIds: string;
};

const movieFormInitial: MovieForm = {
  title: '',
  originalTitle: '',
  releaseDate: '',
  durationMinutes: '',
  ageRating: '',
  imdbScore: '',
  imdbVoteCount: '',
  posterUrl: '',
  coverUrl: '',
  trailerUrl: '',
  genres: '',
  description: '',
  storyline: ''
};

const personFormInitial: PersonForm = {
  fullName: '',
  birthDate: '',
  avatarUrl: '',
  bio: ''
};

const homepageFormInitial: HomepageForm = {
  heroMovieId: '',
  heroTagline: '',
  topTenTitle: '',
  fanFavoritesTitle: '',
  newArrivalsTitle: '',
  topTenIds: '',
  fanFavoritesIds: '',
  newArrivalsIds: ''
};

const tabOptions = [
  { id: 'movies', label: 'Movies' },
  { id: 'genres', label: 'Genres' },
  { id: 'people', label: 'People & Cast' },
  { id: 'homepage', label: 'Homepage' }
] as const;

type TabId = (typeof tabOptions)[number]['id'];

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const token = user?.token;
  const [tab, setTab] = useState<TabId>('movies');
  const [adminError, setAdminError] = useState<string | null>(null);

  const [movies, setMovies] = useState<MovieSummary[]>([]);
  const [movieQuery, setMovieQuery] = useState('');
  const [createMovieForm, setCreateMovieForm] = useState<MovieForm>(movieFormInitial);
  const [editMovieForm, setEditMovieForm] = useState<MovieForm>(movieFormInitial);
  const [movieMessage, setMovieMessage] = useState<string | null>(null);
  const [createMovieMessage, setCreateMovieMessage] = useState<string | null>(null);
  const [editMovieMessage, setEditMovieMessage] = useState<string | null>(null);
  const [editingMovieId, setEditingMovieId] = useState<number | null>(null);
  const [createMovieStatus, setCreateMovieStatus] = useState<'idle' | 'saving'>('idle');
  const [editMovieStatus, setEditMovieStatus] = useState<'idle' | 'saving'>('idle');
  const [castList, setCastList] = useState<CastItem[]>([]);
  const [castForm, setCastForm] = useState({ personId: '', role: 'Actor', characterName: '' });

  const [genres, setGenres] = useState<GenreItem[]>([]);
  const [genreName, setGenreName] = useState('');
  const [editingGenreId, setEditingGenreId] = useState<number | null>(null);
  const [genreMessage, setGenreMessage] = useState<string | null>(null);

  const [people, setPeople] = useState<PersonItem[]>([]);
  const [peopleQuery, setPeopleQuery] = useState('');
  const [personForm, setPersonForm] = useState<PersonForm>(personFormInitial);
  const [editingPersonId, setEditingPersonId] = useState<number | null>(null);
  const [peopleMessage, setPeopleMessage] = useState<string | null>(null);

  const [homepageForm, setHomepageForm] = useState<HomepageForm>(homepageFormInitial);
  const [homepageMessage, setHomepageMessage] = useState<string | null>(null);

  const authHeaders = useMemo(() => {
    if (!token) return null;
    return { Authorization: `Bearer ${token}` };
  }, [token]);

  const handleAdminError = useCallback((message: string) => {
    setAdminError(message);
  }, []);

  const loadMovies = useCallback(
    async (query?: string) => {
      if (!authHeaders) return;
      setAdminError(null);
      setMovieMessage(null);
      const params = new URLSearchParams();
      if (query) params.set('query', query);
      const res = await fetch(`/api/admin/movies?${params.toString()}`, { headers: authHeaders });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (res.status === 403) handleAdminError('Admin access required.');
        setMovieMessage(data?.error || 'Failed to load movies.');
        return;
      }
      setMovies(data.results || []);
      setMovieMessage(null);
    },
    [authHeaders, handleAdminError]
  );

  const loadMovieDetail = useCallback(
    async (movieId: number) => {
      if (!authHeaders) return;
      setMovieMessage(null);
      setEditMovieMessage(null);
      const res = await fetch(`/api/admin/movies/${movieId}`, { headers: authHeaders });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (res.status === 403) handleAdminError('Admin access required.');
        setMovieMessage(data?.error || 'Failed to load movie.');
        return;
      }

      setEditMovieForm({
        title: data.title || '',
        originalTitle: data.original_title || '',
        releaseDate: data.release_date || '',
        durationMinutes: data.duration_minutes ? String(data.duration_minutes) : '',
        ageRating: data.age_rating || '',
        imdbScore: data.imdb_score !== null && data.imdb_score !== undefined ? String(data.imdb_score) : '',
        imdbVoteCount: data.imdb_vote_count ? String(data.imdb_vote_count) : '',
        posterUrl: data.poster_url || '',
        coverUrl: data.cover_url || '',
        trailerUrl: data.trailer_url || '',
        genres: Array.isArray(data.genres) ? data.genres.join(', ') : '',
        description: data.description || '',
        storyline: data.storyline || ''
      });
      setEditingMovieId(movieId);
    },
    [authHeaders, handleAdminError]
  );

  const loadCast = useCallback(
    async (movieId: number) => {
      if (!authHeaders) return;
      const res = await fetch(`/api/admin/movies/${movieId}/cast`, { headers: authHeaders });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (res.status === 403) handleAdminError('Admin access required.');
        setEditMovieMessage(data?.error || 'Failed to load cast.');
        return;
      }
      setCastList(Array.isArray(data) ? data : []);
      setEditMovieMessage(null);
    },
    [authHeaders, handleAdminError]
  );

  const buildMoviePayload = (form: MovieForm) => {
    const genresList = form.genres
      .split(',')
      .map((g) => g.trim())
      .filter(Boolean);

    return {
      title: form.title.trim(),
      originalTitle: form.originalTitle.trim() || undefined,
      releaseDate: form.releaseDate || undefined,
      durationMinutes: form.durationMinutes ? Number(form.durationMinutes) : undefined,
      ageRating: form.ageRating.trim() || undefined,
      imdbScore: form.imdbScore ? Number(form.imdbScore) : undefined,
      imdbVoteCount: form.imdbVoteCount ? Number(form.imdbVoteCount) : undefined,
      posterUrl: form.posterUrl.trim() || undefined,
      coverUrl: form.coverUrl.trim() || undefined,
      trailerUrl: form.trailerUrl.trim() || undefined,
      genres: genresList.length ? genresList : undefined,
      description: form.description.trim() || undefined,
      storyline: form.storyline.trim() || undefined
    };
  };

  const handleCreateMovieSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!authHeaders) return;
    setCreateMovieStatus('saving');
    setCreateMovieMessage(null);

    const payload = buildMoviePayload(createMovieForm);
    const res = await fetch('/api/admin/movies', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...authHeaders
      },
      body: JSON.stringify(payload)
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      if (res.status === 403) handleAdminError('Admin access required.');
      setCreateMovieMessage(data?.error || 'Failed to create movie.');
      setCreateMovieStatus('idle');
      return;
    }

    setCreateMovieMessage('Movie created.');
    setCreateMovieStatus('idle');
    setCreateMovieForm(movieFormInitial);
    await loadMovies(movieQuery);
  };

  const handleEditMovieSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!authHeaders || !editingMovieId) return;
    setEditMovieStatus('saving');
    setEditMovieMessage(null);

    const payload = buildMoviePayload(editMovieForm);
    const res = await fetch(`/api/admin/movies/${editingMovieId}`, {
      method: 'PUT',
      headers: {
        'content-type': 'application/json',
        ...authHeaders
      },
      body: JSON.stringify(payload)
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      if (res.status === 403) handleAdminError('Admin access required.');
      setEditMovieMessage(data?.error || 'Failed to update movie.');
      setEditMovieStatus('idle');
      return;
    }

    setEditMovieMessage('Movie updated.');
    setEditMovieStatus('idle');
    await loadMovies(movieQuery);
  };

  const handleEditCancel = () => {
    setEditingMovieId(null);
    setEditMovieForm(movieFormInitial);
    setCastList([]);
    setEditMovieMessage(null);
    setEditMovieStatus('idle');
  };

  const handleMovieDelete = async (movieId: number) => {
    if (!authHeaders) return;
    if (!window.confirm('Delete this movie?')) return;
    const res = await fetch(`/api/admin/movies/${movieId}`, {
      method: 'DELETE',
      headers: authHeaders
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      if (res.status === 403) handleAdminError('Admin access required.');
      setMovieMessage(data?.error || 'Failed to delete movie.');
      return;
    }
    if (editingMovieId === movieId) {
      setEditingMovieId(null);
      setEditMovieForm(movieFormInitial);
      setEditMovieMessage(null);
      setCastList([]);
    }
    await loadMovies(movieQuery);
  };

  const handleCastAdd = async () => {
    if (!authHeaders || !editingMovieId) return;
    const payload = {
      personId: Number(castForm.personId),
      role: castForm.role as CastItem['role'],
      characterName: castForm.characterName.trim() || undefined
    };
    const res = await fetch(`/api/admin/movies/${editingMovieId}/cast`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...authHeaders },
      body: JSON.stringify(payload)
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      if (res.status === 403) handleAdminError('Admin access required.');
      setEditMovieMessage(data?.error || 'Failed to add cast.');
      return;
    }
    setEditMovieMessage(null);
    setCastForm({ personId: '', role: 'Actor', characterName: '' });
    await loadCast(editingMovieId);
  };

  const handleCastRemove = async (personId: number, role: CastItem['role']) => {
    if (!authHeaders || !editingMovieId) return;
    const res = await fetch(`/api/admin/movies/${editingMovieId}/cast`, {
      method: 'DELETE',
      headers: { 'content-type': 'application/json', ...authHeaders },
      body: JSON.stringify({ personId, role })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      if (res.status === 403) handleAdminError('Admin access required.');
      setEditMovieMessage(data?.error || 'Failed to remove cast.');
      return;
    }
    setEditMovieMessage(null);
    await loadCast(editingMovieId);
  };

  const loadGenres = useCallback(async () => {
    if (!authHeaders) return;
    const res = await fetch('/api/admin/genres', { headers: authHeaders });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      if (res.status === 403) handleAdminError('Admin access required.');
      setGenreMessage(data?.error || 'Failed to load genres.');
      return;
    }
    setGenres(Array.isArray(data) ? data : []);
  }, [authHeaders, handleAdminError]);

  const handleGenreSave = async () => {
    if (!authHeaders || !genreName.trim()) return;
    const res = await fetch(
      editingGenreId ? `/api/admin/genres/${editingGenreId}` : '/api/admin/genres',
      {
        method: editingGenreId ? 'PUT' : 'POST',
        headers: { 'content-type': 'application/json', ...authHeaders },
        body: JSON.stringify({ name: genreName.trim() })
      }
    );
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      if (res.status === 403) handleAdminError('Admin access required.');
      setGenreMessage(data?.error || 'Failed to save genre.');
      return;
    }
    setGenreName('');
    setEditingGenreId(null);
    await loadGenres();
  };

  const handleGenreDelete = async (genreId: number) => {
    if (!authHeaders) return;
    if (!window.confirm('Delete this genre?')) return;
    const res = await fetch(`/api/admin/genres/${genreId}`, {
      method: 'DELETE',
      headers: authHeaders
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      if (res.status === 403) handleAdminError('Admin access required.');
      setGenreMessage(data?.error || 'Failed to delete genre.');
      return;
    }
    await loadGenres();
  };

  const loadPeople = useCallback(
    async (query?: string) => {
      if (!authHeaders) return;
      const params = new URLSearchParams();
      if (query) params.set('query', query);
      const res = await fetch(`/api/admin/people?${params.toString()}`, { headers: authHeaders });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (res.status === 403) handleAdminError('Admin access required.');
        setPeopleMessage(data?.error || 'Failed to load people.');
        return;
      }
      setPeople(Array.isArray(data) ? data : []);
    },
    [authHeaders, handleAdminError]
  );

  const handlePersonSave = async () => {
    if (!authHeaders || !personForm.fullName.trim()) return;
    const payload = {
      fullName: personForm.fullName.trim(),
      birthDate: personForm.birthDate || undefined,
      avatarUrl: personForm.avatarUrl.trim() || undefined,
      bio: personForm.bio.trim() || undefined
    };

    const res = await fetch(
      editingPersonId ? `/api/admin/people/${editingPersonId}` : '/api/admin/people',
      {
        method: editingPersonId ? 'PUT' : 'POST',
        headers: { 'content-type': 'application/json', ...authHeaders },
        body: JSON.stringify(payload)
      }
    );
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      if (res.status === 403) handleAdminError('Admin access required.');
      setPeopleMessage(data?.error || 'Failed to save person.');
      return;
    }
    setPersonForm(personFormInitial);
    setEditingPersonId(null);
    await loadPeople(peopleQuery);
  };

  const handlePersonDelete = async (personId: number) => {
    if (!authHeaders) return;
    if (!window.confirm('Delete this person?')) return;
    const res = await fetch(`/api/admin/people/${personId}`, {
      method: 'DELETE',
      headers: authHeaders
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      if (res.status === 403) handleAdminError('Admin access required.');
      setPeopleMessage(data?.error || 'Failed to delete person.');
      return;
    }
    await loadPeople(peopleQuery);
  };

  const loadHomepage = useCallback(async () => {
    if (!authHeaders) return;
    const res = await fetch('/api/admin/homepage', { headers: authHeaders });
    const data = (await res.json().catch(() => null)) as HomepageSettings | null;
    if (!res.ok || !data) {
      if (res.status === 403) handleAdminError('Admin access required.');
      setHomepageMessage((data as any)?.error || 'Failed to load homepage settings.');
      return;
    }
    setHomepageForm({
      heroMovieId: data.hero_movie_id ? String(data.hero_movie_id) : '',
      heroTagline: data.hero_tagline || '',
      topTenTitle: data.top_ten_title || '',
      fanFavoritesTitle: data.fan_favorites_title || '',
      newArrivalsTitle: data.new_arrivals_title || '',
      topTenIds: data.top_ten_ids?.join(', ') || '',
      fanFavoritesIds: data.fan_favorites_ids?.join(', ') || '',
      newArrivalsIds: data.new_arrivals_ids?.join(', ') || ''
    });
  }, [authHeaders, handleAdminError]);

  const handleHomepageSave = async () => {
    if (!authHeaders) return;
    const parseIds = (value: string) =>
      value
        .split(',')
        .map((v) => Number(v.trim()))
        .filter((v) => !Number.isNaN(v));

    const payload = {
      heroMovieId: homepageForm.heroMovieId ? Number(homepageForm.heroMovieId) : undefined,
      heroTagline: homepageForm.heroTagline.trim() || undefined,
      topTenTitle: homepageForm.topTenTitle.trim() || undefined,
      fanFavoritesTitle: homepageForm.fanFavoritesTitle.trim() || undefined,
      newArrivalsTitle: homepageForm.newArrivalsTitle.trim() || undefined,
      topTenIds: homepageForm.topTenIds ? parseIds(homepageForm.topTenIds) : undefined,
      fanFavoritesIds: homepageForm.fanFavoritesIds ? parseIds(homepageForm.fanFavoritesIds) : undefined,
      newArrivalsIds: homepageForm.newArrivalsIds ? parseIds(homepageForm.newArrivalsIds) : undefined
    };

    const res = await fetch('/api/admin/homepage', {
      method: 'PUT',
      headers: { 'content-type': 'application/json', ...authHeaders },
      body: JSON.stringify(payload)
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      if (res.status === 403) handleAdminError('Admin access required.');
      setHomepageMessage(data?.error || 'Failed to update homepage settings.');
      return;
    }
    setHomepageMessage('Homepage settings updated.');
  };

  useEffect(() => {
    if (!authHeaders) return;
    if (tab === 'movies') loadMovies(movieQuery);
    if (tab === 'genres') loadGenres();
    if (tab === 'people') loadPeople(peopleQuery);
    if (tab === 'homepage') loadHomepage();
  }, [authHeaders, tab, loadMovies, movieQuery, loadGenres, loadPeople, peopleQuery, loadHomepage]);

  useEffect(() => {
    if (editingMovieId) loadCast(editingMovieId);
  }, [editingMovieId, loadCast]);

  const canCreateMovie = createMovieForm.title.trim().length > 0 && createMovieStatus !== 'saving';
  const canEditMovie = editMovieForm.title.trim().length > 0 && editMovieStatus !== 'saving';
  const canSaveGenre = genreName.trim().length > 0;
  const canSavePerson = personForm.fullName.trim().length > 0;

  const renderMovieFields = (
    form: MovieForm,
    setForm: React.Dispatch<React.SetStateAction<MovieForm>>
  ) => (
    <>
      <label className="space-y-2 text-sm">
        <span className="text-muted">Title *</span>
        <input
          className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm"
          value={form.title}
          onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
          required
        />
      </label>
      <label className="space-y-2 text-sm">
        <span className="text-muted">Original title</span>
        <input
          className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm"
          value={form.originalTitle}
          onChange={(event) => setForm((prev) => ({ ...prev, originalTitle: event.target.value }))}
        />
      </label>
      <div className="grid gap-3 md:grid-cols-2">
        <label className="space-y-2 text-sm">
          <span className="text-muted">Release date</span>
          <input
            type="date"
            className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm"
            value={form.releaseDate}
            onChange={(event) => setForm((prev) => ({ ...prev, releaseDate: event.target.value }))}
          />
        </label>
        <label className="space-y-2 text-sm">
          <span className="text-muted">Runtime</span>
          <input
            type="number"
            min="1"
            className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm"
            value={form.durationMinutes}
            onChange={(event) => setForm((prev) => ({ ...prev, durationMinutes: event.target.value }))}
          />
        </label>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <label className="space-y-2 text-sm">
          <span className="text-muted">IMDb score</span>
          <input
            type="number"
            min="0"
            max="10"
            step="0.1"
            className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm"
            value={form.imdbScore}
            onChange={(event) => setForm((prev) => ({ ...prev, imdbScore: event.target.value }))}
          />
        </label>
        <label className="space-y-2 text-sm">
          <span className="text-muted">IMDb votes</span>
          <input
            type="number"
            min="0"
            className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm"
            value={form.imdbVoteCount}
            onChange={(event) => setForm((prev) => ({ ...prev, imdbVoteCount: event.target.value }))}
          />
        </label>
      </div>
      <label className="space-y-2 text-sm">
        <span className="text-muted">Genres (comma separated)</span>
        <input
          className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm"
          value={form.genres}
          onChange={(event) => setForm((prev) => ({ ...prev, genres: event.target.value }))}
        />
      </label>
      <label className="space-y-2 text-sm">
        <span className="text-muted">Age rating</span>
        <input
          className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm"
          value={form.ageRating}
          onChange={(event) => setForm((prev) => ({ ...prev, ageRating: event.target.value }))}
        />
      </label>
      <label className="space-y-2 text-sm">
        <span className="text-muted">Poster URL</span>
        <input
          className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm"
          value={form.posterUrl}
          onChange={(event) => setForm((prev) => ({ ...prev, posterUrl: event.target.value }))}
        />
      </label>
      <label className="space-y-2 text-sm">
        <span className="text-muted">Cover URL</span>
        <input
          className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm"
          value={form.coverUrl}
          onChange={(event) => setForm((prev) => ({ ...prev, coverUrl: event.target.value }))}
        />
      </label>
      <label className="space-y-2 text-sm">
        <span className="text-muted">Trailer URL</span>
        <input
          className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm"
          value={form.trailerUrl}
          onChange={(event) => setForm((prev) => ({ ...prev, trailerUrl: event.target.value }))}
        />
      </label>
      <label className="space-y-2 text-sm">
        <span className="text-muted">Description</span>
        <textarea
          rows={3}
          className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm"
          value={form.description}
          onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
        />
      </label>
      <label className="space-y-2 text-sm">
        <span className="text-muted">Storyline</span>
        <textarea
          rows={3}
          className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm"
          value={form.storyline}
          onChange={(event) => setForm((prev) => ({ ...prev, storyline: event.target.value }))}
        />
      </label>
    </>
  );

  return (
    <div className="container space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">Admin dashboard</h1>
        <p className="text-sm text-muted">Manage catalog, people, and homepage settings.</p>
      </div>

      <AuthGate>
        <div className="flex flex-wrap gap-2">
          {tabOptions.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => setTab(option.id)}
              className={`rounded-full border px-4 py-2 text-sm ${
                tab === option.id ? 'border-accent bg-accent text-black' : 'border-border text-muted'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        {adminError ? <div className="card p-4 text-sm text-muted">{adminError}</div> : null}

        {tab === 'movies' ? (
          <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
            <div className="space-y-4">
              <div className="card p-4 space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm md:w-auto md:flex-1"
                    placeholder="Search movies..."
                    value={movieQuery}
                    onChange={(event) => setMovieQuery(event.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => loadMovies(movieQuery)}
                    className="rounded-md border border-border px-3 py-2 text-sm"
                  >
                    Search
                  </button>
                </div>
                <div className="space-y-2">
                  {movies.map((movie) => (
                    <div
                      key={movie.movie_id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-bg/40 p-2 text-sm"
                    >
                      <div>
                        <div className="font-medium">{movie.title}</div>
                        <div className="text-xs text-muted">
                          {movie.release_date || '—'} · {movie.imdb_score ?? 'NR'}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => loadMovieDetail(movie.movie_id)}
                          className="rounded-md border border-border px-2 py-1 text-xs"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMovieDelete(movie.movie_id)}
                          className="rounded-md border border-border px-2 py-1 text-xs text-red-300"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                  {movies.length === 0 ? <div className="text-sm text-muted">No movies found.</div> : null}
                </div>
                {movieMessage ? <div className="text-sm text-muted">{movieMessage}</div> : null}
              </div>
            </div>

            <div className="space-y-4">
              {editingMovieId ? (
                <form onSubmit={handleEditMovieSubmit} className="card p-4 space-y-4">
                  <div className="flex items-center justify-between text-sm font-semibold">
                    <span>{`Editing #${editingMovieId}`}</span>
                    <button
                      type="button"
                      onClick={handleEditCancel}
                      className="rounded-md border border-border px-2 py-1 text-xs text-muted"
                    >
                      Cancel
                    </button>
                  </div>
                  {renderMovieFields(editMovieForm, setEditMovieForm)}
                  <button
                    type="submit"
                    disabled={!canEditMovie}
                    className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-black disabled:opacity-50"
                  >
                    {editMovieStatus === 'saving' ? 'Saving...' : 'Save changes'}
                  </button>
                  {editMovieMessage ? <div className="text-sm text-muted">{editMovieMessage}</div> : null}

                  <div className="border-t border-border pt-4 space-y-3">
                    <div className="text-sm font-semibold">Cast</div>
                    <div className="space-y-2">
                      {castList.map((cast) => (
                        <div
                          key={`${cast.person_id}-${cast.role}`}
                          className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-bg/40 px-2 py-1 text-xs"
                        >
                          <div>
                            <div className="font-medium">{cast.full_name}</div>
                            <div className="text-muted">
                              {cast.role}
                              {cast.character_name ? ` · ${cast.character_name}` : ''}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleCastRemove(cast.person_id, cast.role)}
                            className="rounded-md border border-border px-2 py-1 text-xs text-red-300"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                      {castList.length === 0 ? <div className="text-xs text-muted">No cast yet.</div> : null}
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <input
                        className="rounded-lg border border-border bg-bg px-3 py-2 text-sm"
                        placeholder="Person ID"
                        value={castForm.personId}
                        onChange={(event) => setCastForm((prev) => ({ ...prev, personId: event.target.value }))}
                      />
                      <select
                        className="rounded-lg border border-border bg-bg px-3 py-2 text-sm"
                        value={castForm.role}
                        onChange={(event) => setCastForm((prev) => ({ ...prev, role: event.target.value }))}
                      >
                        <option value="Actor">Actor</option>
                        <option value="Director">Director</option>
                        <option value="Writer">Writer</option>
                      </select>
                      <input
                        className="rounded-lg border border-border bg-bg px-3 py-2 text-sm sm:col-span-2"
                        placeholder="Character name (optional)"
                        value={castForm.characterName}
                        onChange={(event) => setCastForm((prev) => ({ ...prev, characterName: event.target.value }))}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleCastAdd}
                      className="rounded-md border border-border px-3 py-2 text-sm"
                    >
                      Add cast
                    </button>
                  </div>
                </form>
              ) : null}

              <form onSubmit={handleCreateMovieSubmit} className="card p-4 space-y-4">
                <div className="text-sm font-semibold">Create movie</div>
                {renderMovieFields(createMovieForm, setCreateMovieForm)}
                <button
                  type="submit"
                  disabled={!canCreateMovie}
                  className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-black disabled:opacity-50"
                >
                  {createMovieStatus === 'saving' ? 'Saving...' : 'Create movie'}
                </button>
                {createMovieMessage ? <div className="text-sm text-muted">{createMovieMessage}</div> : null}
              </form>
            </div>
          </div>
        ) : null}

        {tab === 'genres' ? (
          <div className="card p-4 space-y-4">
            <div className="flex flex-wrap gap-2">
              <input
                className="flex-1 rounded-lg border border-border bg-bg px-3 py-2 text-sm"
                placeholder="Genre name"
                value={genreName}
                onChange={(event) => setGenreName(event.target.value)}
              />
              <button
                type="button"
                disabled={!canSaveGenre}
                onClick={handleGenreSave}
                className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-black disabled:opacity-50"
              >
                {editingGenreId ? 'Save' : 'Add'}
              </button>
            </div>
            {genreMessage ? <div className="text-sm text-muted">{genreMessage}</div> : null}
            <div className="space-y-2">
              {genres.map((genre) => (
                <div
                  key={genre.genre_id}
                  className="flex items-center justify-between rounded-lg border border-border bg-bg/40 px-3 py-2 text-sm"
                >
                  <span>{genre.name}</span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingGenreId(genre.genre_id);
                        setGenreName(genre.name);
                      }}
                      className="rounded-md border border-border px-2 py-1 text-xs"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleGenreDelete(genre.genre_id)}
                      className="rounded-md border border-border px-2 py-1 text-xs text-red-300"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
              {genres.length === 0 ? <div className="text-sm text-muted">No genres found.</div> : null}
            </div>
          </div>
        ) : null}

        {tab === 'people' ? (
          <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
            <div className="card p-4 space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <input
                  className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm md:w-auto md:flex-1"
                  placeholder="Search people..."
                  value={peopleQuery}
                  onChange={(event) => setPeopleQuery(event.target.value)}
                />
                <button
                  type="button"
                  onClick={() => loadPeople(peopleQuery)}
                  className="rounded-md border border-border px-3 py-2 text-sm"
                >
                  Search
                </button>
              </div>
              <div className="space-y-2">
                {people.map((person) => (
                  <div
                    key={person.person_id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-bg/40 p-2 text-sm"
                  >
                    <div>
                      <div className="font-medium">{person.full_name}</div>
                      <div className="text-xs text-muted">{person.birth_date || '—'}</div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingPersonId(person.person_id);
                          setPersonForm({
                            fullName: person.full_name || '',
                            birthDate: person.birth_date || '',
                            avatarUrl: person.avatar_url || '',
                            bio: person.bio || ''
                          });
                        }}
                        className="rounded-md border border-border px-2 py-1 text-xs"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handlePersonDelete(person.person_id)}
                        className="rounded-md border border-border px-2 py-1 text-xs text-red-300"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
                {people.length === 0 ? <div className="text-sm text-muted">No people found.</div> : null}
              </div>
            </div>

            <div className="card p-4 space-y-3">
              <div className="text-sm font-semibold">{editingPersonId ? 'Edit person' : 'Add person'}</div>
              <label className="space-y-2 text-sm">
                <span className="text-muted">Full name *</span>
                <input
                  className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm"
                  value={personForm.fullName}
                  onChange={(event) => setPersonForm((prev) => ({ ...prev, fullName: event.target.value }))}
                />
              </label>
              <label className="space-y-2 text-sm">
                <span className="text-muted">Birth date</span>
                <input
                  type="date"
                  className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm"
                  value={personForm.birthDate}
                  onChange={(event) => setPersonForm((prev) => ({ ...prev, birthDate: event.target.value }))}
                />
              </label>
              <label className="space-y-2 text-sm">
                <span className="text-muted">Avatar URL</span>
                <input
                  className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm"
                  value={personForm.avatarUrl}
                  onChange={(event) => setPersonForm((prev) => ({ ...prev, avatarUrl: event.target.value }))}
                />
              </label>
              <label className="space-y-2 text-sm">
                <span className="text-muted">Bio</span>
                <textarea
                  rows={3}
                  className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm"
                  value={personForm.bio}
                  onChange={(event) => setPersonForm((prev) => ({ ...prev, bio: event.target.value }))}
                />
              </label>
              <button
                type="button"
                disabled={!canSavePerson}
                onClick={handlePersonSave}
                className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-black disabled:opacity-50"
              >
                {editingPersonId ? 'Save changes' : 'Add person'}
              </button>
              {peopleMessage ? <div className="text-sm text-muted">{peopleMessage}</div> : null}
            </div>
          </div>
        ) : null}

        {tab === 'homepage' ? (
          <div className="card p-4 space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              <label className="space-y-2 text-sm">
                <span className="text-muted">Hero movie ID</span>
                <input
                  className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm"
                  value={homepageForm.heroMovieId}
                  onChange={(event) => setHomepageForm((prev) => ({ ...prev, heroMovieId: event.target.value }))}
                />
              </label>
              <label className="space-y-2 text-sm">
                <span className="text-muted">Hero tagline</span>
                <input
                  className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm"
                  value={homepageForm.heroTagline}
                  onChange={(event) => setHomepageForm((prev) => ({ ...prev, heroTagline: event.target.value }))}
                />
              </label>
              <label className="space-y-2 text-sm">
                <span className="text-muted">Top 10 title</span>
                <input
                  className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm"
                  value={homepageForm.topTenTitle}
                  onChange={(event) => setHomepageForm((prev) => ({ ...prev, topTenTitle: event.target.value }))}
                />
              </label>
              <label className="space-y-2 text-sm">
                <span className="text-muted">Fan favorites title</span>
                <input
                  className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm"
                  value={homepageForm.fanFavoritesTitle}
                  onChange={(event) => setHomepageForm((prev) => ({ ...prev, fanFavoritesTitle: event.target.value }))}
                />
              </label>
              <label className="space-y-2 text-sm">
                <span className="text-muted">New arrivals title</span>
                <input
                  className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm"
                  value={homepageForm.newArrivalsTitle}
                  onChange={(event) => setHomepageForm((prev) => ({ ...prev, newArrivalsTitle: event.target.value }))}
                />
              </label>
            </div>
            <label className="space-y-2 text-sm">
              <span className="text-muted">Top 10 movie IDs (comma separated)</span>
              <input
                className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm"
                value={homepageForm.topTenIds}
                onChange={(event) => setHomepageForm((prev) => ({ ...prev, topTenIds: event.target.value }))}
              />
            </label>
            <label className="space-y-2 text-sm">
              <span className="text-muted">Fan favorites movie IDs</span>
              <input
                className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm"
                value={homepageForm.fanFavoritesIds}
                onChange={(event) => setHomepageForm((prev) => ({ ...prev, fanFavoritesIds: event.target.value }))}
              />
            </label>
            <label className="space-y-2 text-sm">
              <span className="text-muted">New arrivals movie IDs</span>
              <input
                className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm"
                value={homepageForm.newArrivalsIds}
                onChange={(event) => setHomepageForm((prev) => ({ ...prev, newArrivalsIds: event.target.value }))}
              />
            </label>
            <button
              type="button"
              onClick={handleHomepageSave}
              className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-black"
            >
              Save homepage settings
            </button>
            {homepageMessage ? <div className="text-sm text-muted">{homepageMessage}</div> : null}
          </div>
        ) : null}
      </AuthGate>
    </div>
  );
}
