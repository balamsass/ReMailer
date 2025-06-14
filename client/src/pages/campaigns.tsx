import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import CampaignForm from "@/components/campaigns/campaign-form";
import EmailEditor from "@/components/campaigns/email-editor";
import { Save, Send } from "lucide-react";

export default function Campaigns() {
  const [editorTab, setEditorTab] = useState<"visual" | "html" | "preview">("visual");
  
  const { data: campaigns, isLoading } = useQuery({
    queryKey: ["/api/campaigns"],
  });

  return (
    <div>
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">Campaign Builder</h2>
            <p className="text-slate-600 mt-1">Create and manage your email campaigns</p>
          </div>
          <div className="flex space-x-3">
            <button className="border border-slate-300 text-slate-700 px-4 py-2 rounded-lg font-medium hover:bg-slate-50 transition-colors flex items-center space-x-2">
              <Save className="w-4 h-4" />
              <span>Save Draft</span>
            </button>
            <button className="bg-primary text-white px-4 py-2 rounded-lg font-medium hover:bg-primary/90 transition-colors flex items-center space-x-2">
              <Send className="w-4 h-4" />
              <span>Send Campaign</span>
            </button>
          </div>
        </div>
      </header>

      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Campaign Settings */}
            <div className="lg:col-span-1">
              <CampaignForm />
            </div>

            {/* Email Editor */}
            <div className="lg:col-span-2">
              <EmailEditor 
                activeTab={editorTab}
                onTabChange={setEditorTab}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
