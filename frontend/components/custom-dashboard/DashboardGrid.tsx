"use client";

import ReactGridLayout, {
  useContainerWidth,
  verticalCompactor,
  type Layout,
  type LayoutItem,
} from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import { cn } from "@/lib/utils";

export interface DashboardGridProps {
  layout: LayoutItem[];
  editMode: boolean;
  className?: string;
  onLayoutChange: (next: LayoutItem[]) => void;
  onDragOrResizeStop?: (next: LayoutItem[]) => void;
  children: React.ReactNode;
}

/**
 * Client-only grid: parent should load via `dynamic(..., { ssr: false })` if needed.
 */
export function DashboardGrid({
  layout,
  editMode,
  className,
  onLayoutChange,
  onDragOrResizeStop,
  children,
}: DashboardGridProps) {
  const { width, containerRef, mounted } = useContainerWidth({
    measureBeforeMount: true,
  });

  const layoutArr = layout as unknown as Layout;

  return (
    <div ref={containerRef} className={cn("w-full min-w-0", className)}>
      {mounted && width > 0 ? (
        <ReactGridLayout
          layout={layoutArr}
          width={width}
          gridConfig={{
            cols: 12,
            rowHeight: 72,
            margin: [12, 12],
            containerPadding: [8, 8],
            maxRows: Infinity,
          }}
          dragConfig={{ enabled: editMode, bounded: false, threshold: 3 }}
          resizeConfig={{
            enabled: editMode,
            handles: ["se", "sw", "ne", "nw", "e", "w", "n", "s"],
          }}
          compactor={verticalCompactor}
          onLayoutChange={(next) => {
            onLayoutChange([...next] as LayoutItem[]);
          }}
          onDragStop={(next) => {
            const copy = [...next] as LayoutItem[];
            onDragOrResizeStop?.(copy);
          }}
          onResizeStop={(next) => {
            const copy = [...next] as LayoutItem[];
            onDragOrResizeStop?.(copy);
          }}
        >
          {children}
        </ReactGridLayout>
      ) : (
        <div className="bg-muted/30 h-[320px] w-full animate-pulse rounded-lg" />
      )}
    </div>
  );
}
