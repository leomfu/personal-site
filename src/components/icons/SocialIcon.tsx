import type { SocialKey } from "~/site.config";

/**
 * 社交平台图标：实底、16×16。只有站上留着的三个平台（X、GitHub、哔哩哔哩）。
 */
const PATHS: Record<SocialKey, React.ReactNode> = {
  x: <path d="M12.6 1.3h2.3l-5 5.8L15.8 15h-4.6l-3.6-4.7L3.4 15H1.1l5.4-6.2L.9 1.3h4.7l3.2 4.3zM11.8 13.6h1.3L5.1 2.6H3.7z" />,
  github: (
    <path d="M8 .5a7.5 7.5 0 0 0-2.4 14.6c.4.1.5-.2.5-.4v-1.3c-2.1.5-2.5-1-2.5-1-.4-.9-.9-1.1-.9-1.1-.7-.5 0-.5 0-.5.8.1 1.2.8 1.2.8.7 1.2 1.8.8 2.2.6.1-.5.3-.8.5-1-1.7-.2-3.4-.8-3.4-3.7 0-.8.3-1.5.8-2-.1-.2-.4-1 .1-2 0 0 .6-.2 2.1.8a7.2 7.2 0 0 1 3.8 0c1.4-1 2-.8 2-.8.5 1 .2 1.8.1 2 .5.5.8 1.2.8 2 0 2.9-1.8 3.5-3.4 3.7.3.2.5.7.5 1.4v2c0 .2.1.4.5.4A7.5 7.5 0 0 0 8 .5z" />
  ),
  bilibili: (
    <path
      fillRule="evenodd"
      d="M4.5 1.1 6.9 3.5h2.2L11.5 1.1a.8.8 0 0 1 1.1 1.1l-1.3 1.3H13A2.5 2.5 0 0 1 15.5 6v6.4A2.5 2.5 0 0 1 13 14.9H3a2.5 2.5 0 0 1-2.5-2.5V6A2.5 2.5 0 0 1 3 3.5h1.7L3.4 2.2a.8.8 0 0 1 1.1-1.1zM5.1 6.9a.9.9 0 0 0-.9.9v1.5a.9.9 0 0 0 1.8 0V7.8a.9.9 0 0 0-.9-.9zm5.8 0a.9.9 0 0 0-.9.9v1.5a.9.9 0 0 0 1.8 0V7.8a.9.9 0 0 0-.9-.9z"
    />
  ),
};

export function SocialIcon({ name, size = 16 }: { name: SocialKey; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="currentColor"
      className="shrink-0"
      aria-hidden
    >
      {PATHS[name]}
    </svg>
  );
}
