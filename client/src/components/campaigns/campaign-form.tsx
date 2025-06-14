import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { apiRequest } from "@/lib/queryClient";
import { Calendar, Clock } from "lucide-react";

const campaignSchema = z.object({
  name: z.string().min(1, "Campaign name is required"),
  subject: z.string().min(1, "Subject line is required"),
  fromName: z.string().min(1, "From name is required"),
  fromEmail: z.string().email("Valid email is required"),
  contactList: z.string().min(1, "Contact list is required"),
  schedule: z.enum(["now", "later"]),
  scheduledDate: z.string().optional(),
  scheduledTime: z.string().optional(),
});

type CampaignFormData = z.infer<typeof campaignSchema>;

interface CampaignFormProps {
  onSaveDraft?: (data: CampaignFormData) => void;
  onSendCampaign?: (data: CampaignFormData) => void;
  defaultValues?: Partial<CampaignFormData>;
}

export default function CampaignForm({ onSaveDraft, onSendCampaign, defaultValues }: CampaignFormProps) {
  const [isScheduleExpanded, setIsScheduleExpanded] = useState(false);

  // Fetch available contact lists
  const { data: listsData } = useQuery({
    queryKey: ["/api/lists"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/lists");
      return await response.json();
    }
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    getValues,
  } = useForm<CampaignFormData>({
    resolver: zodResolver(campaignSchema),
    defaultValues: {
      name: "",
      subject: "",
      fromName: "ReMailer Team",
      fromEmail: "team@remailer.app",
      contactList: "",
      schedule: "now",
      scheduledDate: "",
      scheduledTime: "",
      ...defaultValues,
    },
  });

  const schedule = watch("schedule");
  
  const onSubmit = (data: CampaignFormData) => {
    if (onSendCampaign) {
      onSendCampaign(data);
    }
  };

  const handleSaveDraft = () => {
    const data = getValues();
    if (onSaveDraft) {
      onSaveDraft(data);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <h3 className="text-lg font-semibold text-slate-900 mb-4">Campaign Settings</h3>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <Label htmlFor="name">Campaign Name</Label>
          <Input
            id="name"
            {...register("name")}
            placeholder="Summer Product Launch"
            className="mt-1"
          />
          {errors.name && (
            <p className="text-sm text-error mt-1">{errors.name.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="subject">Subject Line</Label>
          <Input
            id="subject"
            {...register("subject")}
            placeholder="🚀 New features are here!"
            className="mt-1"
          />
          {errors.subject && (
            <p className="text-sm text-error mt-1">{errors.subject.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="fromName">From Name</Label>
          <Input
            id="fromName"
            {...register("fromName")}
            placeholder="ReMailer Team"
            className="mt-1"
          />
          {errors.fromName && (
            <p className="text-sm text-error mt-1">{errors.fromName.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="fromEmail">From Email</Label>
          <Input
            id="fromEmail"
            type="email"
            {...register("fromEmail")}
            placeholder="team@remailer.app"
            className="mt-1"
          />
          {errors.fromEmail && (
            <p className="text-sm text-error mt-1">{errors.fromEmail.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="contactList">Contact List</Label>
          <Select onValueChange={(value) => setValue("contactList", value)}>
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Select a contact list" />
            </SelectTrigger>
            <SelectContent>
              {listsData?.lists && listsData.lists.length > 0 ? (
                listsData.lists.map((list: any) => (
                  <SelectItem key={list.id} value={list.id.toString()}>
                    {list.name} ({list.matchCount || 0} contacts)
                  </SelectItem>
                ))
              ) : (
                <SelectItem value="no-lists" disabled>
                  No contact lists available
                </SelectItem>
              )}
            </SelectContent>
          </Select>
          {errors.contactList && (
            <p className="text-sm text-error mt-1">{errors.contactList.message}</p>
          )}
        </div>

        <div>
          <Label>Schedule</Label>
          <RadioGroup
            defaultValue="now"
            onValueChange={(value) => {
              setValue("schedule", value as "now" | "later");
              setIsScheduleExpanded(value === "later");
            }}
            className="mt-2"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="now" id="now" />
              <Label htmlFor="now" className="text-sm">Send immediately</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="later" id="later" />
              <Label htmlFor="later" className="text-sm">Schedule for later</Label>
            </div>
          </RadioGroup>

          {(schedule === "later" || isScheduleExpanded) && (
            <div className="mt-3 space-y-3 p-3 bg-slate-50 rounded-lg border">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="scheduledDate" className="text-sm">Date</Label>
                  <div className="relative">
                    <Input
                      id="scheduledDate"
                      type="date"
                      {...register("scheduledDate")}
                      className="mt-1"
                      min={new Date().toISOString().split('T')[0]}
                    />
                    <Calendar className="absolute right-3 top-3 h-4 w-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <Label htmlFor="scheduledTime" className="text-sm">Time</Label>
                  <div className="relative">
                    <Input
                      id="scheduledTime"
                      type="time"
                      {...register("scheduledTime")}
                      className="mt-1"
                    />
                    <Clock className="absolute right-3 top-3 h-4 w-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="pt-4 space-y-2">
          <Button 
            type="button" 
            variant="outline" 
            onClick={handleSaveDraft}
            className="w-full"
          >
            Save Draft
          </Button>
          <Button 
            type="submit" 
            className="w-full"
          >
            Send Campaign
          </Button>
        </div>
      </form>
    </div>
  );
}
