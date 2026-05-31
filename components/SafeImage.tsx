"use client";

import { useState } from "react";

type SafeImageProps = {
  src?: string;
  alt: string;
  className?: string;
  fallbackClassName?: string;
  fallbackText?: string;
};

export function SafeImage({
  src,
  alt,
  className,
  fallbackClassName,
  fallbackText = "-"
}: SafeImageProps) {
  const [failed, setFailed] = useState(false);
  const imageSrc = src?.trim();

  if (!imageSrc || failed) {
    return (
      <div className={fallbackClassName}>
        {fallbackText}
      </div>
    );
  }

  return (
    <img
      src={imageSrc}
      alt={alt}
      className={className}
      onError={() => setFailed(true)}
    />
  );
}
