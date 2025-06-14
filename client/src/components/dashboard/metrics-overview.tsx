import { BarChart3, Send, Eye, MousePointer } from "lucide-react";

interface MetricsOverviewProps {
  stats?: {
    totalCampaigns: number;
    totalContacts: number;
    analytics: {
      totalSent: number;
      openRate: string;
      clickRate: string;
    };
  };
}

export default function MetricsOverview({ stats }: MetricsOverviewProps) {
  const metrics = [
    {
      title: "Total Campaigns",
      value: stats?.totalCampaigns || 0,
      icon: BarChart3,
      iconBg: "bg-primary/10",
      iconColor: "text-primary",
      change: "+12%",
      changeType: "positive",
    },
    {
      title: "Emails Sent",
      value: stats?.analytics?.totalSent || 0,
      icon: Send,
      iconBg: "bg-secondary/10",
      iconColor: "text-secondary",
      change: "+8%",
      changeType: "positive",
    },
    {
      title: "Open Rate",
      value: stats?.analytics?.openRate || "0%",
      icon: Eye,
      iconBg: "bg-success/10",
      iconColor: "text-success",
      change: "+3.2%",
      changeType: "positive",
    },
    {
      title: "Click Rate",
      value: stats?.analytics?.clickRate || "0%",
      icon: MousePointer,
      iconBg: "bg-warning/10",
      iconColor: "text-warning",
      change: "-1.1%",
      changeType: "negative",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {metrics.map((metric) => (
        <div key={metric.title} className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-600 text-sm font-medium">{metric.title}</p>
              <p className="text-2xl font-semibold text-slate-900 mt-2">
                {typeof metric.value === 'number' ? metric.value.toLocaleString() : metric.value}
              </p>
            </div>
            <div className={`w-10 h-10 ${metric.iconBg} rounded-lg flex items-center justify-center`}>
              <metric.icon className={`w-5 h-5 ${metric.iconColor}`} />
            </div>
          </div>
          <div className="flex items-center mt-4 text-sm">
            <span className={`font-medium ${
              metric.changeType === "positive" ? "text-success" : "text-error"
            }`}>
              {metric.change}
            </span>
            <span className="text-slate-500 ml-2">vs last month</span>
          </div>
        </div>
      ))}
    </div>
  );
}
