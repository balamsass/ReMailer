import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Copy, Edit, Trash2, Plus } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { ApiToken } from "@shared/schema";

interface TokenListProps {
  tokens: ApiToken[];
}

export default function TokenList({ tokens }: TokenListProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const createMutation = useMutation({
    mutationFn: async (data: { name: string; scope: string }) => {
      const response = await apiRequest("POST", "/api/tokens", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tokens"] });
      setShowCreateModal(false);
      toast({
        title: "Token created successfully",
        description: "Your new API token has been generated.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to create token",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (tokenId: number) => {
      await apiRequest("DELETE", `/api/tokens/${tokenId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tokens"] });
      toast({
        title: "Token deleted",
        description: "The API token has been removed.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to delete token",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: "Copied to clipboard",
        description: "The API token has been copied.",
      });
    });
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffInDays === 0) {
        return "Today";
      } else if (diffInDays < 7) {
        return `${diffInDays} days ago`;
      } else if (diffInDays < 30) {
        const weeks = Math.floor(diffInDays / 7);
        return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
      } else {
        return date.toLocaleDateString();
      }
    } catch {
      return "Invalid date";
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200">
      <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-900">Active API Tokens</h3>
        <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
          <DialogTrigger asChild>
            <Button size="sm" className="flex items-center space-x-2">
              <Plus className="w-4 h-4" />
              <span>New Token</span>
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Generate New API Token</DialogTitle>
            </DialogHeader>
            <CreateTokenForm 
              onSubmit={(data) => createMutation.mutate(data)}
              isLoading={createMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      </div>

      {tokens.length === 0 ? (
        <div className="p-12 text-center">
          <div className="text-slate-400 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </div>
          <h4 className="text-lg font-medium text-slate-900 mb-2">No API tokens</h4>
          <p className="text-slate-600">Generate your first API token to start using the ReMailer API.</p>
        </div>
      ) : (
        <div className="divide-y divide-slate-200">
          {tokens.map((token) => (
            <div key={token.id} className="px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h4 className="text-sm font-medium text-slate-900">{token.name}</h4>
                    <Badge variant={token.isActive ? "default" : "secondary"}>
                      {token.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-slate-600">
                    <span>Created: {formatDate(token.createdAt)}</span>
                    <span>Last used: {token.lastUsedAt ? formatDate(token.lastUsedAt) : "Never"}</span>
                    <span>Scope: {token.scope}</span>
                  </div>
                  <div className="mt-3">
                    <div className="flex items-center space-x-2">
                      <code className="bg-slate-100 px-3 py-1 rounded font-mono text-sm">
                        {token.token.slice(0, 12)}...{token.token.slice(-4)}
                      </code>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyToClipboard(token.token)}
                        className="text-primary"
                      >
                        <Copy className="w-4 h-4 mr-1" />
                        Copy
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button size="sm" variant="ghost" className="text-slate-400">
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="text-error"
                    onClick={() => deleteMutation.mutate(token.id)}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CreateTokenForm({ onSubmit, isLoading }: { onSubmit: (data: any) => void; isLoading: boolean }) {
  const [name, setName] = useState("");
  const [scope, setScope] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name && scope) {
      onSubmit({ name, scope });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="token-name">Token Name</Label>
        <Input
          id="token-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Production API Key"
          required
        />
      </div>

      <div>
        <Label htmlFor="token-scope">Scope</Label>
        <Select value={scope} onValueChange={setScope} required>
          <SelectTrigger>
            <SelectValue placeholder="Select permissions" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="campaigns:read">Campaigns (Read Only)</SelectItem>
            <SelectItem value="campaigns:write,contacts:read">Campaigns (Write) + Contacts (Read)</SelectItem>
            <SelectItem value="campaigns:write,contacts:write">Full Access</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex space-x-3">
        <Button type="submit" disabled={!name || !scope || isLoading} className="flex-1">
          {isLoading ? "Generating..." : "Generate Token"}
        </Button>
      </div>
    </form>
  );
}
