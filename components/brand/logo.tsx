import Image from "next/image"
import Link from "next/link"
import { cn } from "@/lib/utils"

export function Logo({
  className,
  size = 40,
  withWordmark = true,
  href = "/",
}: {
  className?: string
  size?: number
  withWordmark?: boolean
  href?: string | null
}) {
  const content = (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <span className="relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-xl bg-primary/5 ring-1 ring-primary/10">
        <Image
          src="/brand/logo.png"
          alt="Bioacademy logo"
          width={size}
          height={size}
          className="object-contain"
          priority
        />
      </span>
      {withWordmark && (
        <span className="flex flex-col leading-none">
          <span className="font-heading text-lg font-bold tracking-tight text-foreground">Bioacademy</span>
          <span className="text-[10px] font-medium tracking-[0.18em] text-muted-foreground uppercase">
            Dr. Mina Samuel
          </span>
        </span>
      )}
    </span>
  )
  if (!href) return content
  return (
    <Link href={href} aria-label="Bioacademy home" className="inline-flex">
      {content}
    </Link>
  )
}
