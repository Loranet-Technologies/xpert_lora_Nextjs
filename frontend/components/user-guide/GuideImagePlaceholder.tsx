"use client";

import Image from "next/image";

export type GuideImagePlaceholderProps = {
  /** Anchor id for in-page links, e.g. `#image-register` */
  slotId: string;
  /** Used as the image `alt` text and optional caption title */
  title: string;
  /** File under `public/user-guide/` */
  fileName: string;
  /** Short caption below the image */
  hint: string;
};

/**
 * User-guide screenshot: fixed 16:9 frame, image fills with `object-cover`.
 */
export function GuideImagePlaceholder({
  slotId,
  title,
  fileName,
  hint,
}: GuideImagePlaceholderProps) {
  const src = `/user-guide/${fileName}`;

  return (
    <figure id={slotId} className="scroll-mt-28 not-prose my-8 w-full">
      <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-border/80 bg-muted shadow-md ring-1 ring-black/5 dark:ring-white/10">
        <Image
          src={src}
          alt={title}
          fill
          sizes="(max-width: 768px) 100vw, 768px"
          className="object-contain "
        />
      </div>
      <figcaption className="mt-2 text-xs leading-relaxed text-muted-foreground">
        <span className="font-medium text-foreground/90">{title}</span>
        {hint ? <> — {hint}</> : null}
      </figcaption>
    </figure>
  );
}
