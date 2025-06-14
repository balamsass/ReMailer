import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import CampaignForm from "@/components/campaigns/campaign-form";
import EmailEditor from "@/components/campaigns/email-editor";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { insertCampaignSchema } from "@shared/schema";
import { Save, Send } from "lucide-react";

export default function Campaigns() {
  const [editorTab, setEditorTab] = useState<"visual" | "html" | "preview">("visual");
  const [emailContent, setEmailContent] = useState("");
  const { toast } = useToast();
  
  const { data: campaigns, isLoading } = useQuery({
    queryKey: ["/api/campaigns"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/campaigns");
      return await response.json();
    }
  });

  const saveDraftMutation = useMutation({
    mutationFn: async (campaignData: any) => {
      const response = await apiRequest("POST", "/api/campaigns", {
        ...campaignData,
        content: emailContent,
        status: "draft"
      });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns"] });
      toast({
        title: "Draft saved",
        description: "Your campaign has been saved as a draft.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error saving draft",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const sendCampaignMutation = useMutation({
    mutationFn: async (campaignData: any) => {
      const response = await apiRequest("POST", "/api/campaigns", {
        ...campaignData,
        content: emailContent,
        status: campaignData.schedule === "now" ? "sent" : "scheduled"
      });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns"] });
      toast({
        title: "Campaign sent",
        description: "Your campaign has been sent successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error sending campaign",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleSaveDraft = (data: any) => {
    saveDraftMutation.mutate(data);
  };

  const handleSendCampaign = (data: any) => {
    sendCampaignMutation.mutate(data);
  };

  return (
    <div>
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">Campaign Builder</h2>
            <p className="text-slate-600 mt-1">Create and manage your email campaigns</p>
          </div>
        </div>
      </header>

      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Campaign Settings */}
            <div className="lg:col-span-1">
              <CampaignForm 
                onSaveDraft={handleSaveDraft}
                onSendCampaign={handleSendCampaign}
              />
            </div>

            {/* Email Editor */}
            <div className="lg:col-span-2">
              <EmailEditor 
                activeTab={editorTab}
                onTabChange={setEditorTab}
                onContentChange={setEmailContent}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
