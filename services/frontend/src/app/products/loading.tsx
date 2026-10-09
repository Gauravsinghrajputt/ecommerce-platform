import ProductGridSkeleton from "@/components/ProductGridSkeleton";

export default function Loading() {
  return (
    <div className="container-page py-10" role="status" aria-label="Loading products">
      <div className="skeleton h-9 w-56" /><div className="skeleton mt-6 h-11 w-full" />
      <div className="mt-8"><ProductGridSkeleton /></div>
    </div>
  );
}
