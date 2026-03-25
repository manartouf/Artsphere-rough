const StatusBadge = ({ status }) => {
  const styles = {
    sold:       "bg-red-600 text-white",
    auction:    "bg-green-600 text-white",
    active:     "bg-green-600 text-white",
    pending:    "bg-yellow-500 text-black",
    rejected:   "bg-gray-600 text-white",
    approved:   "bg-blue-600 text-white",
    "view-only":"bg-gray-500 text-white",
    exhibition: "bg-purple-600 text-white",
    hybrid:     "bg-indigo-500 text-white",
    ended:      "bg-gray-700 text-gray-300",
  };

  const labels = {
    sold:       "SOLD",
    auction:    "AUCTION",
    active:     "ACTIVE",
    pending:    "PENDING",
    rejected:   "REJECTED",
    approved:   "APPROVED",
    "view-only":"VIEW ONLY",
    exhibition: "EXHIBITION",
    hybrid:     "HYBRID",
    ended:      "ENDED",
  };

  const key = status?.toLowerCase();

  return (
    <span className={`text-xs font-bold px-2 py-1 rounded-full uppercase tracking-wide ${styles[key] || "bg-gray-600 text-white"}`}>
      {labels[key] || status}
    </span>
  );
};

export default StatusBadge;