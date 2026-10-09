export default function Loading() {
  return (
    <div className="container-page grid gap-10 py-8 md:grid-cols-2" role="status" aria-label="Loading product">
      <div className="skeleton aspect-square rounded-card" />
      <div className="space-y-4"><div className="skeleton h-3 w-24" /><div className="skeleton h-10 w-3/4" /><div className="skeleton h-7 w-28" /><div className="skeleton h-24 w-full" /><div className="skeleton h-12 w-64" /></div>
    </div>
  );
}
