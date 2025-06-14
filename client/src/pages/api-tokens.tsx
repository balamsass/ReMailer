import { useQuery } from "@tanstack/react-query";
import TokenList from "@/components/api/token-list";
import ApiDocumentation from "@/components/api/api-documentation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ApiTokens() {
  const { data: tokens, isLoading } = useQuery({
    queryKey: ["/api/tokens"],
  });

  return (
    <div>
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">API Token Management</h2>
            <p className="text-slate-600 mt-1">Generate and manage API tokens for programmatic access</p>
          </div>
          <Button className="flex items-center space-x-2">
            <Plus className="w-4 h-4" />
            <span>Generate New Token</span>
          </Button>
        </div>
      </header>

      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-slate-600">Loading tokens...</div>
              </div>
            ) : (
              <>
                <TokenList tokens={tokens || []} />
                <ApiUsageExamples />
              </>
            )}
          </div>
          <div className="lg:col-span-1">
            <ApiDocumentation />
          </div>
        </div>
      </div>
    </div>
  );
}

function ApiUsageExamples() {
  const examples = [
    {
      title: "Send a Campaign",
      code: `curl -X POST https://api.remailer.app/v1/campaigns/send \\
  -H "Authorization: Bearer rm_sk_your_token_here" \\
  -H "Content-Type: application/json" \\
  -d '{
    "campaign_id": "camp_123",
    "contacts": ["contact_1", "contact_2"],
    "schedule": "immediate"
  }'`,
    },
    {
      title: "Add Contacts",
      code: `curl -X POST https://api.remailer.app/v1/contacts \\
  -H "Authorization: Bearer rm_sk_your_token_here" \\
  -H "Content-Type: application/json" \\
  -d '{
    "email": "user@example.com",
    "name": "John Doe",
    "tags": ["newsletter", "premium"]
  }'`,
    },
    {
      title: "Get Campaign Analytics",
      code: `curl -X GET https://api.remailer.app/v1/campaigns/camp_123/analytics \\
  -H "Authorization: Bearer rm_sk_your_token_here"`,
    },
  ];

  return (
    <div className="bg-white rounded-xl border border-slate-200 mt-8">
      <div className="px-6 py-4 border-b border-slate-200">
        <h3 className="text-lg font-semibold text-slate-900">API Usage Examples</h3>
      </div>
      <div className="p-6">
        <div className="space-y-6">
          {examples.map((example, index) => (
            <div key={index}>
              <h4 className="text-sm font-medium text-slate-900 mb-2">{example.title}</h4>
              <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg overflow-x-auto text-sm font-mono">
                <code>{example.code}</code>
              </pre>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
