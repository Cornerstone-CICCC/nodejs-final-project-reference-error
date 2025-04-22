"use client";

interface SupabaseImageProps {
  fileName: string;
  width?: number;
  height?: number;
  alt?: string;
}

export default function SupabaseImage({
  fileName,
  width = 300,
  height = 200,
  alt = "Image",
}: SupabaseImageProps) {
  if (!fileName) {
    return <div className="text-gray-500">No image available</div>;
  }

  return (
    <img src={fileName} width={width} height={height} alt={alt} className="rounded object-cover" />
  );
}
