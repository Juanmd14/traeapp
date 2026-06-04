import Image, { type ImageProps } from "next/image";
import { cn } from "@/lib/utils";

type LogoProps = Omit<ImageProps, "src" | "alt"> & {
  variant?: "full" | "icon";
  forceWhite?: boolean;
  alt?: string;
};

const SOURCES = {
  full: {
    color: "/brand/logo-vadelivery-color.svg",
    white: "/brand/logo-vadelivery-white.svg",
    width: 540,
    height: 200,
  },
  icon: {
    color: "/brand/icon-vadelivery.svg",
    white: "/brand/icon-vadelivery.svg",
    width: 160,
    height: 170,
  },
} as const;

export function Logo({
  variant = "full",
  forceWhite = false,
  alt = "Trae App",
  className,
  width,
  height,
  ...props
}: LogoProps) {
  const meta = SOURCES[variant];
  const w = width ?? meta.width;
  const h = height ?? meta.height;

  if (forceWhite) {
    return (
      <Image
        src={meta.white}
        alt={alt}
        width={w}
        height={h}
        className={className}
        {...props}
      />
    );
  }

  if (variant === "icon") {
    return (
      <Image
        src={meta.color}
        alt={alt}
        width={w}
        height={h}
        className={className}
        {...props}
      />
    );
  }

  return (
    <>
      <Image
        src={meta.color}
        alt={alt}
        width={w}
        height={h}
        className={cn("block dark:hidden", className)}
        {...props}
      />
      <Image
        src={meta.white}
        alt={alt}
        width={w}
        height={h}
        className={cn("hidden dark:block", className)}
        aria-hidden
        {...props}
      />
    </>
  );
}
