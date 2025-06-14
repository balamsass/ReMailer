import { BarChart3 } from "lucide-react";

export default function PerformanceChart() {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 mb-8">
      <h3 className="text-lg font-semibold text-slate-900 mb-6">Campaign Performance Over Time</h3>
      <div className="h-64 bg-slate-50 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <BarChart3 className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <p className="text-slate-600 font-medium">Performance chart would be displayed here</p>
          <p className="text-sm text-slate-500 mt-2">Integration with Chart.js or similar charting library</p>
        </div>
      </div>
    </div>
  );
}
