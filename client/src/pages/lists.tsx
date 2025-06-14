import { useState } from "react";
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
  Settings
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

export default function Lists() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedList, setSelectedList] = useState<List | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const { toast } = useToast();

  const { data: listsData, isLoading } = useQuery({
    queryKey: ["/api/lists", searchTerm, statusFilter],
    queryFn: () => apiRequest("GET", `/api/lists?search=${encodeURIComponent(searchTerm)}&status=${statusFilter}`)
  });

  const createListMutation = useMutation({
    mutationFn: (data: ListFormData) => apiRequest("POST", "/api/lists", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/lists"] });
      setIsCreateDialogOpen(false);
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
    createListMutation.mutate(data);
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
      filterDefinition: list.filterDefinition,
      tags: list.tags,
      status: list.status
    });
    setIsEditDialogOpen(true);
  };

  const handleClone = (list: List) => {
    const newName = `${list.name} (Copy)`;
    cloneListMutation.mutate({ id: list.id, name: newName });
  };

  const handleDelete = (list: List) => {
    if (window.confirm(`Are you sure you want to delete "${list.name}"?`)) {
      deleteListMutation.mutate(list.id);
    }
  };

  const lists = listsData?.lists || [];
  const total = listsData?.total || 0;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-100 text-green-800";
      case "draft": return "bg-yellow-100 text-yellow-800";
      case "archived": return "bg-gray-100 text-gray-800";
      default: return "bg-blue-100 text-blue-800";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Lists</h1>
          <p className="text-muted-foreground">
            Create and manage targeted contact lists with dynamic filtering
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create List
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New List</DialogTitle>
              <DialogDescription>
                Start by giving your list a name and description. You can add filters later.
              </DialogDescription>
            </DialogHeader>
            <Form {...createForm}>
              <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="space-y-4">
                <FormField
                  control={createForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>List Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Active Customers" {...field} />
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
                        <Textarea 
                          placeholder="Brief description of this list..."
                          {...field}
                        />
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
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
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
                    onClick={() => setIsCreateDialogOpen(false)}
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
          </DialogContent>
        </Dialog>
      </div>

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