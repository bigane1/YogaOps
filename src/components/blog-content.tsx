const INLINE_IMAGE_RE = /^\/(media|uploads)\/[a-zA-Z0-9._-]+$/;

export function BlogContent({ content }: { content: string }) {
  const blocks = content.split(/\n\n+/);

  return (
    <div className="space-y-4 text-sm opacity-90">
      {blocks.map((block, index) => {
        const line = block.trim();
        if (!line) return null;
        if (INLINE_IMAGE_RE.test(line)) {
          return (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={`img-${index}-${line}`}
              src={line}
              alt=""
              className="h-auto max-h-96 w-full rounded-lg object-cover"
              loading="lazy"
            />
          );
        }
        return (
          <p key={`p-${index}`} className="whitespace-pre-line leading-relaxed">
            {block}
          </p>
        );
      })}
    </div>
  );
}
