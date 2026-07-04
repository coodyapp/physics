export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="rounded-full border border-border/40 bg-background/80 backdrop-blur-xl shadow-2xl">
      <div className="px-6 py-2 flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground">Powered by</span>
          <img
            src="/logo-white.png"
            alt="Coody"
            className="h-4 w-auto opacity-70 hover:opacity-100 transition-opacity"
          />
        </div>

        <div className="h-3 w-px bg-border/40" />
        <p className="text-xs text-muted-foreground">© {currentYear}</p>
      </div>
    </footer>
  );
}
