import { ResponsiveModal } from "@/components/responsive-modal";
import { UploadDropzone } from "@/lib/uploadthing";
import { trpc } from "@/trpc/client";

interface ThumbnailUploadModalProps {
  videoId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ThumbnailUploadModal = ({
  videoId,
  open,
  onOpenChange,
}: ThumbnailUploadModalProps) => {
  const utils = trpc.useUtils();

  const onUploadComplete = () => {
    utils.studio.getMany.invalidate();
    // Invalidar la caché o actualizar el estado según sea necesario
    utils.studio.getOne.invalidate({ id: videoId });
    onOpenChange(false);
  };

  return (
    <>
      <ResponsiveModal
        open={open}
        title="Upload Thumbnail"
        onOpenChange={onOpenChange}
      >
        {/*
          El string "ThumbnailUploader" debe coincidir con la clave exportada
          en `ourFileRouter` (ver: src/app/api/uploadthing/core.ts).
          Allí se define el endpoint:
            export const ourFileRouter = { ThumbnailUploader: f({...}) }

          onClientUploadComplete recibe lo que devuelve `onUploadComplete` en el
          servidor (en este proyecto devuelve { uploadedBy: metadata.user.id }).
          Aquí cerramos el modal y registramos el resultado; puedes
          invalidar caches o actualizar estado según necesites.
        */}
        <UploadDropzone
          endpoint="thumbnailUploader"
          input={{ videoId }}
          onClientUploadComplete={onUploadComplete}
        />
      </ResponsiveModal>
    </>
  );
};
