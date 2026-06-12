export default function NotFound() {
  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "var(--bg)",
      flexDirection: "column",
      gap: 12,
      fontFamily: "'Archivo', sans-serif",
    }}>
      <div style={{
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: 10,
        letterSpacing: "0.14em",
        textTransform: "uppercase",
        color: "var(--ink-muted)",
        fontWeight: 700,
      }}>
        404
      </div>
      <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--ink)" }}>Page Not Found</h1>
      <a href="/" style={{
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: 11,
        color: "var(--purple)",
        textDecoration: "none",
        marginTop: 4,
      }}>
        ← Back to Clinical Reference Tools
      </a>
    </div>
  );
}
