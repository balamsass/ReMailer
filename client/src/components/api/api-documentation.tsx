import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function ApiDocumentation() {
  const endpoints = [
    { method: "GET", path: "/campaigns", color: "success" },
    { method: "POST", path: "/campaigns", color: "primary" },
    { method: "POST", path: "/campaigns/send", color: "primary" },
    { method: "GET", path: "/contacts", color: "success" },
    { method: "POST", path: "/contacts", color: "primary" },
    { method: "GET", path: "/analytics", color: "success" },
  ];

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <h3 className="text-lg font-semibold text-slate-900 mb-4">API Information</h3>
      
      <div className="space-y-4">
        <div>
          <dt className="text-sm font-medium text-slate-600">Base URL</dt>
          <dd className="mt-1">
            <code className="bg-slate-100 px-2 py-1 rounded text-sm font-mono">
              https://api.remailer.app/v1
            </code>
          </dd>
        </div>

        <div>
          <dt className="text-sm font-medium text-slate-600">Authentication</dt>
          <dd className="mt-1 text-sm text-slate-900">Bearer Token in Authorization header</dd>
        </div>

        <div>
          <dt className="text-sm font-medium text-slate-600">Rate Limits</dt>
          <dd className="mt-1 text-sm text-slate-900">
            <div>• 1000 requests/hour</div>
            <div>• 100 emails/minute</div>
          </dd>
        </div>

        <div>
          <dt className="text-sm font-medium text-slate-600">Response Format</dt>
          <dd className="mt-1 text-sm text-slate-900">JSON</dd>
        </div>
      </div>

      <div className="mt-6 pt-6 border-t border-slate-200">
        <h4 className="text-sm font-medium text-slate-900 mb-3">Available Endpoints</h4>
        <div className="space-y-2 text-sm">
          {endpoints.map((endpoint, index) => (
            <div key={index} className="flex items-center space-x-2">
              <Badge 
                variant={endpoint.color === "success" ? "default" : "secondary"}
                className={`w-12 text-xs ${
                  endpoint.color === "success" 
                    ? "bg-success/10 text-success" 
                    : "bg-primary/10 text-primary"
                }`}
              >
                {endpoint.method}
              </Badge>
              <span className="text-slate-600 font-mono">{endpoint.path}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6">
        <Button 
          variant="secondary" 
          className="w-full"
          onClick={() => window.open('#', '_blank')}
        >
          View Full Documentation
        </Button>
      </div>
    </div>
  );
}
