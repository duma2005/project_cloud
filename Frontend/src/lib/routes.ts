import type { Route } from 'next';
import type { UrlObject } from 'url';

export const staticRoutes = [
  '/',
  '/trending',
  '/top',
  '/discover',
  '/search',
  '/watchlist',
  '/login',
  '/register',
  '/contact',
  '/about',
  '/admin',
  '/admin/movies'
] as const;

export type StaticRoute = (typeof staticRoutes)[number];
export type MovieRoute = `/movie/${string}`;
export type AppRoute = StaticRoute | MovieRoute;
export type AppHref = Route | UrlObject;

export function isStaticRoute(value: string): value is StaticRoute {
  return (staticRoutes as readonly string[]).includes(value);
}

export function isMovieRoute(value: string): value is MovieRoute {
  return value.startsWith('/movie/') && value.length > '/movie/'.length;
}

export function isAppRoute(value: string): value is AppRoute {
  return isStaticRoute(value) || isMovieRoute(value);
}

export function toAppRoute(value: string | null): AppRoute {
  if (value && isAppRoute(value)) return value;
  return '/';
}

export function movieRoute(slug: string, movieId: number): MovieRoute {
  return `/movie/${slug}-${movieId}` as MovieRoute;
}

export function toAppHref(route: AppRoute): AppHref {
  return route as AppHref;
}

export function searchRoute(query: string, page: number | string = 1): Route {
  const params = new URLSearchParams({
    q: query,
    page: String(page)
  });
  return `/search?${params.toString()}` as Route;
}
