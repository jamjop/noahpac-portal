interface ToolPageProps {
  src: string;
  title: string;
}

export default function ToolPage({ src, title }: ToolPageProps) {
  return (
    <iframe
      src={src}
      style={{ width: "100%", height: "100vh", border: "none", display: "block" }}
      title={title}
    />
  );
}
