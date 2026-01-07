export function SiteFooter() {
  return (
    <footer className="border-t border-border">
      <div className="container flex items-center justify-end py-10 text-sm text-muted">
        <div>© {new Date().getUTCFullYear()} FilmConsensus</div>
      </div>
    </footer>
  );
}
