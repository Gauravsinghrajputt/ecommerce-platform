export default function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <ul aria-hidden className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: count }, (_, i) => (
        <li key={i}><div className="skeleton aspect-square rounded-card" /><div className="skeleton mt-3 h-3 w-1/3" /><div className="skeleton mt-2 h-4 w-2/3" /><div className="skeleton mt-2 h-3 w-1/4" /></li>
      ))}
    </ul>
  );
}
