// components/ui/skeleton.tsx

import { cn } from "@/lib/utils"

interface SkeletonProps extends React.ComponentProps<"div"> {
  variant?: "default" | "circle" | "rectangle" | "text" | "card"
  animated?: boolean
}

function Skeleton({ 
  className, 
  variant = "default",
  animated = true,
  ...props 
}: SkeletonProps) {
  const variants = {
    default: "rounded-md",
    circle: "rounded-full aspect-square",
    rectangle: "rounded-lg",
    text: "rounded h-4",
    card: "rounded-xl",
  }

  return (
    <div
      data-slot="skeleton"
      className={cn(
        "bg-gradient-to-r from-gray-200 to-gray-100",
        animated && "animate-pulse",
        variants[variant],
        className
      )}
      {...props}
    />
  )
}

// ===== SKELETON COMPOSITION =====
function SkeletonCard() {
  return (
    <div className="space-y-3">
      <Skeleton variant="card" className="h-32 w-full" />
      <div className="space-y-2">
        <Skeleton variant="text" className="w-3/4" />
        <Skeleton variant="text" className="w-1/2" />
        <Skeleton variant="text" className="w-2/3" />
      </div>
    </div>
  )
}

function SkeletonAvatar({ size = 10 }: { size?: number }) {
  return (
    <Skeleton 
      variant="circle" 
      className={`h-${size} w-${size}`} 
    />
  )
}

function SkeletonList({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} variant="text" className="w-full" />
      ))}
    </div>
  )
}

export { 
  Skeleton, 
  SkeletonCard, 
  SkeletonAvatar, 
  SkeletonList 
}