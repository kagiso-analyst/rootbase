// components/ui/card.tsx

import * as React from "react"
import { cn } from "@/lib/utils"

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { 
    size?: "default" | "sm" 
    variant?: "default" | "outline" | "ghost"
  }
>(({ className, size = "default", variant = "default", ...props }, ref) => {
  const variants = {
    default: "bg-white shadow-sm border border-gray-100/80",
    outline: "bg-white border-2 border-gray-200",
    ghost: "bg-transparent border-0 shadow-none",
  }
  
  const sizes = {
    default: "p-6",
    sm: "p-4",
  }
  
  return (
    <div
      ref={ref}
      className={cn(
        "rounded-xl transition-all duration-200",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    />
  )
})
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5", className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-none tracking-tight text-[#1B4332]",
      className
    )}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-gray-500", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center pt-4 mt-auto", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

// ===== CARD VARIANTS =====
const CardPrimary = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <Card
    ref={ref}
    className={cn("border-l-4 border-l-[#2D6A4F] bg-gradient-to-br from-white to-[#D8F3DC]/10", className)}
    {...props}
  />
))
CardPrimary.displayName = "CardPrimary"

const CardDanger = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <Card
    ref={ref}
    className={cn("border-l-4 border-l-red-500 bg-gradient-to-br from-white to-red-50/30", className)}
    {...props}
  />
))
CardDanger.displayName = "CardDanger"

const CardSuccess = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <Card
    ref={ref}
    className={cn("border-l-4 border-l-green-500 bg-gradient-to-br from-white to-green-50/30", className)}
    {...props}
  />
))
CardSuccess.displayName = "CardSuccess"

const CardWarning = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <Card
    ref={ref}
    className={cn("border-l-4 border-l-yellow-500 bg-gradient-to-br from-white to-yellow-50/30", className)}
    {...props}
  />
))
CardWarning.displayName = "CardWarning"

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
  CardPrimary,
  CardDanger,
  CardSuccess,
  CardWarning,
}