import { DashboardShell, StatusBadge } from "@/components/dashboard/DashboardShell"
import { getStore } from "@/lib/scrapers/store"

export default function ProductsPage() {
  const store = getStore()
  return (
    <DashboardShell title="Products reviewed" description="A simple table of demo competitor products used for review, rating, sentiment, and data-quality reports.">
      <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.04] p-6">
        <table className="w-full text-left text-sm">
          <thead className="text-white/50"><tr><th className="py-2">Product</th><th>Source</th><th>Brand</th><th>Category</th><th>Price</th><th>Stock</th><th>Rating</th></tr></thead>
          <tbody>
            {store.products.map((product) => (
              <tr key={product.id} className="border-t border-white/10">
                <td className="min-w-72 py-3"><a href={product.url} className="font-bold text-white hover:text-lime">{product.title ?? "Missing title"}</a></td>
                <td>{store.sources.find((source) => source.id === product.sourceId)?.name}</td>
                <td>{product.brand ?? "-"}</td>
                <td>{product.category ?? "-"}</td>
                <td>{product.currentPrice ? `${product.currency} ${product.currentPrice}` : "-"}</td>
                <td><StatusBadge status={product.availability} /></td>
                <td>{product.rating ?? "-"} ({product.reviewCount ?? 0})</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DashboardShell>
  )
}
