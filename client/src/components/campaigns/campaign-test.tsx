import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { ChevronLeft, ChevronRight, Play, BarChart3, User, Mail } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { Contact, Campaign, List } from "@shared/schema";

interface CampaignTestProps {
  campaign: Campaign;
  onClose: () => void;
}

interface VariableStats {
  variable: string;
  totalContacts: number;
  withData: number;
  withoutData: number;
  percentage: number;
}

export default function CampaignTest({ campaign, onClose }: CampaignTestProps) {
  const [currentContactIndex, setCurrentContactIndex] = useState(0);
  const [previewContent, setPreviewContent] = useState("");

  // Fetch the list and its contacts
  const { data: listData } = useQuery({
    queryKey: ['/api/lists', campaign.listId, 'preview'],
    enabled: !!campaign.listId,
  });

  // Extract variables from campaign content
  const extractVariables = (content: string): string[] => {
    const regex = /\{\{([^}]+)\}\}/g;
    const variables = [];
    let match;
    while ((match = regex.exec(content)) !== null) {
      if (!variables.includes(match[1])) {
        variables.push(match[1]);
      }
    }
    return variables;
  };

  const variables = extractVariables(campaign.content || "");
  const contacts = listData?.contacts || [];
  const currentContact = contacts[currentContactIndex];

  // Calculate variable statistics
  const calculateVariableStats = (): VariableStats[] => {
    return variables.map(variable => {
      const withData = contacts.filter(contact => {
        const value = getVariableValue(contact, variable);
        return value && value.trim() !== "";
      }).length;
      
      return {
        variable,
        totalContacts: contacts.length,
        withData,
        withoutData: contacts.length - withData,
        percentage: contacts.length > 0 ? Math.round((withData / contacts.length) * 100) : 0
      };
    });
  };

  // Get variable value from contact
  const getVariableValue = (contact: Contact, variable: string): string => {
    switch (variable.toLowerCase()) {
      case 'name':
        return contact.name || `${contact.firstName || ''} ${contact.lastName || ''}`.trim();
      case 'first_name':
        return contact.firstName || contact.name?.split(' ')[0] || '';
      case 'last_name':
        return contact.lastName || contact.name?.split(' ').slice(1).join(' ') || '';
      case 'email':
        return contact.email || '';
      case 'company':
        return contact.company || '';
      case 'job_title':
      case 'jobtitle':
        return contact.jobTitle || '';
      case 'phone':
        return contact.phone || '';
      case 'unsubscribe_url':
        return `https://app.remariler.com/unsubscribe/${contact.id}`;
      case 'preferences_url':
        return `https://app.remariler.com/preferences/${contact.id}`;
      case 'campaign_name':
        return campaign.name || 'Untitled Campaign';
      default:
        return `{{${variable}}}`;
    }
  };

  // Replace variables in content with contact data
  const replaceVariables = (content: string, contact: Contact): string => {
    let processedContent = content;
    variables.forEach(variable => {
      const value = getVariableValue(contact, variable);
      const regex = new RegExp(`\\{\\{${variable}\\}\\}`, 'gi');
      processedContent = processedContent.replace(regex, value);
    });
    return processedContent;
  };

  // Update preview when contact changes
  useEffect(() => {
    if (currentContact && campaign.content) {
      setPreviewContent(replaceVariables(campaign.content, currentContact));
    }
  }, [currentContact, campaign.content, variables]);

  const variableStats = calculateVariableStats();

  const nextContact = () => {
    if (currentContactIndex < contacts.length - 1) {
      setCurrentContactIndex(currentContactIndex + 1);
    }
  };

  const prevContact = () => {
    if (currentContactIndex > 0) {
      setCurrentContactIndex(currentContactIndex - 1);
    }
  };

  if (!campaign.listId) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Test Campaign</h2>
          <Button onClick={onClose} variant="outline">Close</Button>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Mail className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600">No contact list selected for this campaign.</p>
              <p className="text-sm text-gray-500 mt-2">Please select a contact list to test the campaign.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!contacts.length) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Test Campaign</h2>
          <Button onClick={onClose} variant="outline">Close</Button>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <User className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600">No contacts found in the selected list.</p>
              <p className="text-sm text-gray-500 mt-2">Add contacts to the list to test the campaign.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Test Campaign</h2>
          <p className="text-gray-600">Preview how your email will look with real contact data</p>
        </div>
        <Button onClick={onClose} variant="outline">Close</Button>
      </div>

      {/* Variable Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="w-5 h-5 mr-2" />
            Variable Data Completeness
          </CardTitle>
          <CardDescription>
            Shows how many contacts have data for each variable used in your campaign
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {variables.length === 0 ? (
            <p className="text-gray-500">No variables found in campaign content.</p>
          ) : (
            variableStats.map((stat) => (
              <div key={stat.variable} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                      {`{{${stat.variable}}}`}
                    </code>
                    <Badge variant={stat.percentage >= 80 ? "default" : stat.percentage >= 50 ? "secondary" : "destructive"}>
                      {stat.percentage}%
                    </Badge>
                  </div>
                  <div className="text-sm text-gray-600">
                    {stat.withData} / {stat.totalContacts} contacts
                  </div>
                </div>
                <Progress value={stat.percentage} className="h-2" />
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Contact Navigation */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center">
                <User className="w-5 h-5 mr-2" />
                Contact Preview
              </CardTitle>
              <CardDescription>
                Navigate through contacts to see how personalization looks
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                onClick={prevContact}
                disabled={currentContactIndex === 0}
                variant="outline"
                size="sm"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm text-gray-600">
                {currentContactIndex + 1} / {contacts.length}
              </span>
              <Button
                onClick={nextContact}
                disabled={currentContactIndex === contacts.length - 1}
                variant="outline"
                size="sm"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Current Contact Info */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">Current Contact:</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Name:</span> {currentContact.name || "Not provided"}
              </div>
              <div>
                <span className="text-gray-600">Email:</span> {currentContact.email}
              </div>
              <div>
                <span className="text-gray-600">Company:</span> {currentContact.company || "Not provided"}
              </div>
              <div>
                <span className="text-gray-600">Job Title:</span> {currentContact.jobTitle || "Not provided"}
              </div>
            </div>
          </div>

          <Separator />

          {/* Email Preview */}
          <div>
            <h4 className="font-medium mb-2">Email Preview:</h4>
            <div className="bg-white border rounded-lg p-6 shadow-sm">
              <div className="mb-4 pb-4 border-b">
                <div className="text-sm text-gray-600">
                  <strong>To:</strong> {currentContact.email}
                </div>
                <div className="text-sm text-gray-600">
                  <strong>Subject:</strong> {campaign.subject ? replaceVariables(campaign.subject, currentContact) : "No subject"}
                </div>
              </div>
              <div 
                className="prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ 
                  __html: previewContent || "No content to preview" 
                }}
              />
            </div>
          </div>

          {/* Variable Values for Current Contact */}
          {variables.length > 0 && (
            <div>
              <h4 className="font-medium mb-2">Variable Values for This Contact:</h4>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  {variables.map((variable) => {
                    const value = getVariableValue(currentContact, variable);
                    const hasValue = value && value.trim() !== "" && !value.startsWith("{{");
                    return (
                      <div key={variable} className="flex items-center justify-between">
                        <code className="bg-white px-2 py-1 rounded text-xs">
                          {`{{${variable}}}`}
                        </code>
                        <span className={hasValue ? "text-gray-900" : "text-red-500"}>
                          {hasValue ? value : "No data"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}