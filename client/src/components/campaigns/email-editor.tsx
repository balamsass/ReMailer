import { useState, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, Image, Link, Code, Type, Square, Trash2, User, Hash } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ImageLibrary from "@/components/images/image-library";
import type { Image as ImageType } from "@shared/schema";

interface EmailEditorProps {
  activeTab: "visual" | "html" | "preview";
  onTabChange: (tab: "visual" | "html" | "preview") => void;
  onContentChange?: (content: string) => void;
}

interface EmailComponent {
  id: string;
  type: "text" | "image" | "button" | "spacer";
  content: any;
}

interface TextComponent {
  text: string;
  fontSize: string;
  textAlign: "left" | "center" | "right";
  fontWeight: "normal" | "bold";
}

interface ImageComponent {
  src: string;
  alt: string;
  width: string;
  alignment: "left" | "center" | "right";
}

interface ButtonComponent {
  text: string;
  url: string;
  backgroundColor: string;
  textColor: string;
  alignment: "left" | "center" | "right";
}

export default function EmailEditor({ activeTab, onTabChange, onContentChange }: EmailEditorProps) {
  const [components, setComponents] = useState<EmailComponent[]>([
    {
      id: '1',
      type: 'text',
      content: {
        text: 'Welcome to ReMailer!',
        fontSize: '24px',
        textAlign: 'center' as const,
        fontWeight: 'bold' as const
      }
    },
    {
      id: '2',
      type: 'text',
      content: {
        text: 'Hello {{name}},\n\nThank you for subscribing to our newsletter! We\'re excited to share our latest updates with you.',
        fontSize: '16px',
        textAlign: 'left' as const,
        fontWeight: 'normal' as const
      }
    }
  ]);

  const [htmlContent, setHtmlContent] = useState('');
  const [selectedComponent, setSelectedComponent] = useState<string | null>(null);

  // Generate HTML from components
  const generateHTML = () => {
    const componentHTML = components.map(comp => {
      switch (comp.type) {
        case 'text':
          const textContent = comp.content as TextComponent;
          return `<div style="font-size: ${textContent.fontSize}; text-align: ${textContent.textAlign}; font-weight: ${textContent.fontWeight}; margin: 16px 0; white-space: pre-line;">${textContent.text}</div>`;
        case 'image':
          const imageContent = comp.content as ImageComponent;
          return `<div style="text-align: ${imageContent.alignment}; margin: 16px 0;"><img src="${imageContent.src}" alt="${imageContent.alt}" style="max-width: ${imageContent.width}; height: auto;" /></div>`;
        case 'button':
          const buttonContent = comp.content as ButtonComponent;
          return `<div style="text-align: ${buttonContent.alignment}; margin: 16px 0;"><a href="${buttonContent.url}" style="background-color: ${buttonContent.backgroundColor}; color: ${buttonContent.textColor}; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">${buttonContent.text}</a></div>`;
        case 'spacer':
          return `<div style="height: 32px;"></div>`;
        default:
          return '';
      }
    }).join('\n');

    return `<!DOCTYPE html>
<html>
<head>
    <title>Your Email</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    </style>
</head>
<body>
    <div class="container">
        ${componentHTML}
        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; font-size: 12px; color: #666;">
            <p>You received this email because you subscribed to our newsletter.</p>
            <p><a href="{{unsubscribe_url}}">Unsubscribe</a> | <a href="{{preferences_url}}">Update Preferences</a></p>
        </div>
    </div>
</body>
</html>`;
  };

  useEffect(() => {
    const html = generateHTML();
    setHtmlContent(html);
    if (onContentChange) {
      onContentChange(html);
    }
  }, [components, onContentChange]);

  const addComponent = (type: EmailComponent['type']) => {
    const id = Math.random().toString(36).substr(2, 9);
    let content;
    
    switch (type) {
      case 'text':
        content = {
          text: 'Your text here...',
          fontSize: '16px',
          textAlign: 'left' as const,
          fontWeight: 'normal' as const
        };
        break;
      case 'image':
        content = {
          src: 'https://via.placeholder.com/400x200',
          alt: 'Image description',
          width: '100%',
          alignment: 'center' as const
        };
        break;
      case 'button':
        content = {
          text: 'Click Here',
          url: 'https://example.com',
          backgroundColor: '#007bff',
          textColor: '#ffffff',
          alignment: 'center' as const
        };
        break;
      case 'spacer':
        content = {};
        break;
      default:
        content = {};
    }

    setComponents([...components, { id, type, content }]);
  };

  const updateComponent = (id: string, newContent: any) => {
    setComponents(components.map(comp => 
      comp.id === id ? { ...comp, content: newContent } : comp
    ));
  };

  const deleteComponent = (id: string) => {
    setComponents(components.filter(comp => comp.id !== id));
    setSelectedComponent(null);
  };

  const moveComponent = (id: string, direction: 'up' | 'down') => {
    const index = components.findIndex(comp => comp.id === id);
    if (index === -1) return;
    
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= components.length) return;
    
    const newComponents = [...components];
    [newComponents[index], newComponents[newIndex]] = [newComponents[newIndex], newComponents[index]];
    setComponents(newComponents);
  };

  const tabs = [
    { id: "visual", label: "Visual Editor" },
    { id: "html", label: "HTML Code" },
    { id: "preview", label: "Preview" },
  ];

  return (
    <div className="bg-white rounded-xl border border-slate-200">
      {/* Tab Navigation */}
      <div className="border-b border-slate-200">
        <nav className="flex space-x-8 px-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id as "visual" | "html" | "preview")}
              className={`editor-tab-button ${activeTab === tab.id ? "active" : ""}`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {/* Visual Editor */}
        {activeTab === "visual" && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Toolbar */}
            <div className="lg:col-span-1 space-y-6">
              {/* Components Section */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Add Components</h3>
                <div className="space-y-2">
                  <Button 
                    onClick={() => addComponent('text')}
                    className="w-full justify-start"
                    variant="outline"
                  >
                    <Type className="w-4 h-4 mr-2" />
                    Text Block
                  </Button>
                  <Button 
                    onClick={() => addComponent('image')}
                    className="w-full justify-start"
                    variant="outline"
                  >
                    <Image className="w-4 h-4 mr-2" />
                    Image
                  </Button>
                  <Button 
                    onClick={() => addComponent('button')}
                    className="w-full justify-start"
                    variant="outline"
                  >
                    <Link className="w-4 h-4 mr-2" />
                    Button
                  </Button>
                  <Button 
                    onClick={() => addComponent('spacer')}
                    className="w-full justify-start"
                    variant="outline"
                  >
                    <Square className="w-4 h-4 mr-2" />
                    Spacer
                  </Button>
                </div>
              </div>

              {/* Variables Section */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Variables</h3>
                <p className="text-sm text-gray-600 mb-3">Click to copy to clipboard</p>
                <div className="space-y-2">
                  <VariableButton variable="{{name}}" description="Contact's name" />
                  <VariableButton variable="{{email}}" description="Contact's email" />
                  <VariableButton variable="{{company}}" description="Contact's company" />
                  <VariableButton variable="{{first_name}}" description="First name only" />
                  <VariableButton variable="{{last_name}}" description="Last name only" />
                  <VariableButton variable="{{unsubscribe_url}}" description="Unsubscribe link" />
                  <VariableButton variable="{{preferences_url}}" description="Preferences link" />
                  <VariableButton variable="{{campaign_name}}" description="Current campaign" />
                </div>
              </div>
            </div>

            {/* Email Canvas */}
            <div className="lg:col-span-2">
              <div className="border rounded-lg bg-white shadow-sm min-h-96">
                <div className="p-4 border-b bg-gray-50 rounded-t-lg">
                  <h3 className="font-semibold">Email Preview</h3>
                </div>
                <div className="p-6">
                  {components.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <Type className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p>No components yet. Add some from the toolbar!</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {components.map((component, index) => (
                        <div
                          key={component.id}
                          className={`group relative border-2 rounded-lg p-3 transition-all ${
                            selectedComponent === component.id 
                              ? 'border-blue-500 bg-blue-50' 
                              : 'border-transparent hover:border-gray-300'
                          }`}
                          onClick={() => setSelectedComponent(component.id)}
                        >
                          {/* Component Controls */}
                          <div className="absolute -top-2 -right-2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {index > 0 && (
                              <Button
                                size="sm"
                                variant="secondary"
                                className="h-6 w-6 p-0"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  moveComponent(component.id, 'up');
                                }}
                              >
                                ↑
                              </Button>
                            )}
                            {index < components.length - 1 && (
                              <Button
                                size="sm"
                                variant="secondary"
                                className="h-6 w-6 p-0"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  moveComponent(component.id, 'down');
                                }}
                              >
                                ↓
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="destructive"
                              className="h-6 w-6 p-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteComponent(component.id);
                              }}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>

                          {/* Component Content */}
                          {component.type === 'text' && (
                            <div
                              style={{
                                fontSize: component.content.fontSize,
                                textAlign: component.content.textAlign,
                                fontWeight: component.content.fontWeight,
                                whiteSpace: 'pre-line'
                              }}
                            >
                              {component.content.text}
                            </div>
                          )}
                          
                          {component.type === 'image' && (
                            <div style={{ textAlign: component.content.alignment }}>
                              <img
                                src={component.content.src}
                                alt={component.content.alt}
                                style={{ maxWidth: component.content.width, height: 'auto' }}
                                className="rounded"
                              />
                            </div>
                          )}
                          
                          {component.type === 'button' && (
                            <div style={{ textAlign: component.content.alignment }}>
                              <a
                                href={component.content.url}
                                style={{
                                  backgroundColor: component.content.backgroundColor,
                                  color: component.content.textColor,
                                  padding: '12px 24px',
                                  textDecoration: 'none',
                                  borderRadius: '4px',
                                  display: 'inline-block'
                                }}
                                onClick={(e) => e.preventDefault()}
                              >
                                {component.content.text}
                              </a>
                            </div>
                          )}
                          
                          {component.type === 'spacer' && (
                            <div className="h-8 bg-gray-100 rounded flex items-center justify-center text-gray-400 text-sm">
                              Spacer
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Properties Panel */}
            <div className="lg:col-span-1">
              <h3 className="text-lg font-semibold mb-4">Properties</h3>
              {selectedComponent ? (
                <ComponentEditor
                  component={components.find(c => c.id === selectedComponent)!}
                  onUpdate={(newContent) => updateComponent(selectedComponent, newContent)}
                />
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>Select a component to edit its properties</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* HTML Editor */}
        {activeTab === "html" && (
          <div className="relative">
            <Textarea
              value={htmlContent}
              onChange={(e) => setHtmlContent(e.target.value)}
              className="w-full h-96 font-mono text-sm leading-relaxed resize-none"
              placeholder="Enter your HTML code here..."
            />
            <div className="absolute top-3 right-3">
              <Button size="sm" variant="secondary">
                <Code className="w-4 h-4 mr-1" />
                Format Code
              </Button>
            </div>
          </div>
        )}

        {/* Preview */}
        {activeTab === "preview" && (
          <div className="bg-slate-100 rounded-lg p-4">
            <div className="bg-white rounded-lg shadow-sm border max-w-md mx-auto">
              <div className="bg-primary text-white px-6 py-4 rounded-t-lg">
                <h2 className="text-lg font-semibold">🚀 New features are here!</h2>
              </div>
              <div className="p-6">
                <p className="text-slate-600 mb-4">Hi there,</p>
                <p className="text-slate-600 mb-4">
                  We're excited to announce some amazing new features that will help you create even better email campaigns.
                </p>
                <div className="text-center mb-4">
                  <Button className="bg-primary text-white">
                    Learn More
                  </Button>
                </div>
                <p className="text-slate-500 text-sm">
                  Thanks,<br />
                  The ReMailer Team
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Component Editor for the properties panel
function ComponentEditor({ component, onUpdate }: { component: EmailComponent; onUpdate: (content: any) => void }) {
  const [isImageDialogOpen, setIsImageDialogOpen] = useState(false);
  const [isButtonDialogOpen, setIsButtonDialogOpen] = useState(false);
  const [isImageLibraryOpen, setIsImageLibraryOpen] = useState(false);

  if (component.type === 'text') {
    const content = component.content as TextComponent;
    return (
      <div className="space-y-4">
        <div>
          <Label>Text Content</Label>
          <Textarea
            value={content.text}
            onChange={(e) => onUpdate({ ...content, text: e.target.value })}
            className="mt-2"
            rows={4}
          />
        </div>
        <div>
          <Label>Font Size</Label>
          <Input
            value={content.fontSize}
            onChange={(e) => onUpdate({ ...content, fontSize: e.target.value })}
            placeholder="16px"
            className="mt-2"
          />
        </div>
        <div>
          <Label>Text Alignment</Label>
          <div className="mt-2 flex space-x-2">
            {['left', 'center', 'right'].map((align) => (
              <Button
                key={align}
                size="sm"
                variant={content.textAlign === align ? 'default' : 'outline'}
                onClick={() => onUpdate({ ...content, textAlign: align })}
              >
                {align}
              </Button>
            ))}
          </div>
        </div>
        <div>
          <Label>Font Weight</Label>
          <div className="mt-2 flex space-x-2">
            {['normal', 'bold'].map((weight) => (
              <Button
                key={weight}
                size="sm"
                variant={content.fontWeight === weight ? 'default' : 'outline'}
                onClick={() => onUpdate({ ...content, fontWeight: weight })}
              >
                {weight}
              </Button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (component.type === 'image') {
    const content = component.content as ImageComponent;
    return (
      <div className="space-y-4">
        <div>
          <Label>Image URL</Label>
          <div className="flex gap-2 mt-2">
            <Input
              value={content.src}
              onChange={(e) => onUpdate({ ...content, src: e.target.value })}
              placeholder="https://example.com/image.jpg"
              className="flex-1"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsImageLibraryOpen(true)}
            >
              Library
            </Button>
          </div>
        </div>
        <div>
          <Label>Alt Text</Label>
          <Input
            value={content.alt}
            onChange={(e) => onUpdate({ ...content, alt: e.target.value })}
            placeholder="Image description"
            className="mt-2"
          />
        </div>
        <div>
          <Label>Width</Label>
          <Input
            value={content.width}
            onChange={(e) => onUpdate({ ...content, width: e.target.value })}
            placeholder="100%"
            className="mt-2"
          />
        </div>
        <div>
          <Label>Alignment</Label>
          <div className="mt-2 flex space-x-2">
            {['left', 'center', 'right'].map((align) => (
              <Button
                key={align}
                size="sm"
                variant={content.alignment === align ? 'default' : 'outline'}
                onClick={() => onUpdate({ ...content, alignment: align })}
              >
                {align}
              </Button>
            ))}
          </div>
        </div>

        {/* Image Library Dialog */}
        <Dialog open={isImageLibraryOpen} onOpenChange={setIsImageLibraryOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
            <DialogHeader>
              <DialogTitle>Image Library</DialogTitle>
            </DialogHeader>
            <div className="overflow-y-auto max-h-[60vh]">
              <ImageLibrary 
                onImageSelect={(image: ImageType) => {
                  onUpdate({ ...content, src: image.url, alt: image.altText || image.name });
                  setIsImageLibraryOpen(false);
                }}
                showSelectButton={true}
                className="border-0"
              />
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  if (component.type === 'button') {
    const content = component.content as ButtonComponent;
    return (
      <div className="space-y-4">
        <div>
          <Label>Button Text</Label>
          <Input
            value={content.text}
            onChange={(e) => onUpdate({ ...content, text: e.target.value })}
            placeholder="Click Here"
            className="mt-2"
          />
        </div>
        <div>
          <Label>URL</Label>
          <Input
            value={content.url}
            onChange={(e) => onUpdate({ ...content, url: e.target.value })}
            placeholder="https://example.com"
            className="mt-2"
          />
        </div>
        <div>
          <Label>Background Color</Label>
          <Input
            type="color"
            value={content.backgroundColor}
            onChange={(e) => onUpdate({ ...content, backgroundColor: e.target.value })}
            className="mt-2 h-10"
          />
        </div>
        <div>
          <Label>Text Color</Label>
          <Input
            type="color"
            value={content.textColor}
            onChange={(e) => onUpdate({ ...content, textColor: e.target.value })}
            className="mt-2 h-10"
          />
        </div>
        <div>
          <Label>Alignment</Label>
          <div className="mt-2 flex space-x-2">
            {['left', 'center', 'right'].map((align) => (
              <Button
                key={align}
                size="sm"
                variant={content.alignment === align ? 'default' : 'outline'}
                onClick={() => onUpdate({ ...content, alignment: align })}
              >
                {align}
              </Button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (component.type === 'spacer') {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>Spacer has no configurable properties</p>
      </div>
    );
  }

  return null;
}

// Variable Button Component
function VariableButton({ variable, description }: { variable: string; description: string }) {
  const { toast } = useToast();
  
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(variable);
      toast({
        title: "Variable copied!",
        description: `${variable} copied to clipboard`,
        duration: 2000,
      });
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
      toast({
        title: "Copy failed",
        description: "Unable to copy to clipboard",
        variant: "destructive",
        duration: 2000,
      });
    }
  };

  return (
    <Button
      onClick={copyToClipboard}
      variant="ghost"
      className="w-full justify-start h-auto p-2 text-left hover:bg-blue-50"
    >
      <div className="flex items-start space-x-2">
        <Hash className="w-4 h-4 mt-0.5 text-blue-600 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-mono text-blue-700 truncate">{variable}</div>
          <div className="text-xs text-gray-500">{description}</div>
        </div>
      </div>
    </Button>
  );
}
