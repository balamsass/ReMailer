import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Plus, Image, Link, Code } from "lucide-react";

interface EmailEditorProps {
  activeTab: "visual" | "html" | "preview";
  onTabChange: (tab: "visual" | "html" | "preview") => void;
}

export default function EmailEditor({ activeTab, onTabChange }: EmailEditorProps) {
  const [htmlContent, setHtmlContent] = useState(`<!DOCTYPE html>
<html>
<head>
    <title>Your Email</title>
</head>
<body>
    <h1>Hello {{name}},</h1>
    <p>Welcome to our newsletter!</p>
</body>
</html>`);

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
          <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center bg-slate-50">
            <div className="text-slate-400 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-2">WYSIWYG Editor</h3>
            <p className="text-slate-600 mb-4">Drag and drop components to build your email</p>
            <div className="flex justify-center space-x-4">
              <Button className="bg-primary text-white">
                <Plus className="w-4 h-4 mr-2" />
                Add Text Block
              </Button>
              <Button variant="outline">
                <Image className="w-4 h-4 mr-2" />
                Add Image
              </Button>
              <Button variant="outline">
                <Link className="w-4 h-4 mr-2" />
                Add Button
              </Button>
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
