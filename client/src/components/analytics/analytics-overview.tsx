import { Eye, MousePointer, AlertTriangle, UserMinus } from "lucide-react";

interface AnalyticsOverviewProps {
  analytics?: {
    totalOpens: number;
    totalClicks: number;
    totalBounces: number;
    totalUnsubscribes: number;
    openRate: string;
    clickRate: string;
    bounceRate: string;
    unsubscribeRate: string;
  };
}

export default function AnalyticsOverview({ analytics }: AnalyticsOverviewProps) {
  const metrics = [
    {
      title: "Total Opens",
      value: analytics?.totalOpens || 0,
      rate: analytics?.openRate || "0%",
      icon: Eye,
      iconBg: "bg-success/10",
      iconColor: "text-success",
    },
    {
      title: "Total Clicks",
      value: analytics?.totalClicks || 0,
      rate: analytics?.clickRate || "0%",
      icon: MousePointer,
      iconBg: "bg-primary/10",
      iconColor: "text-primary",
    },
    {
      title: "Bounces",
      value: analytics?.totalBounces || 0,
      rate: analytics?.bounceRate || "0%",
      icon: AlertTriangle,
      iconBg: "bg-error/10",
      iconColor: "text-error",
    },
    {
      title: "Unsubscribes",
      value: analytics?.totalUnsubscribes || 0,
      rate: analytics?.unsubscribeRate || "0%",
      icon: UserMinus,
      iconBg: "bg-warning/10",
      iconColor: "text-warning",
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
                {metric.value.toLocaleString()}
              </p>
            </div>
            <div className={`w-10 h-10 ${metric.iconBg} rounded-lg flex items-center justify-center`}>
              <metric.icon className={`w-5 h-5 ${metric.iconColor}`} />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-sm text-slate-600">{metric.title.includes('Total') ? 'Rate' : 'Percentage'}</div>
            <div className="text-lg font-medium text-slate-900">{metric.rate}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
