import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { insertListSchema, type List, type Contact } from "@shared/schema";
import { ArrowLeft, Save, Users, Mail, Building2 } from "lucide-react";
import { Link } from "wouter";

const listFormSchema = insertListSchema.omit({ userId: true });
type ListFormData = z.infer<typeof listFormSchema>;

export default function ListDetail() {
  const [, params] = useRoute("/lists/:id");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const listId = params?.id || "";

  const { data: list, isLoading: isListLoading } = useQuery({
    queryKey: ["/api/lists", listId],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/lists/${listId}`);
      return await response.json();
    },
    enabled: !!listId,
  });

  const { data: contactsData, isLoading: isContactsLoading } = useQuery({
    queryKey: ["/api/lists", listId, "contacts"],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/lists/${listId}/contacts`);
      return await response.json();
    },
    enabled: !!listId,
  });

  const form = useForm<ListFormData>({
    resolver: zodResolver(listFormSchema),
    defaultValues: {
      name: "",
      description: "",
      filterDefinition: { operator: "AND", rules: [] },
      tags: [],
      status: "active"
    }
  });

  // Update form when list data loads
  useEffect(() => {
    if (list) {
      form.reset({
        name: list.name || "",
        description: list.description || "",
        filterDefinition: list.filterDefinition || { operator: "AND", rules: [] },
        tags: list.tags || [],
        status: list.status || "active"
      });
    }
  }, [list, form]);

  const updateListMutation = useMutation({
    mutationFn: async (data: ListFormData) => {
      const response = await apiRequest("PATCH", `/api/lists/${listId}`, data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/lists"] });
      queryClient.invalidateQueries({ queryKey: ["/api/lists", listId] });
      toast({
        title: "List updated",
        description: "The list has been successfully updated.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error updating list",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ListFormData) => {
    updateListMutation.mutate(data);
  };

  if (isListLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!list) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">List not found</h2>
          <p className="text-muted-foreground mb-4">The list you're looking for doesn't exist.</p>
          <Link href="/lists">
            <Button>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Lists
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const contacts = contactsData?.contacts || [];

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/lists">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Lists
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">{list.name || "Unnamed List"}</h1>
          <p className="text-muted-foreground">
            Created {new Date(list.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* List Details Form */}
        <Card>
          <CardHeader>
            <CardTitle>List Details</CardTitle>
            <CardDescription>
              Update the list name, description, and settings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>List Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter list name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Enter list description" 
                          rows={3}
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex gap-2">
                  <Badge variant="secondary">
                    Status: {list.status}
                  </Badge>
                  <Badge variant="outline">
                    <Users className="h-3 w-3 mr-1" />
                    {list.matchCount || 0} contacts
                  </Badge>
                </div>

                {list.tags && list.tags.length > 0 && (
                  <div>
                    <FormLabel>Tags</FormLabel>
                    <div className="flex gap-1 mt-1">
                      {list.tags.map((tag: string, index: number) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <Button 
                  type="submit" 
                  disabled={updateListMutation.isPending}
                  className="w-full"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {updateListMutation.isPending ? "Updating..." : "Update List"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Filter Criteria */}
        <Card>
          <CardHeader>
            <CardTitle>Filter Criteria</CardTitle>
            <CardDescription>
              The criteria used to automatically populate this list
            </CardDescription>
          </CardHeader>
          <CardContent>
            {list.filterDefinition && list.filterDefinition.rules && list.filterDefinition.rules.length > 0 ? (
              <div className="space-y-2">
                {list.filterDefinition.rules.map((rule: any, index: number) => (
                  <div key={index} className="p-3 bg-muted rounded-lg">
                    <div className="text-sm">
                      <span className="font-medium">{rule.field}</span>
                      <span className="mx-2">{rule.operator}</span>
                      <span className="font-mono">{rule.value}</span>
                    </div>
                  </div>
                ))}
                <div className="text-xs text-muted-foreground mt-2">
                  Rules combined with: {list.filterDefinition.operator}
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground">No filter criteria defined</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Separator className="my-6" />

      {/* Contacts Table */}
      <Card>
        <CardHeader>
          <CardTitle>Contacts in this List</CardTitle>
          <CardDescription>
            {contacts.length} contacts match the filter criteria
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isContactsLoading ? (
            <div className="animate-pulse">
              <div className="h-64 bg-gray-200 rounded"></div>
            </div>
          ) : contacts.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Contact</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Tags</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contacts.map((contact: Contact) => (
                  <TableRow key={contact.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium flex items-center">
                          <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                          {contact.email}
                        </div>
                        {contact.name && (
                          <div className="text-sm text-muted-foreground">
                            {contact.name}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {contact.company ? (
                        <div className="flex items-center">
                          <Building2 className="h-4 w-4 mr-2 text-muted-foreground" />
                          {contact.company}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={contact.status === "active" ? "default" : "secondary"}>
                        {contact.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {contact.tags && contact.tags.length > 0 ? (
                        <div className="flex gap-1">
                          {contact.tags.slice(0, 3).map((tag, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                          {contact.tags.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{contact.tags.length - 3}
                            </Badge>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No contacts found</h3>
              <p className="text-muted-foreground">
                This list doesn't match any contacts yet.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}