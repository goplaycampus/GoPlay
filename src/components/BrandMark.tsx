interface BrandMarkProps {
  variant?: 'light' | 'dark';
  size?: 'sm' | 'md' | 'lg';
}

export function BrandMark({ variant = 'light', size = 'md' }: BrandMarkProps) {
  const gColor = variant === 'dark' ? '#FFFFFF' : '#111111';
  const goColor = variant === 'dark' ? '#FFFFFF' : '#111111';
  const playTextColor = variant === 'dark' ? '#B7F500' : '#3F6212';
  const playAccent = '#B7F500';

  const svgHeight =
    size === 'sm' ? 'h-5 sm:h-6' : size === 'lg' ? 'h-9' : 'h-6 sm:h-7';
  const textSize =
    size === 'sm'
      ? 'text-lg sm:text-[1.35rem]'
      : size === 'lg'
      ? 'text-2xl'
      : 'text-xl sm:text-[1.4rem]';

  return (
    <span className="inline-flex items-center gap-1.5 sm:gap-2 whitespace-nowrap shrink-0 select-none">
      <svg
        viewBox="0 0 46 36"
        className={`${svgHeight} w-auto shrink-0`}
        aria-hidden="true"
        fill="none"
      >
        {/* Sporty italic G outer frame with inward crossbar */}
        <path
          d="M28.2 4H13.8C7.9 4 4.1 7.7 2.9 13.7L1.4 21.6C0.2 27.8 3.6 32 9.7 32H21.8L24.1 19.6H14.2L13.2 24.4H17.4L17.1 26.2H11.8C8.9 26.2 7.6 24.6 8.2 21.4L9.4 15.1C10 11.9 11.9 10.2 14.9 10.2H27L28.2 4Z"
          fill={gColor}
        />
        {/* Electric Lime Forward Play Triangle */}
        <path d="M27.4 10.5L43.5 18.2L25.2 26.8L27.4 10.5Z" fill={playAccent} />
      </svg>
      <span className={`font-display ${textSize} font-extrabold italic tracking-tight leading-none`}>
        <span style={{ color: goColor }}>Go</span>
        <span
          style={{ color: playTextColor }}
          className="underline decoration-[#B7F500] decoration-[3px] underline-offset-[3px]"
        >
          Play
        </span>
      </span>
    </span>
  );
}
