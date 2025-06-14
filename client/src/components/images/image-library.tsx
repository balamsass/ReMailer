import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Search, Upload, Plus, Edit, Trash2, ExternalLink, Copy } from "lucide-react";
import type { Image } from "@shared/schema";

interface ImageLibraryProps {
  onImageSelect?: (image: Image) => void;
  showSelectButton?: boolean;
  className?: string;
}

interface ImageFormData {
  name: string;
  url: string;
  altText?: string;
  description?: string;
  tags: string[];
}

export default function ImageLibrary({ onImageSelect, showSelectButton = false, className }: ImageLibraryProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [editingImage, setEditingImage] = useState<Image | null>(null);
  const [formData, setFormData] = useState<ImageFormData>({
    name: "",
    url: "",
    altText: "",
    description: "",
    tags: []
  });
  const [newTag, setNewTag] = useState("");

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: imagesData, isLoading } = useQuery<{images: Image[], total: number}>({
    queryKey: ["/api/images", { search: searchTerm, tags: selectedTags.join(",") }],
  });

  const createImageMutation = useMutation({
    mutationFn: async (data: Omit<ImageFormData, "tags"> & { tags: string[] }) => {
      return await apiRequest("/api/images", "POST", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/images"] });
      setIsUploadDialogOpen(false);
      resetForm();
      toast({
        title: "Success",
        description: "Image added to library successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add image",
        variant: "destructive",
      });
    },
  });

  const updateImageMutation = useMutation({
    mutationFn: async (data: { id: number } & Partial<ImageFormData>) => {
      const { id, ...updateData } = data;
      return await apiRequest(`/api/images/${id}`, "PUT", updateData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/images"] });
      setEditingImage(null);
      resetForm();
      toast({
        title: "Success",
        description: "Image updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update image",
        variant: "destructive",
      });
    },
  });

  const deleteImageMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest(`/api/images/${id}`, "DELETE");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/images"] });
      toast({
        title: "Success",
        description: "Image deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete image",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      url: "",
      altText: "",
      description: "",
      tags: []
    });
    setNewTag("");
  };

  const handleSubmit = useCallback(() => {
    if (!formData.name || !formData.url) {
      toast({
        title: "Error",
        description: "Name and URL are required",
        variant: "destructive",
      });
      return;
    }

    if (editingImage) {
      updateImageMutation.mutate({ id: editingImage.id, ...formData });
    } else {
      createImageMutation.mutate(formData);
    }
  }, [formData, editingImage, createImageMutation, updateImageMutation, toast]);

  const handleEditImage = (image: Image) => {
    setEditingImage(image);
    setFormData({
      name: image.name,
      url: image.url,
      altText: image.altText || "",
      description: image.description || "",
      tags: image.tags || []
    });
    setIsUploadDialogOpen(true);
  };

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    toast({
      title: "Copied",
      description: "Image URL copied to clipboard",
    });
  };

  const allTags = imagesData?.images?.reduce((tags: string[], image: Image) => {
    image.tags?.forEach(tag => {
      if (!tags.includes(tag)) tags.push(tag);
    });
    return tags;
  }, []) || [];

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Image Library</h2>
        <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setEditingImage(null); }}>
              <Upload className="h-4 w-4 mr-2" />
              Add Image
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingImage ? "Edit Image" : "Add New Image"}</DialogTitle>
            </DialogHeader>

            <Tabs defaultValue="url" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="url">From URL</TabsTrigger>
                <TabsTrigger value="upload" disabled>Upload File</TabsTrigger>
              </TabsList>

              <TabsContent value="url" className="space-y-4">
                <div className="grid gap-4">
                  <div>
                    <Label htmlFor="image-name">Name *</Label>
                    <Input
                      id="image-name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter image name"
                    />
                  </div>

                  <div>
                    <Label htmlFor="image-url">Image URL *</Label>
                    <Input
                      id="image-url"
                      type="url"
                      value={formData.url}
                      onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                      placeholder="https://example.com/image.jpg"
                    />
                  </div>

                  <div>
                    <Label htmlFor="alt-text">Alt Text</Label>
                    <Input
                      id="alt-text"
                      value={formData.altText}
                      onChange={(e) => setFormData(prev => ({ ...prev, altText: e.target.value }))}
                      placeholder="Descriptive text for accessibility"
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Optional description"
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label>Tags</Label>
                    <div className="flex gap-2 mb-2">
                      <Input
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        placeholder="Add tag"
                        onKeyPress={(e) => e.key === "Enter" && handleAddTag()}
                      />
                      <Button onClick={handleAddTag} size="sm">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {formData.tags.map(tag => (
                        <Badge key={tag} variant="secondary" className="cursor-pointer" onClick={() => handleRemoveTag(tag)}>
                          {tag} ×
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Preview */}
                  {formData.url && (
                    <div>
                      <Label>Preview</Label>
                      <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
                        <img
                          src={formData.url}
                          alt={formData.altText || formData.name}
                          className="max-w-full max-h-48 object-contain mx-auto"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsUploadDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleSubmit}
                    disabled={createImageMutation.isPending || updateImageMutation.isPending}
                  >
                    {editingImage ? "Update" : "Add"} Image
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="upload">
                <div className="text-center py-8 text-gray-500">
                  File upload feature coming soon. Please use the URL option for now.
                </div>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filters */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search images..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          {allTags.map(tag => (
            <Badge
              key={tag}
              variant={selectedTags.includes(tag) ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => {
                setSelectedTags(prev =>
                  prev.includes(tag)
                    ? prev.filter(t => t !== tag)
                    : [...prev, tag]
                );
              }}
            >
              {tag}
            </Badge>
          ))}
        </div>
      </div>

      {/* Images Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <div className="aspect-video bg-gray-200 animate-pulse" />
              <CardContent className="p-4">
                <div className="h-4 bg-gray-200 animate-pulse rounded mb-2" />
                <div className="h-3 bg-gray-200 animate-pulse rounded w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {imagesData?.images?.map((image: Image) => (
            <Card key={image.id} className="overflow-hidden group">
              <div className="aspect-video relative overflow-hidden bg-gray-100 dark:bg-gray-800">
                <img
                  src={image.url}
                  alt={image.altText || image.name}
                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  onError={(e) => {
                    e.currentTarget.src = "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='300'><rect width='400' height='300' fill='%23f3f4f6'/><text x='200' y='150' text-anchor='middle' fill='%236b7280'>Failed to load</text></svg>";
                  }}
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                    <Button size="sm" variant="secondary" onClick={() => handleCopyUrl(image.url)}>
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => window.open(image.url, "_blank")}>
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => handleEditImage(image)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="destructive" 
                      onClick={() => deleteImageMutation.mutate(image.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
              <CardContent className="p-4">
                <h3 className="font-semibold text-sm mb-1 truncate">{image.name}</h3>
                {image.description && (
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                    {image.description}
                  </p>
                )}
                <div className="flex flex-wrap gap-1 mb-2">
                  {image.tags?.slice(0, 3).map(tag => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                  {image.tags && image.tags.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{image.tags.length - 3}
                    </Badge>
                  )}
                </div>
              </CardContent>
              {showSelectButton && onImageSelect && (
                <CardFooter className="p-4 pt-0">
                  <Button 
                    onClick={() => onImageSelect(image)} 
                    className="w-full" 
                    size="sm"
                  >
                    Select Image
                  </Button>
                </CardFooter>
              )}
            </Card>
          ))}
        </div>
      )}

      {!isLoading && (!imagesData?.images || imagesData.images.length === 0) && (
        <div className="text-center py-12">
          <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No images found</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {searchTerm || selectedTags.length > 0 
              ? "Try adjusting your search terms or filters" 
              : "Start building your image library by adding your first image"}
          </p>
          <Button onClick={() => setIsUploadDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add First Image
          </Button>
        </div>
      )}
    </div>
  );
}