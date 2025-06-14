import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams } from "wouter";
import CampaignForm from "@/components/campaigns/campaign-form";
import EmailEditor from "@/components/campaigns/email-editor";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { insertCampaignSchema } from "@shared/schema";
import { Save, Send } from "lucide-react";

export default function Campaigns() {
  const [editorTab, setEditorTab] = useState<"visual" | "html" | "preview">("visual");
  const [emailContent, setEmailContent] = useState("");
  const [currentCampaign, setCurrentCampaign] = useState<any>(null);
  const { toast } = useToast();
  const params = useParams<{ id: string }>();
  const campaignId = params.id;
  
  const { data: campaigns, isLoading } = useQuery({
    queryKey: ["/api/campaigns"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/campaigns");
      return await response.json();
    }
  });

  // Load existing campaign data when editing
  const { data: campaignData } = useQuery({
    queryKey: ["/api/campaigns", campaignId],
    queryFn: async () => {
      if (!campaignId) return null;
      const response = await apiRequest("GET", `/api/campaigns/${campaignId}`);
      return await response.json();
    },
    enabled: !!campaignId
  });

  // Update email content when campaign data loads
  useEffect(() => {
    if (campaignData) {
      setCurrentCampaign(campaignData);
      setEmailContent(campaignData.htmlContent || "");
    }
  }, [campaignData]);

  const saveDraftMutation = useMutation({
    mutationFn: async (campaignData: any) => {
      const method = campaignId ? "PATCH" : "POST";
      const url = campaignId ? `/api/campaigns/${campaignId}` : "/api/campaigns";
      
      const response = await apiRequest(method, url, {
        ...campaignData,
        htmlContent: emailContent,
        status: "draft"
      });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns"] });
      toast({
        title: campaignId ? "Campaign updated" : "Draft saved",
        description: campaignId ? "Your campaign has been updated." : "Your campaign has been saved as a draft.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error saving campaign",
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
