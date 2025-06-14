import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload, FileText, AlertCircle, CheckCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface ContactUploadProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ContactUpload({ isOpen, onClose }: ContactUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploadResult, setUploadResult] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const uploadMutation = useMutation({
    mutationFn: async (contacts: any[]) => {
      const response = await apiRequest("POST", "/api/contacts/import", { contacts });
      return response.json();
    },
    onSuccess: (data) => {
      setUploadResult(data);
      queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
      toast({
        title: "Contacts imported successfully",
        description: `${data.successful || 0} contacts added, ${data.failed || 0} failed`,
      });
    },
    onError: (error) => {
      toast({
        title: "Import failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setUploadResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    try {
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length === 0) {
        toast({
          title: "Invalid file",
          description: "The CSV file appears to be empty",
          variant: "destructive",
        });
        return;
      }

      // Parse CSV (simple implementation)
      const contacts = lines.slice(1).map((line, index) => {
        const columns = line.split(',').map(col => col.trim().replace(/"/g, ''));
        
        if (columns.length < 2) {
          throw new Error(`Invalid row ${index + 2}: insufficient columns`);
        }

        return {
          email: columns[0],
          name: columns[1] || null,
          tags: columns[2] ? columns[2].split(';').filter(tag => tag.trim()) : [],
        };
      }).filter(contact => contact.email);

      uploadMutation.mutate(contacts);
    } catch (error) {
      toast({
        title: "Parse error",
        description: error instanceof Error ? error.message : "Failed to parse CSV file",
        variant: "destructive",
      });
    }
  };

  const handleClose = () => {
    setFile(null);
    setUploadResult(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Import Contacts from CSV</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {!uploadResult ? (
            <>
              {/* File Upload Area */}
              <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center">
                <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-sm text-slate-600 mb-2">
                  {file ? file.name : "Choose a CSV file or drag it here"}
                </p>
                <Button 
                  variant="outline" 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadMutation.isPending}
                >
                  Select File
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>

              {/* CSV Format Info */}
              <div className="bg-slate-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-slate-900 mb-2">CSV Format</h4>
                <p className="text-xs text-slate-600 mb-2">
                  Your CSV should have the following columns:
                </p>
                <code className="text-xs bg-white px-2 py-1 rounded border block">
                  email, name, tags
                </code>
                <p className="text-xs text-slate-500 mt-2">
                  Tags should be separated by semicolons. Example: newsletter;vip
                </p>
              </div>

              {/* Upload Button */}
              <div className="flex space-x-3">
                <Button 
                  onClick={handleUpload}
                  disabled={!file || uploadMutation.isPending}
                  className="flex-1"
                >
                  {uploadMutation.isPending ? "Importing..." : "Import Contacts"}
                </Button>
                <Button variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
              </div>
            </>
          ) : (
            /* Upload Results */
            <div className="text-center">
              {uploadResult.successful > 0 ? (
                <>
                  <CheckCircle className="w-12 h-12 text-success mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-slate-900 mb-2">Import Complete</h3>
                  <p className="text-slate-600 mb-4">
                    Successfully imported {uploadResult.successful} contacts
                    {uploadResult.failed > 0 && ` (${uploadResult.failed} failed)`}
                  </p>
                </>
              ) : (
                <>
                  <AlertCircle className="w-12 h-12 text-error mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-slate-900 mb-2">Import Failed</h3>
                  <p className="text-slate-600 mb-4">
                    No contacts were imported. Please check your CSV format.
                  </p>
                </>
              )}
              
              <Button onClick={handleClose} className="w-full">
                Close
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
