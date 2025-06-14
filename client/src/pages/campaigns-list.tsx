import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Plus, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Archive, 
  Eye,
  Calendar,
  Users,
  TrendingUp
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function CampaignsList() {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deactivateDialogOpen, setDeactivateDialogOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<any>(null);
  const { toast } = useToast();

  const { data: campaigns, isLoading } = useQuery({
    queryKey: ["/api/campaigns"],
  });

  const deleteCampaignMutation = useMutation({
    mutationFn: async (campaignId: number) => {
      await apiRequest("DELETE", `/api/campaigns/${campaignId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Campaign deleted",
        description: "The campaign has been permanently deleted.",
      });
      setDeleteDialogOpen(false);
      setSelectedCampaign(null);
    },
    onError: (error) => {
      toast({
        title: "Error deleting campaign",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const deactivateCampaignMutation = useMutation({
    mutationFn: async (campaignId: number) => {
      await apiRequest("PUT", `/api/campaigns/${campaignId}`, {
        status: "inactive"
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Campaign deactivated",
        description: "The campaign has been marked as inactive.",
      });
      setDeactivateDialogOpen(false);
      setSelectedCampaign(null);
    },
    onError: (error) => {
      toast({
        title: "Error deactivating campaign",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { label: "Draft", variant: "secondary" as const },
      scheduled: { label: "Scheduled", variant: "default" as const },
      sent: { label: "Sent", variant: "success" as const },
      sending: { label: "Sending", variant: "warning" as const },
      inactive: { label: "Inactive", variant: "destructive" as const },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || 
                  { label: status, variant: "secondary" as const };
    
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const canEdit = (campaign: any) => {
    return ["draft", "scheduled"].includes(campaign.status);
  };

  const canDelete = (campaign: any) => {
    return ["draft", "scheduled", "inactive"].includes(campaign.status);
  };

  const canDeactivate = (campaign: any) => {
    return ["sent", "sending"].includes(campaign.status);
  };

  const handleDelete = (campaign: any) => {
    setSelectedCampaign(campaign);
    setDeleteDialogOpen(true);
  };

  const handleDeactivate = (campaign: any) => {
    setSelectedCampaign(campaign);
    setDeactivateDialogOpen(true);
  };

  const confirmDelete = () => {
    if (selectedCampaign) {
      deleteCampaignMutation.mutate(selectedCampaign.id);
    }
  };

  const confirmDeactivate = () => {
    if (selectedCampaign) {
      deactivateCampaignMutation.mutate(selectedCampaign.id);
    }
  };

  return (
    <div>
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">Campaigns</h2>
            <p className="text-slate-600 mt-1">Manage your email campaigns</p>
          </div>
          <Link href="/campaigns">
            <Button className="flex items-center space-x-2">
              <Plus className="w-4 h-4" />
              <span>New Campaign</span>
            </Button>
          </Link>
        </div>
      </header>

      <div className="p-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-slate-600">Loading campaigns...</div>
          </div>
        ) : !campaigns || campaigns.length === 0 ? (
          <div className="text-center py-12">
            <div className="mx-auto w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-4">
              <TrendingUp className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-2">No campaigns yet</h3>
            <p className="text-slate-600 mb-6">Create your first email campaign to get started.</p>
            <Link href="/campaigns">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create Campaign
              </Button>
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-slate-200">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Campaign</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Recipients</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaigns.map((campaign: any) => (
                  <TableRow key={campaign.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium text-slate-900">{campaign.name}</div>
                        <div className="text-sm text-slate-500">From: {campaign.fromName}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(campaign.status)}
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs truncate">{campaign.subject}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center text-sm text-slate-600">
                        <Users className="w-4 h-4 mr-1" />
                        {campaign.recipientCount || 0}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-slate-600">
                        {formatDistanceToNow(new Date(campaign.createdAt), { addSuffix: true })}
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/campaigns/${campaign.id}/view`}>
                              <Eye className="w-4 h-4 mr-2" />
                              View Details
                            </Link>
                          </DropdownMenuItem>
                          
                          {canEdit(campaign) && (
                            <DropdownMenuItem asChild>
                              <Link href={`/campaigns/${campaign.id}/edit`}>
                                <Edit className="w-4 h-4 mr-2" />
                                Edit Campaign
                              </Link>
                            </DropdownMenuItem>
                          )}
                          
                          {canDeactivate(campaign) && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => handleDeactivate(campaign)}
                                className="text-orange-600"
                              >
                                <Archive className="w-4 h-4 mr-2" />
                                Mark Inactive
                              </DropdownMenuItem>
                            </>
                          )}
                          
                          {canDelete(campaign) && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => handleDelete(campaign)}
                                className="text-red-600"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete Campaign
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Campaign</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedCampaign?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete Campaign
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Deactivate Confirmation Dialog */}
      <AlertDialog open={deactivateDialogOpen} onOpenChange={setDeactivateDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Mark Campaign Inactive</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to mark "{selectedCampaign?.name}" as inactive? 
              This will stop any ongoing sending processes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeactivate}
              className="bg-orange-600 hover:bg-orange-700"
            >
              Mark Inactive
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}