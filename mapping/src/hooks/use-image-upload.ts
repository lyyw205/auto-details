"use client";

import { useState, useCallback } from "react";
import type { ImageState } from "@/lib/types";
import { MAX_IMAGE_SIZE } from "@/lib/constants";

export function useImageUpload() {
  const [image, setImage] = useState<ImageState | null>(null);
  const [error, setError] = useState<string | null>(null);

  const processFile = useCallback((file: File) => {
    setError(null);

    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file.");
      return;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      setError("Image must be smaller than 10MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const src = e.target?.result as string;
      const img = new Image();
      img.onload = () => {
        setImage({
          src,
          naturalWidth: img.naturalWidth,
          naturalHeight: img.naturalHeight,
          fileName: file.name,
        });
      };
      img.onerror = () => {
        setError("Failed to load image.");
      };
      img.src = src;
    };
    reader.onerror = () => {
      setError("Failed to read file.");
    };
    reader.readAsDataURL(file);
  }, []);

  const clearImage = useCallback(() => {
    setImage(null);
    setError(null);
  }, []);

  return { image, error, processFile, clearImage };
}
