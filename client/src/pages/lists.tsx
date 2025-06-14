import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertListSchema } from "@shared/schema";
import { z } from "zod";
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Eye, 
  Edit, 
  Copy, 
  Trash2,
  Users,
  Calendar,
  Settings,
  X,
  ChevronDown
} from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

type ListFormData = z.infer<typeof insertListSchema>;

interface List {
  id: number;
  name: string;
  description?: string;
  userId: number;
  filterDefinition: any;
  tags: string[];
  status: string;
  matchCount?: number;
  createdAt: string;
  updatedAt: string;
}

// Filter types and interfaces
interface FilterRule {
  id: string;
  field: string;
  operator: string;
  value: string;
}

interface FilterGroup {
  id: string;
  logic: 'AND' | 'OR';
  rules: FilterRule[];
  groups: FilterGroup[];
}

const FIELD_OPTIONS = [
  { value: 'email', label: 'Email' },
  { value: 'name', label: 'Name' },
  { value: 'phone', label: 'Phone' },
  { value: 'company', label: 'Company' },
  { value: 'jobTitle', label: 'Job Title' },
  { value: 'tags', label: 'Tags' },
  { value: 'status', label: 'Status' },
  { value: 'notes', label: 'Notes' }
];

const OPERATOR_OPTIONS = [
  { value: 'equals', label: 'Equals' },
  { value: 'notEquals', label: 'Not Equals' },
  { value: 'contains', label: 'Contains' },
  { value: 'notContains', label: 'Does Not Contain' },
  { value: 'startsWith', label: 'Starts With' },
  { value: 'endsWith', label: 'Ends With' },
  { value: 'isEmpty', label: 'Is Empty' },
  { value: 'isNotEmpty', label: 'Is Not Empty' }
];

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'bounced', label: 'Bounced' },
  { value: 'unsubscribed', label: 'Unsubscribed' }
];

export default function Lists() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedList, setSelectedList] = useState<List | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [filterDefinition, setFilterDefinition] = useState<FilterGroup>({
    id: 'root',
    logic: 'AND',
    rules: [],
    groups: []
  });
  const [previewContacts, setPreviewContacts] = useState<any[]>([]);
  const [previewCount, setPreviewCount] = useState(0);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const { toast } = useToast();

  const { data: listsData, isLoading } = useQuery({
    queryKey: ["/api/lists", searchTerm, statusFilter],
    queryFn: () => apiRequest("GET", `/api/lists?search=${encodeURIComponent(searchTerm)}&status=${statusFilter}`)
  });

  const createListMutation = useMutation({
    mutationFn: (data: ListFormData & { filterDefinition: FilterGroup }) => 
      apiRequest("POST", "/api/lists", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/lists"] });
      setIsCreateDialogOpen(false);
      setFilterDefinition({
        id: 'root',
        logic: 'AND',
        rules: [],
        groups: []
      });
      createForm.reset();
      toast({ title: "List created successfully" });
    },
    onError: (error) => {
      toast({ 
        title: "Error creating list", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  // Filter preview function
  const previewFilterMutation = useMutation({
    mutationFn: (filterDef: FilterGroup) => 
      apiRequest("POST", "/api/lists/preview", { filterDefinition: filterDef }),
    onSuccess: (data) => {
      setPreviewContacts(data.contacts);
      setPreviewCount(data.count);
    },
    onError: (error) => {
      toast({ 
        title: "Error previewing filter", 
        description: error.message, 
        variant: "destructive" 
      });
    }
  });

  // Generate unique ID for filter rules/groups
  const generateId = () => Math.random().toString(36).substr(2, 9);

  // Add new filter rule
  const addFilterRule = (groupId: string = 'root') => {
    const newRule: FilterRule = {
      id: generateId(),
      field: 'email',
      operator: 'contains',
      value: ''
    };

    const updateGroup = (group: FilterGroup): FilterGroup => {
      if (group.id === groupId) {
        return { ...group, rules: [...group.rules, newRule] };
      }
      return {
        ...group,
        groups: group.groups.map(updateGroup)
      };
    };

    setFilterDefinition(prev => updateGroup(prev));
  };

  // Remove filter rule
  const removeFilterRule = (ruleId: string) => {
    const updateGroup = (group: FilterGroup): FilterGroup => ({
      ...group,
      rules: group.rules.filter(rule => rule.id !== ruleId),
      groups: group.groups.map(updateGroup)
    });

    setFilterDefinition(prev => updateGroup(prev));
  };

  // Update filter rule
  const updateFilterRule = (ruleId: string, field: keyof FilterRule, value: string) => {
    const updateGroup = (group: FilterGroup): FilterGroup => ({
      ...group,
      rules: group.rules.map(rule => 
        rule.id === ruleId ? { ...rule, [field]: value } : rule
      ),
      groups: group.groups.map(updateGroup)
    });

    setFilterDefinition(prev => updateGroup(prev));
  };

  // Preview contacts based on current filter
  const previewFilter = () => {
    if (filterDefinition.rules.length === 0) {
      setPreviewContacts([]);
      setPreviewCount(0);
      return;
    }
    setIsPreviewLoading(true);
    previewFilterMutation.mutate(filterDefinition);
    setIsPreviewLoading(false);
  };

  // Auto-preview when filter changes
  useEffect(() => {
    const timer = setTimeout(() => {
      if (filterDefinition.rules.length > 0) {
        previewFilter();
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [filterDefinition]);

  const updateListMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<ListFormData> }) => 
      apiRequest("PUT", `/api/lists/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/lists"] });
      setIsEditDialogOpen(false);
      setSelectedList(null);
      toast({ title: "List updated successfully" });
    },
    onError: (error) => {
      toast({ 
        title: "Error updating list", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  const deleteListMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/lists/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/lists"] });
      toast({ title: "List deleted successfully" });
    },
    onError: (error) => {
      toast({ 
        title: "Error deleting list", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  const cloneListMutation = useMutation({
    mutationFn: ({ id, name }: { id: number; name: string }) => 
      apiRequest("POST", `/api/lists/${id}/clone`, { name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/lists"] });
      toast({ title: "List cloned successfully" });
    },
    onError: (error) => {
      toast({ 
        title: "Error cloning list", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  const createForm = useForm<ListFormData>({
    resolver: zodResolver(insertListSchema.omit({ userId: true })),
    defaultValues: {
      name: "",
      description: "",
      filterDefinition: { operator: "AND", rules: [] },
      tags: [],
      status: "active"
    }
  });

  const editForm = useForm<ListFormData>({
    resolver: zodResolver(insertListSchema.omit({ userId: true })),
    defaultValues: {
      name: "",
      description: "",
      filterDefinition: { operator: "AND", rules: [] },
      tags: [],
      status: "active"
    }
  });

  const onCreateSubmit = (data: ListFormData) => {
    createListMutation.mutate({
      ...data,
      filterDefinition
    });
  };

  const onEditSubmit = (data: Partial<ListFormData>) => {
    if (selectedList) {
      updateListMutation.mutate({ id: selectedList.id, data });
    }
  };

  const handleEdit = (list: List) => {
    setSelectedList(list);
    editForm.reset({
      name: list.name,
      description: list.description || "",
      status: list.status
    });
    setIsEditDialogOpen(true);
  };

  const handleDelete = (list: List) => {
    if (confirm(`Are you sure you want to delete "${list.name}"?`)) {
      deleteListMutation.mutate(list.id);
    }
  };

  const handleClone = (list: List) => {
    const newName = prompt(`Enter name for cloned list:`, `${list.name} (Copy)`);
    if (newName) {
      cloneListMutation.mutate({ id: list.id, name: newName });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'draft': return 'bg-yellow-100 text-yellow-800';
      case 'archived': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const lists = listsData?.lists || [];
  const total = listsData?.total || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Lists</h1>
          <p className="text-gray-600 mt-1">Create and manage targeted contact lists with dynamic filtering</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create List
            </Button>
          </DialogTrigger>
        </Dialog>
      </div>

      {/* Lists Overview */}
      <Card>
        <CardHeader>
          <CardTitle>All Lists ({total})</CardTitle>
          <CardDescription>
            Manage your contact lists and segmentation rules
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search lists..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter || "all"} onValueChange={(value) => setStatusFilter(value === "all" ? "" : value)}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="text-center py-8">Loading lists...</div>
          ) : lists.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No lists found</h3>
              <p className="text-gray-500 mb-4">
                {searchTerm || statusFilter ? 
                  "No lists match your current filters." : 
                  "Get started by creating your first contact list."
                }
              </p>
              {!searchTerm && !statusFilter && (
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First List
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Contacts</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lists.map((list: List) => (
                  <TableRow key={list.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{list.name}</div>
                        {list.description && (
                          <div className="text-sm text-muted-foreground">
                            {list.description}
                          </div>
                        )}
                        {list.tags && list.tags.length > 0 && (
                          <div className="flex gap-1 mt-1">
                            {list.tags.map((tag, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(list.status)}>
                        {list.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Users className="h-4 w-4 mr-1 text-muted-foreground" />
                        {list.matchCount ?? 0}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4 mr-1" />
                        {new Date(list.createdAt).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-muted-foreground">
                        {new Date(list.updatedAt).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/lists/${list.id}`}>
                              <Eye className="h-4 w-4 mr-2" />
                              View & Edit
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEdit(list)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Quick Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleClone(list)}>
                            <Copy className="h-4 w-4 mr-2" />
                            Clone List
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDelete(list)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create Dialog with Filter Builder */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New List</DialogTitle>
            <DialogDescription>
              Define your list criteria using the filter builder below. Preview matching contacts in real-time.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Basic Info */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">List Details</h3>
              <Form {...createForm}>
                <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="space-y-4">
                  <FormField
                    control={createForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>List Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Active Customers" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={createForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Brief description of this list..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={createForm.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="draft">Draft</SelectItem>
                            <SelectItem value="archived">Archived</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Filter Builder */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-md font-semibold">Filter Criteria</h4>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => addFilterRule()}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add Rule
                      </Button>
                    </div>

                    {filterDefinition.rules.length === 0 ? (
                      <div className="text-center py-6 border-2 border-dashed border-gray-300 rounded-lg">
                        <Filter className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-500 mb-2">No filter rules defined</p>
                        <p className="text-sm text-gray-400">Click "Add Rule" to start filtering contacts</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {filterDefinition.rules.map((rule, index) => (
                          <div key={rule.id} className="border rounded-lg p-3 bg-gray-50">
                            <div className="flex items-center space-x-2">
                              {index > 0 && (
                                <div className="text-sm font-medium text-gray-600 px-2">
                                  {filterDefinition.logic}
                                </div>
                              )}
                              <Select
                                value={rule.field}
                                onValueChange={(value) => updateFilterRule(rule.id, 'field', value)}
                              >
                                <SelectTrigger className="w-32">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {FIELD_OPTIONS.map((field) => (
                                    <SelectItem key={field.value} value={field.value}>
                                      {field.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <Select
                                value={rule.operator}
                                onValueChange={(value) => updateFilterRule(rule.id, 'operator', value)}
                              >
                                <SelectTrigger className="w-36">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {OPERATOR_OPTIONS.map((op) => (
                                    <SelectItem key={op.value} value={op.value}>
                                      {op.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              {rule.field === 'status' ? (
                                <Select
                                  value={rule.value}
                                  onValueChange={(value) => updateFilterRule(rule.id, 'value', value)}
                                >
                                  <SelectTrigger className="flex-1">
                                    <SelectValue placeholder="Select status" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {STATUS_OPTIONS.map((status) => (
                                      <SelectItem key={status.value} value={status.value}>
                                        {status.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              ) : (
                                <Input
                                  placeholder={rule.field === 'tags' ? 'Enter tag name...' : 'Enter value...'}
                                  value={rule.value}
                                  onChange={(e) => updateFilterRule(rule.id, 'value', e.target.value)}
                                  className="flex-1"
                                />
                              )}
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeFilterRule(rule.id)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => {
                        setIsCreateDialogOpen(false);
                        setFilterDefinition({
                          id: 'root',
                          logic: 'AND',
                          rules: [],
                          groups: []
                        });
                      }}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={createListMutation.isPending}
                    >
                      {createListMutation.isPending ? "Creating..." : "Create List"}
                    </Button>
                  </div>
                </form>
              </Form>
            </div>

            {/* Preview Panel */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Preview</h3>
                <div className="text-sm text-gray-600">
                  {previewCount > 0 ? `${previewCount} contacts match` : 'No matching contacts'}
                </div>
              </div>

              {filterDefinition.rules.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500">Add filter rules to preview results</p>
                </div>
              ) : isPreviewLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-gray-500 mt-2">Loading preview...</p>
                </div>
              ) : previewContacts.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500">No contacts match your criteria</p>
                  <p className="text-sm text-gray-400">Try adjusting your filter rules</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {previewContacts.slice(0, 10).map((contact) => (
                    <div key={contact.id} className="flex items-center space-x-3 p-2 bg-white rounded border">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-blue-700">
                          {contact.name?.charAt(0) || contact.email.charAt(0)}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 truncate">
                          {contact.name || contact.email}
                        </div>
                        <div className="text-xs text-gray-500 truncate">
                          {contact.email}
                          {contact.company && ` • ${contact.company}`}
                        </div>
                      </div>
                      {contact.tags && contact.tags.length > 0 && (
                        <div className="flex gap-1">
                          {contact.tags.slice(0, 2).map((tag, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                          {contact.tags.length > 2 && (
                            <span className="text-xs text-gray-400">+{contact.tags.length - 2}</span>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                  {previewContacts.length > 10 && (
                    <div className="text-center text-sm text-gray-500 py-2">
                      Showing 10 of {previewCount} matching contacts
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit List</DialogTitle>
            <DialogDescription>
              Update list details. Use the full editor for advanced filtering.
            </DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>List Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="archived">Archived</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end space-x-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsEditDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={updateListMutation.isPending}
                >
                  {updateListMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}