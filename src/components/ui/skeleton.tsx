export function Skeleton({
  className,
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={`bg-neutral-200 animate-pulse rounded ${className ?? ""}`}
      style={style}
    />
  );
}