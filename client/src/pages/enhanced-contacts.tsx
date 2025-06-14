import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Upload } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { insertContactSchema, type Contact } from "@shared/schema";
import EnhancedContactsTable from "@/components/contacts/enhanced-contacts-table";
import ContactUpload from "@/components/contacts/contact-upload";
import { useToast } from "@/hooks/use-toast";

const contactFormSchema = z.object({
  email: z.string().email("Invalid email address"),
  name: z.string().optional(),
  phone: z.string().optional(),
  company: z.string().optional(),
  jobTitle: z.string().optional(),
  notes: z.string().optional(),
  tags: z.string().optional(),
  status: z.string().default("active"),
});

type ContactFormData = z.infer<typeof contactFormSchema>;

export default function EnhancedContacts() {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Build query parameters
  const queryParams = new URLSearchParams();
  if (searchTerm) queryParams.append('search', searchTerm);
  if (statusFilter) queryParams.append('status', statusFilter);
  if (sortBy) queryParams.append('sortBy', sortBy);
  if (sortOrder) queryParams.append('sortOrder', sortOrder);
  
  const queryString = queryParams.toString();
  const queryKey = `/api/contacts${queryString ? `?${queryString}` : ''}`;

  const { data: contactsData, isLoading } = useQuery({
    queryKey: [queryKey],
    retry: false,
  });

  const contacts = contactsData?.contacts || [];
  const total = contactsData?.total || 0;
  const active = contactsData?.active || 0;

  const form = useForm<ContactFormData>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      email: "",
      name: "",
      phone: "",
      company: "",
      jobTitle: "",
      notes: "",
      tags: "",
      status: "active",
    },
  });

  const createContactMutation = useMutation({
    mutationFn: async (data: ContactFormData) => {
      const contactData = {
        ...data,
        tags: data.tags ? data.tags.split(',').map(tag => tag.trim()).filter(Boolean) : [],
      };
      return apiRequest('POST', '/api/contacts', contactData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/contacts'] });
      setIsAddOpen(false);
      form.reset();
      toast({
        title: "Success",
        description: "Contact created successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateContactMutation = useMutation({
    mutationFn: async (data: ContactFormData) => {
      if (!editingContact) throw new Error("No contact selected for editing");
      const contactData = {
        ...data,
        tags: data.tags ? data.tags.split(',').map(tag => tag.trim()).filter(Boolean) : [],
      };
      return apiRequest('PATCH', `/api/contacts/${editingContact.id}`, contactData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/contacts'] });
      setEditingContact(null);
      setIsAddOpen(false);
      form.reset();
      toast({
        title: "Success",
        description: "Contact updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteContactMutation = useMutation({
    mutationFn: async (contactId: number) => {
      return apiRequest('DELETE', `/api/contacts/${contactId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/contacts'] });
      toast({
        title: "Success",
        description: "Contact deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const changeStatusMutation = useMutation({
    mutationFn: async ({ contactId, status }: { contactId: number; status: string }) => {
      return apiRequest('PATCH', `/api/contacts/${contactId}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/contacts'] });
      toast({
        title: "Success",
        description: "Contact status updated",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const bulkActionMutation = useMutation({
    mutationFn: async ({ action, contactIds }: { action: string; contactIds: number[] }) => {
      if (action === 'delete') {
        return apiRequest('POST', '/api/contacts/bulk-delete', { contactIds });
      } else {
        const status = action === 'activate' ? 'active' : 
                     action === 'deactivate' ? 'inactive' :
                     action === 'bounced' ? 'bounced' : 'unsubscribed';
        return apiRequest('POST', '/api/contacts/bulk-update-status', { contactIds, status });
      }
    },
    onSuccess: (_, { action }) => {
      queryClient.invalidateQueries({ queryKey: ['/api/contacts'] });
      toast({
        title: "Success",
        description: action === 'delete' 
          ? "Contacts deleted successfully"
          : "Contact status updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSearch = (search: string) => {
    setSearchTerm(search);
  };

  const handleFilter = (filters: { status?: string; tags?: string }) => {
    if (filters.status !== undefined) {
      setStatusFilter(filters.status);
    }
  };

  const handleSort = (newSortBy: string, newSortOrder: 'asc' | 'desc') => {
    setSortBy(newSortBy);
    setSortOrder(newSortOrder);
  };

  const handleBulkAction = (action: 'delete' | 'activate' | 'deactivate' | 'bounced' | 'unsubscribed', contactIds: number[]) => {
    bulkActionMutation.mutate({ action, contactIds });
  };

  const handleEditContact = (contact: Contact) => {
    setEditingContact(contact);
    form.reset({
      email: contact.email,
      name: contact.name || "",
      phone: contact.phone || "",
      company: contact.company || "",
      jobTitle: contact.jobTitle || "",
      notes: contact.notes || "",
      tags: contact.tags?.join(', ') || "",
      status: contact.status,
    });
    setIsAddOpen(true);
  };

  const handleDeleteContact = (contactId: number) => {
    deleteContactMutation.mutate(contactId);
  };

  const handleChangeStatus = (contactId: number, status: string) => {
    changeStatusMutation.mutate({ contactId, status });
  };

  const onSubmit = (data: ContactFormData) => {
    if (editingContact) {
      updateContactMutation.mutate(data);
    } else {
      createContactMutation.mutate(data);
    }
  };

  const resetForm = () => {
    setEditingContact(null);
    form.reset();
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Contacts</h1>
          <p className="text-gray-600 mt-1">Manage your email contacts and subscriber lists</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setIsUploadOpen(true)} variant="outline">
            <Upload className="w-4 h-4 mr-2" />
            Import CSV
          </Button>
          <Dialog open={isAddOpen} onOpenChange={(open) => {
            setIsAddOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Contact
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingContact ? 'Edit Contact' : 'Add New Contact'}
                </DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email *</FormLabel>
                        <FormControl>
                          <Input placeholder="contact@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input placeholder="John Doe" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone</FormLabel>
                          <FormControl>
                            <Input placeholder="+1234567890" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="company"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Company</FormLabel>
                          <FormControl>
                            <Input placeholder="Acme Corp" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="jobTitle"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Job Title</FormLabel>
                        <FormControl>
                          <Input placeholder="Software Engineer" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                            <SelectItem value="bounced">Bounced</SelectItem>
                            <SelectItem value="unsubscribed">Unsubscribed</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="tags"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tags</FormLabel>
                        <FormControl>
                          <Input placeholder="customer, vip, newsletter (comma separated)" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Additional notes about this contact..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => {
                      setIsAddOpen(false);
                      resetForm();
                    }}>
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={createContactMutation.isPending || updateContactMutation.isPending}
                    >
                      {editingContact ? 'Update' : 'Create'} Contact
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Contact Management</CardTitle>
          <CardDescription>
            View, search, filter, and manage your contacts with advanced bulk operations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EnhancedContactsTable
            contacts={contacts}
            total={total}
            active={active}
            isLoading={isLoading}
            onSearch={handleSearch}
            onFilter={handleFilter}
            onSort={handleSort}
            onBulkAction={handleBulkAction}
            onEditContact={handleEditContact}
            onDeleteContact={handleDeleteContact}
            onChangeStatus={handleChangeStatus}
          />
        </CardContent>
      </Card>

      <ContactUpload
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
      />
    </div>
  );
}