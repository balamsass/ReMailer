import { useQuery } from "@tanstack/react-query";
import MetricsOverview from "@/components/dashboard/metrics-overview";
import RecentCampaigns from "@/components/dashboard/recent-campaigns";
import { Plus } from "lucide-react";

export default function Dashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["/api/dashboard/stats"],
  });

  return (
    <div>
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">Dashboard</h2>
            <p className="text-slate-600 mt-1">Monitor your email campaign performance</p>
          </div>
          <button className="bg-primary text-white px-4 py-2 rounded-lg font-medium hover:bg-primary/90 transition-colors flex items-center space-x-2">
            <Plus className="w-4 h-4" />
            <span>New Campaign</span>
          </button>
        </div>
      </header>

      <div className="p-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-slate-600">Loading dashboard...</div>
          </div>
        ) : (
          <>
            <MetricsOverview stats={stats} />
            <RecentCampaigns campaigns={stats?.recentCampaigns || []} />
          </>
        )}
      </div>
    </div>
  );
}
