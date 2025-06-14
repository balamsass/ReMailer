import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const campaignSchema = z.object({
  name: z.string().min(1, "Campaign name is required"),
  subject: z.string().min(1, "Subject line is required"),
  fromName: z.string().min(1, "From name is required"),
  fromEmail: z.string().email("Valid email is required"),
  contactList: z.string().min(1, "Contact list is required"),
  schedule: z.enum(["now", "later"]),
});

type CampaignFormData = z.infer<typeof campaignSchema>;

export default function CampaignForm() {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<CampaignFormData>({
    resolver: zodResolver(campaignSchema),
    defaultValues: {
      name: "",
      subject: "",
      fromName: "ReMailer Team",
      fromEmail: "team@remailer.app",
      contactList: "",
      schedule: "now",
    },
  });

  const onSubmit = (data: CampaignFormData) => {
    console.log("Campaign data:", data);
    // Handle form submission here
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
              <SelectItem value="all">All Subscribers (0)</SelectItem>
              <SelectItem value="newsletter">Newsletter Subscribers (0)</SelectItem>
              <SelectItem value="product">Product Users (0)</SelectItem>
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
            onValueChange={(value) => setValue("schedule", value as "now" | "later")}
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
        </div>
      </form>
    </div>
  );
}
