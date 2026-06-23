"use client";

import { createContext, useContext } from "react";

export const ImageUploadGuardContext = createContext<(uploading: boolean) => void>(() => {});

export function useImageUploadGuard() {
  return useContext(ImageUploadGuardContext);
}
