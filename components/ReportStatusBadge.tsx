const styles: Record<string, string> = {
  READY: "bg-lime text-ink",
  NEEDS_REVIEW: "bg-yellow-300 text-ink",
  RUNNING: "bg-cyan text-ink",
  FAILED: "bg-red-400 text-ink",
  DRAFT: "bg-white/15 text-white"
}

export function ReportStatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-black ${styles[status] || styles.DRAFT}`}>
      {status.replace("_", " ")}
    </span>
  )
}
