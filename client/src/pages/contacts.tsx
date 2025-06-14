import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import ContactsTable from "@/components/contacts/contacts-table";
import ContactUpload from "@/components/contacts/contact-upload";
import { Upload, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function Contacts() {
  const [search, setSearch] = useState("");
  const [selectedTags, setSelectedTags] = useState("all");
  const [showUpload, setShowUpload] = useState(false);
  const [showAddContact, setShowAddContact] = useState(false);
  const [showEditContact, setShowEditContact] = useState(false);
  const [editingContact, setEditingContact] = useState<any>(null);
  const [newContact, setNewContact] = useState({
    email: "",
    name: "",
    phone: "",
    company: "",
    jobTitle: "",
    tags: "",
    notes: ""
  });
  const [editContact, setEditContact] = useState({
    email: "",
    name: "",
    phone: "",
    company: "",
    jobTitle: "",
    tags: "",
    notes: ""
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: contactsData, isLoading } = useQuery({
    queryKey: ["/api/contacts", { search, tags: selectedTags === "all" ? "" : selectedTags }],
  });

  const addContactMutation = useMutation({
    mutationFn: async (contactData: any) => {
      await apiRequest("POST", "/api/contacts", contactData);
    },
    onSuccess: () => {
      toast({
        title: "Contact added",
        description: "Contact has been successfully added",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
      setShowAddContact(false);
      setNewContact({ email: "", name: "", phone: "", company: "", jobTitle: "", tags: "", notes: "" });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add contact",
        variant: "destructive",
      });
    },
  });

  const editContactMutation = useMutation({
    mutationFn: async ({ id, contactData }: { id: number; contactData: any }) => {
      await apiRequest("PUT", `/api/contacts/${id}`, contactData);
    },
    onSuccess: () => {
      toast({
        title: "Contact updated",
        description: "Contact has been successfully updated",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
      setShowEditContact(false);
      setEditingContact(null);
      setEditContact({ email: "", name: "", phone: "", company: "", jobTitle: "", tags: "", notes: "" });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update contact",
        variant: "destructive",
      });
    },
  });

  const handleAddContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContact.email) {
      toast({
        title: "Error",
        description: "Email is required",
        variant: "destructive",
      });
      return;
    }
    
    // Format data according to schema
    const contactData = {
      email: newContact.email,
      name: newContact.name || null,
      phone: newContact.phone || null,
      company: newContact.company || null,
      jobTitle: newContact.jobTitle || null,
      notes: newContact.notes || null,
      tags: newContact.tags ? newContact.tags.split(',').map(tag => tag.trim()).filter(tag => tag) : []
    };
    
    addContactMutation.mutate(contactData);
  };

  const handleEditContact = (contact: any) => {
    setEditingContact(contact);
    setEditContact({
      email: contact.email,
      name: contact.name || "",
      phone: contact.phone || "",
      company: contact.company || "",
      jobTitle: contact.jobTitle || "",
      notes: contact.notes || "",
      tags: Array.isArray(contact.tags) ? contact.tags.join(", ") : ""
    });
    setShowEditContact(true);
  };

  const handleUpdateContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editContact.email) {
      toast({
        title: "Error",
        description: "Email is required",
        variant: "destructive",
      });
      return;
    }
    
    // Format data according to schema
    const contactData = {
      email: editContact.email,
      name: editContact.name || null,
      phone: editContact.phone || null,
      company: editContact.company || null,
      jobTitle: editContact.jobTitle || null,
      notes: editContact.notes || null,
      tags: editContact.tags ? editContact.tags.split(',').map(tag => tag.trim()).filter(tag => tag) : []
    };
    
    editContactMutation.mutate({ id: editingContact.id, contactData });
  };

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
            <Dialog open={showAddContact} onOpenChange={setShowAddContact}>
              <DialogTrigger asChild>
                <Button className="flex items-center space-x-2">
                  <Plus className="w-4 h-4" />
                  <span>Add Contact</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Add New Contact</DialogTitle>
                  <DialogDescription>
                    Add a new contact to your mailing list. Email is required.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleAddContact} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="contact@example.com"
                      value={newContact.email}
                      onChange={(e) => setNewContact(prev => ({ ...prev, email: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="John Doe"
                      value={newContact.name}
                      onChange={(e) => setNewContact(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+1 (555) 123-4567"
                      value={newContact.phone}
                      onChange={(e) => setNewContact(prev => ({ ...prev, phone: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tags">Tags</Label>
                    <Input
                      id="tags"
                      type="text"
                      placeholder="newsletter, vip, customer"
                      value={newContact.tags}
                      onChange={(e) => setNewContact(prev => ({ ...prev, tags: e.target.value }))}
                    />
                  </div>
                  <div className="flex justify-end space-x-2 pt-4">
                    <Button type="button" variant="outline" onClick={() => setShowAddContact(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={addContactMutation.isPending}>
                      {addContactMutation.isPending ? "Adding..." : "Add Contact"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
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
          <ContactsTable contacts={contactsData?.contacts || []} onEditContact={handleEditContact} />
        )}

        {/* Upload Modal */}
        {showUpload && (
          <ContactUpload 
            isOpen={showUpload}
            onClose={() => setShowUpload(false)}
          />
        )}

        {/* Add Contact Dialog */}
        <Dialog open={showAddContact} onOpenChange={setShowAddContact}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add New Contact</DialogTitle>
              <DialogDescription>
                Add a new contact to your list. Email is required.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddContact} className="space-y-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="email" className="text-right">
                  Email *
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={newContact.email}
                  onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Name
                </Label>
                <Input
                  id="name"
                  value={newContact.name}
                  onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="phone" className="text-right">
                  Phone
                </Label>
                <Input
                  id="phone"
                  value={newContact.phone}
                  onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="company" className="text-right">
                  Company
                </Label>
                <Input
                  id="company"
                  value={newContact.company}
                  onChange={(e) => setNewContact({ ...newContact, company: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="jobTitle" className="text-right">
                  Job Title
                </Label>
                <Input
                  id="jobTitle"
                  value={newContact.jobTitle}
                  onChange={(e) => setNewContact({ ...newContact, jobTitle: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="tags" className="text-right">
                  Tags
                </Label>
                <Input
                  id="tags"
                  value={newContact.tags}
                  onChange={(e) => setNewContact({ ...newContact, tags: e.target.value })}
                  placeholder="tag1, tag2, tag3"
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="notes" className="text-right">
                  Notes
                </Label>
                <Input
                  id="notes"
                  value={newContact.notes}
                  onChange={(e) => setNewContact({ ...newContact, notes: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <DialogFooter>
                <Button type="submit" disabled={addContactMutation.isPending}>
                  {addContactMutation.isPending ? "Adding..." : "Add Contact"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Edit Contact Dialog */}
        <Dialog open={showEditContact} onOpenChange={setShowEditContact}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Edit Contact</DialogTitle>
              <DialogDescription>
                Update contact information. Email is required.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleUpdateContact} className="space-y-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-email" className="text-right">
                  Email *
                </Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editContact.email}
                  onChange={(e) => setEditContact({ ...editContact, email: e.target.value })}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-name" className="text-right">
                  Name
                </Label>
                <Input
                  id="edit-name"
                  value={editContact.name}
                  onChange={(e) => setEditContact({ ...editContact, name: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-phone" className="text-right">
                  Phone
                </Label>
                <Input
                  id="edit-phone"
                  value={editContact.phone}
                  onChange={(e) => setEditContact({ ...editContact, phone: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-company" className="text-right">
                  Company
                </Label>
                <Input
                  id="edit-company"
                  value={editContact.company}
                  onChange={(e) => setEditContact({ ...editContact, company: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-jobTitle" className="text-right">
                  Job Title
                </Label>
                <Input
                  id="edit-jobTitle"
                  value={editContact.jobTitle}
                  onChange={(e) => setEditContact({ ...editContact, jobTitle: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-tags" className="text-right">
                  Tags
                </Label>
                <Input
                  id="edit-tags"
                  value={editContact.tags}
                  onChange={(e) => setEditContact({ ...editContact, tags: e.target.value })}
                  placeholder="tag1, tag2, tag3"
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-notes" className="text-right">
                  Notes
                </Label>
                <Input
                  id="edit-notes"
                  value={editContact.notes}
                  onChange={(e) => setEditContact({ ...editContact, notes: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <DialogFooter>
                <Button type="submit" disabled={editContactMutation.isPending}>
                  {editContactMutation.isPending ? "Updating..." : "Update Contact"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
