export default function Footer() {
  return (
    <footer className="drop-shadow-2xl">
      <div className="flex flex-col items-center gap-1 px-3 py-1 text-center">
        <span className="text-[0.65rem] uppercase tracking-[0.28em] text-muted-foreground">
          Powered by
        </span>
        <img
          src="/logo-white.png"
          alt="Coody"
          className="h-5 w-auto opacity-80 transition-opacity hover:opacity-100"
        />
      </div>
    </footer>
  );
}
