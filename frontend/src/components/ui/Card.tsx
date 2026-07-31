import { type HTMLAttributes, forwardRef } from "react";
import { clsx } from "clsx";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "outlined";
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = "default", ...props }, ref) => {
    const baseClasses = "rounded-xl bg-white transition-shadow";
    const variantClasses = {
      default: "shadow-sm border border-gray-100",
      outlined: "border-2 border-gray-200",
    };

    return (
      <div
        className={clsx(baseClasses, variantClasses[variant], className)}
        ref={ref}
        {...props}
      />
    );
  }
);

Card.displayName = "Card";

export const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      className={clsx("px-6 py-4 border-b border-gray-100", className)}
      ref={ref}
      {...props}
    />
  )
);
CardHeader.displayName = "CardHeader";

export const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div className={clsx("px-6 py-4", className)} ref={ref} {...props} />
  )
);
CardContent.displayName = "CardContent";

export const CardFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      className={clsx("px-6 py-4 border-t border-gray-100", className)}
      ref={ref}
      {...props}
    />
  )
);
CardFooter.displayName = "CardFooter";
