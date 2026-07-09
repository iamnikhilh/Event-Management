import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import type { EventItem } from "@/lib/types";
import { Loader2 } from "lucide-react";
import { Panel, PanelHeader } from "@/components/ui-blocks";
import { ImageUpload } from "@/components/image-upload";
import { api, type Envelope } from "@/lib/api-client";

export const eventFormSchema = z.object({
  title: z.string().min(2, "Title is too short").max(200),
  slug: z
    .string()
    .min(2)
    .max(120)
    .regex(/^[a-z0-9-]+$/, "Lowercase letters, numbers, and hyphens only"),
  description: z.string().max(5000).optional(),
  venue: z.string().max(200).optional(),
  eventDate: z.string().min(1, "Pick a date & time"),
  capacity: z.coerce.number().int().nonnegative().optional(),
  isPublic: z.boolean(),
  status: z.enum(["draft", "upcoming", "active", "completed", "cancelled"]),
  categoryId: z.string().min(1, "Category is required"),
  bannerImage: z.string().optional(),
});

export type EventFormValues = z.infer<typeof eventFormSchema>;

function toLocalInput(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  const off = d.getTimezoneOffset();
  const local = new Date(d.getTime() - off * 60000);
  return local.toISOString().slice(0, 16);
}

export function EventForm({
  initial,
  submitting,
  onSubmit,
  submitLabel = "Save",
}: {
  initial?: Partial<EventItem>;
  submitting?: boolean;
  submitLabel?: string;
  onSubmit: (values: EventFormValues) => void;
}) {
  // Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await api<Envelope<{ id: string; name: string }[]>>("/categories");
      return res.data;
    },
  });

  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      title: initial?.title ?? "",
      slug: initial?.slug ?? "",
      description: initial?.description ?? "",
      venue: initial?.venue ?? "",
      eventDate: toLocalInput(initial?.eventDate),
      capacity: initial?.capacity ?? undefined,
      isPublic: initial?.isPublic ?? true,
      status: (initial?.status as EventFormValues["status"]) ?? "draft",
      categoryId: initial?.categoryId ?? "",
      bannerImage: initial?.bannerImage ?? "",
    },
  });

  const submit = form.handleSubmit((values) => {
    onSubmit({
      ...values,
      eventDate: new Date(values.eventDate).toISOString(),
    });
  });

  return (
    <form onSubmit={submit} className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <Panel>
            <PanelHeader
              title="Basic info"
              description="Title, slug, and schedule"
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="title">Title</Label>
                <Input id="title" className="rounded-xl" {...form.register("title")} />
                {form.formState.errors.title && (
                  <p className="text-xs text-destructive">{form.formState.errors.title.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">URL slug</Label>
                <Input id="slug" className="rounded-xl" placeholder="tech-conf-2026" {...form.register("slug")} />
                {form.formState.errors.slug && (
                  <p className="text-xs text-destructive">{form.formState.errors.slug.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="eventDate">Date & time</Label>
                <Input id="eventDate" className="rounded-xl" type="datetime-local" {...form.register("eventDate")} />
                {form.formState.errors.eventDate && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.eventDate.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="venue">Venue</Label>
                <Input id="venue" className="rounded-xl" {...form.register("venue")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="capacity">Capacity</Label>
                <Input id="capacity" className="rounded-xl" type="number" min={0} {...form.register("capacity")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="categoryId">Category</Label>
                <Select
                  value={form.watch("categoryId")}
                  onValueChange={(v) => form.setValue("categoryId", v)}
                >
                  <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select a category" /></SelectTrigger>
                  <SelectContent>
                    {categories.map((cat: { id: string; name: string }) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.categoryId && (
                  <p className="text-xs text-destructive">{form.formState.errors.categoryId.message}</p>
                )}
              </div>
            </div>
          </Panel>

          <Panel>
            <PanelHeader title="Description" description="Tell attendees what to expect" />
            <div className="space-y-2">
              <Label htmlFor="description" className="sr-only">Description</Label>
              <Textarea id="description" className="min-h-[180px] rounded-xl" rows={6} {...form.register("description")} />
            </div>
          </Panel>
        </div>

        <div className="space-y-6">
          <Panel>
            <PanelHeader title="Cover image" description="Shown on event cards and the public event page" />
            <ImageUpload
              label="Banner image"
              value={form.watch("bannerImage")}
              onChange={(url) => form.setValue("bannerImage", url, { shouldDirty: true })}
              hint="Upload a wide image (16:9 works best)."
            />
          </Panel>

          <Panel>
            <PanelHeader title="Publishing" description="Status and visibility settings" />
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={form.watch("status")}
                  onValueChange={(v) => form.setValue("status", v as EventFormValues["status"])}
                >
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="upcoming">Upcoming</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between rounded-xl border bg-muted/30 p-4">
                <div>
                  <Label htmlFor="isPublic">Public event</Label>
                  <p className="text-xs text-muted-foreground">
                    Visible on the public site & registration page.
                  </p>
                </div>
                <Switch
                  id="isPublic"
                  checked={form.watch("isPublic")}
                  onCheckedChange={(v) => form.setValue("isPublic", v)}
                />
              </div>
            </div>
          </Panel>
        </div>
      </div>

      <div className="flex justify-end border-t pt-6">
        <Button type="submit" className="rounded-full px-8" disabled={submitting}>
          {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
