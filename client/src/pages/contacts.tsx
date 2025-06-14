import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import ContactsTable from "@/components/contacts/contacts-table";
import ContactUpload from "@/components/contacts/contact-upload";
import { Upload, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Contacts() {
  const [search, setSearch] = useState("");
  const [selectedTags, setSelectedTags] = useState("all");
  const [showUpload, setShowUpload] = useState(false);

  const { data: contactsData, isLoading } = useQuery({
    queryKey: ["/api/contacts", { search, tags: selectedTags === "all" ? "" : selectedTags }],
  });

  return (
    <div>
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">Contact Management</h2>
            <p className="text-slate-600 mt-1">Manage your subscriber lists and segments</p>
          </div>
          <div className="flex space-x-3">
            <Button 
              variant="outline"
              onClick={() => setShowUpload(true)}
              className="flex items-center space-x-2"
            >
              <Upload className="w-4 h-4" />
              <span>Import CSV</span>
            </Button>
            <Button className="flex items-center space-x-2">
              <Plus className="w-4 h-4" />
              <span>Add Contact</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="p-6">
        {/* Toolbar */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Search contacts..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 w-64"
                />
                <svg className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <Select value={selectedTags} onValueChange={setSelectedTags}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All Tags" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tags</SelectItem>
                  <SelectItem value="newsletter">Newsletter</SelectItem>
                  <SelectItem value="product">Product Users</SelectItem>
                  <SelectItem value="vip">VIP</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2 text-sm text-slate-600">
              <span>{contactsData?.total || 0} contacts</span>
              <span>•</span>
              <span>{contactsData?.active || 0} active</span>
            </div>
          </div>
        </div>

        {/* Contacts Table */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-slate-600">Loading contacts...</div>
          </div>
        ) : (
          <ContactsTable contacts={contactsData?.contacts || []} />
        )}

        {/* Upload Modal */}
        {showUpload && (
          <ContactUpload 
            isOpen={showUpload}
            onClose={() => setShowUpload(false)}
          />
        )}
      </div>
    </div>
  );
}
