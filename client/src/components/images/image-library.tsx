import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Image } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Search, Plus, Edit2, Trash2, Tag } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImageLibraryProps {
  onImageSelect?: (image: Image) => void;
  showSelectButton?: boolean;
  className?: string;
}

interface ImageFormData {
  name: string;
  url: string;
  altText: string;
  description: string;
  tags: string[];
}

export default function ImageLibrary({ onImageSelect, showSelectButton = false, className }: ImageLibraryProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [editingImage, setEditingImage] = useState<Image | null>(null);
  const [newTag, setNewTag] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadMode, setUploadMode] = useState<'url' | 'file'>('url');
  const [formData, setFormData] = useState<ImageFormData>({
    name: "",
    url: "",
    altText: "",
    description: "",
    tags: [],
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: imagesData, isLoading } = useQuery<{images: Image[], total: number}>({
    queryKey: ["/api/images", { search: searchTerm, tags: selectedTags.join(",") }],
  });

  const createImageMutation = useMutation({
    mutationFn: async (data: ImageFormData | FormData) => {
      if (data instanceof FormData) {
        return await fetch("/api/images/upload", {
          method: "POST",
          body: data,
          credentials: 'same-origin',
        }).then(async res => {
          if (!res.ok) {
            const errorText = await res.text();
            throw new Error(errorText || 'Upload failed');
          }
          return res.json();
        });
      } else {
        return await apiRequest("/api/images", "POST", data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/images"] });
      setIsUploadDialogOpen(false);
      setSelectedFile(null);
      setUploadMode('url');
      resetForm();
      toast({
        title: "Success",
        description: "Image added successfully",
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
      setIsUploadDialogOpen(false);
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

  const deactivateImageMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest(`/api/images/${id}/deactivate`, "PATCH");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/images"] });
      toast({
        title: "Success",
        description: "Image marked as inactive",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to deactivate image",
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
      tags: [],
    });
    setNewTag("");
    setEditingImage(null);
    setSelectedFile(null);
    setUploadMode('url');
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      // Auto-fill name from filename if empty
      if (!formData.name) {
        setFormData(prev => ({
          ...prev,
          name: file.name.split('.')[0]
        }));
      }
    }
  };

  const handleSubmit = () => {
    if (uploadMode === 'file') {
      if (!selectedFile || !formData.name) {
        toast({
          title: "Error",
          description: "File and name are required",
          variant: "destructive",
        });
        return;
      }

      const formDataToUpload = new FormData();
      formDataToUpload.append('file', selectedFile);
      formDataToUpload.append('name', formData.name);
      formDataToUpload.append('altText', formData.altText);
      formDataToUpload.append('description', formData.description);
      formDataToUpload.append('tags', JSON.stringify(formData.tags));

      createImageMutation.mutate(formDataToUpload);
    } else {
      if (!formData.name || !formData.url) {
        toast({
          title: "Error",
          description: "Name and URL are required",
          variant: "destructive",
        });
        return;
      }

      if (editingImage) {
        updateImageMutation.mutate({
          id: editingImage.id,
          ...formData,
        });
      } else {
        createImageMutation.mutate(formData);
      }
    }
  };

  const handleEditImage = (image: Image) => {
    setEditingImage(image);
    setFormData({
      name: image.name || image.originalName,
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
    image.tags?.forEach((tag: string) => {
      if (!tags.includes(tag)) tags.push(tag);
    });
    return tags;
  }, []) || [];

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold">Image Library</h2>
        <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <Plus className="h-4 w-4 mr-2" />
              Add Image
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingImage ? "Edit Image" : "Add New Image"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {!editingImage && (
                <div>
                  <Label>Upload Method</Label>
                  <div className="flex gap-2 mt-2">
                    <Button
                      type="button"
                      variant={uploadMode === 'url' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setUploadMode('url')}
                    >
                      From URL
                    </Button>
                    <Button
                      type="button"
                      variant={uploadMode === 'file' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setUploadMode('file')}
                    >
                      Upload File
                    </Button>
                  </div>
                </div>
              )}
              
              <div>
                <Label htmlFor="image-name">Name *</Label>
                <Input
                  id="image-name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter image name"
                />
              </div>
              
              {uploadMode === 'file' && !editingImage ? (
                <div>
                  <Label htmlFor="image-file">Image File *</Label>
                  <Input
                    id="image-file"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="cursor-pointer"
                  />
                  {selectedFile && (
                    <p className="text-sm text-gray-600 mt-1">
                      Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                    </p>
                  )}
                </div>
              ) : (
                <div>
                  <Label htmlFor="image-url">URL *</Label>
                  <Input
                    id="image-url"
                    value={formData.url}
                    onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                    placeholder="Enter image URL"
                  />
                </div>
              )}
              <div>
                <Label htmlFor="image-alt">Alt Text</Label>
                <Input
                  id="image-alt"
                  value={formData.altText}
                  onChange={(e) => setFormData(prev => ({ ...prev, altText: e.target.value }))}
                  placeholder="Enter alt text"
                />
              </div>
              <div>
                <Label htmlFor="image-description">Description</Label>
                <Textarea
                  id="image-description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter description"
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
                  <Button type="button" onClick={handleAddTag} size="sm">
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-1">
                  {formData.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="cursor-pointer" onClick={() => handleRemoveTag(tag)}>
                      {tag} ×
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={handleSubmit} 
                  disabled={createImageMutation.isPending || updateImageMutation.isPending}
                  className="flex-1"
                >
                  {editingImage ? "Update" : "Add"} Image
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsUploadDialogOpen(false);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search images..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        {allTags.length > 0 && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">Filter by tags:</Label>
            <div className="flex flex-wrap gap-2">
              {allTags.map((tag) => (
                <Badge
                  key={tag}
                  variant={selectedTags.includes(tag) ? "default" : "secondary"}
                  className="cursor-pointer"
                  onClick={() => {
                    setSelectedTags(prev =>
                      prev.includes(tag)
                        ? prev.filter(t => t !== tag)
                        : [...prev, tag]
                    );
                  }}
                >
                  <Tag className="h-3 w-3 mr-1" />
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Images Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-0">
                <div className="h-48 bg-gray-200 rounded-t-lg"></div>
                <div className="p-3 space-y-2">
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {imagesData?.images?.map((image: Image) => (
            <Card key={image.id} className="group hover:shadow-md transition-shadow">
              <CardContent className="p-0">
                <div className="relative">
                  <img
                    src={image.url}
                    alt={image.altText || image.name || "Image"}
                    className="w-full h-48 object-cover rounded-t-lg"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%23f3f4f6'/%3E%3Ctext x='200' y='150' text-anchor='middle' fill='%239ca3af' font-family='Arial' font-size='14'%3EImage not found%3C/text%3E%3C/svg%3E";
                    }}
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 rounded-t-lg flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 space-x-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleCopyUrl(image.url)}
                      >
                        Copy URL
                      </Button>
                      {showSelectButton && onImageSelect && (
                        <Button
                          size="sm"
                          onClick={() => onImageSelect(image)}
                        >
                          Select
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
                <div className="p-3">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium text-sm truncate">
                      {image.name || image.originalName}
                    </h3>
                    <div className="flex gap-1 ml-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0"
                        onClick={() => handleEditImage(image)}
                      >
                        <Edit2 className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0 text-orange-500 hover:text-orange-700"
                        onClick={() => deactivateImageMutation.mutate(image.id)}
                        title="Mark as inactive (keeps image for existing campaigns)"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  {image.description && (
                    <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                      {image.description}
                    </p>
                  )}
                  {image.tags && image.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {image.tags.slice(0, 3).map((tag: string) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {image.tags.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{image.tags.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )) || []}
        </div>
      )}

      {!isLoading && (!imagesData?.images || imagesData.images.length === 0) && (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">No images found</p>
          <Button onClick={() => setIsUploadDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Your First Image
          </Button>
        </div>
      )}
    </div>
  );
}