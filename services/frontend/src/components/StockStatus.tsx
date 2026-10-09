import { AlertCircle, CheckCircle2, XCircle } from "lucide-react";

export const LOW_STOCK = 5;

export default function StockStatus({ stock }: { stock: number }) {
  if (stock <= 0) return <span className="inline-flex items-center gap-1.5 text-sm font-medium text-danger"><XCircle aria-hidden className="h-4 w-4" />Out of stock</span>;
  if (stock <= LOW_STOCK) return <span className="inline-flex items-center gap-1.5 text-sm font-medium text-warn"><AlertCircle aria-hidden className="h-4 w-4" />Only {stock} left</span>;
  return <span className="inline-flex items-center gap-1.5 text-sm font-medium text-success"><CheckCircle2 aria-hidden className="h-4 w-4" />In stock</span>;
}
