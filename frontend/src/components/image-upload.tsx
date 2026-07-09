import { useRef, useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { uploadsApi } from "@/lib/api";
import { resolveImageUrl } from "@/lib/images";

interface ImageUploadProps {
  label: string;
  value?: string | null;
  onChange: (url: string) => void;
  hint?: string;
  className?: string;
  previewClassName?: string;
  aspect?: "video" | "square" | "auto";
}

export function ImageUpload({
  label,
  value,
  onChange,
  hint,
  className,
  previewClassName,
  aspect = "video",
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const aspectClass =
    aspect === "square" ? "aspect-square" : aspect === "video" ? "aspect-video" : "min-h-28";

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5 MB");
      return;
    }

    setUploading(true);
    try {
      const result = await uploadsApi.upload(file);
      onChange(result.url);
      toast.success("Image uploaded");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const previewSrc = resolveImageUrl(value);

  return (
    <div className={cn("space-y-2", className)}>
      <Label>{label}</Label>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}

      <div
        className={cn(
          "relative overflow-hidden rounded-xl border border-dashed bg-muted/20",
          aspectClass,
          previewClassName,
        )}
      >
        {previewSrc ? (
          <>
            <img src={previewSrc} alt="" className="h-full w-full object-cover" />
            <div className="absolute inset-0 flex items-end justify-between gap-2 bg-gradient-to-t from-black/50 to-transparent p-3 opacity-0 transition-opacity hover:opacity-100">
              <Button
                type="button"
                size="sm"
                variant="secondary"
                className="rounded-full"
                disabled={uploading}
                onClick={() => inputRef.current?.click()}
              >
                Replace
              </Button>
              <Button
                type="button"
                size="icon"
                variant="secondary"
                className="h-8 w-8 rounded-full"
                disabled={uploading}
                onClick={() => onChange("")}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </>
        ) : (
          <button
            type="button"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
            className="flex h-full w-full flex-col items-center justify-center gap-2 p-6 text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground"
          >
            {uploading ? (
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            ) : (
              <ImagePlus className="h-8 w-8" />
            )}
            <span className="text-sm font-medium">
              {uploading ? "Uploading…" : "Choose image from device"}
            </span>
            <span className="text-xs">PNG, JPG, WebP, GIF · max 5 MB</span>
          </button>
        )}

        {uploading && previewSrc && (
          <div className="absolute inset-0 grid place-items-center bg-background/60 backdrop-blur-sm">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleFile(file);
        }}
      />
    </div>
  );
}
