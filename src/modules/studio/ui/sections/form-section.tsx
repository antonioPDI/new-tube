"use client";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { videoUpdateSchema } from "@/db/schema";
import { VideoPlayer } from "@/modules/videos/ui/components/video-player";
import { trpc } from "@/trpc/client";
import { zodResolver } from "@hookform/resolvers/zod";
import { MoreVerticalIcon, TrashIcon } from "lucide-react";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";

interface FormSectionProps {
  videoId: string;
}

export const FormSection = ({ videoId }: FormSectionProps) => {
  return (
    <Suspense fallback={<FormSectionSkeleton />}>
      <ErrorBoundary fallback={<div>Error loading video data</div>}>
        <FormSectionSuspense videoId={videoId} />
      </ErrorBoundary>
    </Suspense>
  );
};

const FormSectionSkeleton = () => {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-8 w-1/3 rounded bg-muted" />
      <div className="h-6 w-1/2 rounded bg-muted" />
      <div className="h-6 w-full rounded bg-muted" />
      <div className="h-6 w-full rounded bg-muted" />
      <div className="h-6 w-3/4 rounded bg-muted" />
    </div>
  );
};

export const FormSectionSuspense = ({ videoId }: FormSectionProps) => {
  const utils = trpc.useUtils();
  const [video] = trpc.studio.getOne.useSuspenseQuery({ id: videoId });
  const [categories] = trpc.categories.getMany.useSuspenseQuery();

  const update = trpc.videos.update.useMutation({
    onSuccess: () => {
      utils.studio.getMany.invalidate();
      utils.studio.getOne.invalidate({ id: videoId });
      toast.success("Video updated successfully");
    },
    onError: () => {
      toast.error("something went wrong");
    },
  });

  const form = useForm<z.infer<typeof videoUpdateSchema>>({
    resolver: zodResolver(videoUpdateSchema),
    defaultValues: video,
  });
  const onSubmit = (data: z.infer<typeof videoUpdateSchema>) => {
    update.mutate(data);
  };

  return (
    <Form {...form}>
      {/* //8:40 h del video*/}
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Video details</h1>
            <p className="text-xs text-muted-foreground">Manage your video details</p>
          </div>

          <div className="flex items-center gap-x-2">
            <Button type="submit" disabled={update.isPending}>
              Save
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant={"ghost"} size={"icon"}>
                  <MoreVerticalIcon />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <TrashIcon className="size-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
          <div className="space-y-8 lg:col-span-3">
            {/* Title */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Add a title to your video" />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  {/* TODO: add AI generate button */}
                  <FormControl>
                    <Textarea
                      {...field}
                      value={field.value ?? ""}
                      rows={10}
                      className="resize-none pr-10"
                      placeholder="Add a description to your video"
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* TODO: add thumbnail field here */}

            {/* we can separate this category field in its own component with his own 
            loading state skeleton and so on, of course, also the trpc prefetch */}
            {/* Category */}
            <FormField
              control={form.control}
              name="categoryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value ?? undefined}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>

                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                    {/* <SelectContent>
                      <SelectItem value="music">Music</SelectItem>
                      <SelectItem value="gaming">Gaming</SelectItem>
                      <SelectItem value="vlogs">Vlogs</SelectItem>
                    </SelectContent> */}
                  </Select>
                </FormItem>
              )}
            />
          </div>

          <div className="flex flex-col gap-y-8 lg:col-span-2">
            <div className="flex flex-col gap-4 bg-[#f9f9f9] rounded-xl overflow-hidden h-fit">
              <div className="aspect-video overflow-hidden relative ">
                <VideoPlayer
                  playbackId={video.muxPlaybackId!}
                  thumbnailUrl={video.thumbnailUrl!}
                />
              </div>

              <div className="p-4 flex flex-col gap-y-6">
                <div className="flex justify-between items-center gap-x-2">
                  <div className="flex flex-col gap-y-1">
                    <p className="text-muted-foreground text-xs">Video Link</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </Form>
  );
};
