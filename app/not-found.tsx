import Link from "next/link"
import { Button } from "@/components/ui/button"
import { SphereXLogo } from "@/components/logo"

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#f7f3ec] px-6 py-16 dark:bg-background">
      <div className="mx-auto w-full max-w-md text-center">
        <div className="mb-8 flex justify-center">
          <SphereXLogo className="h-10 w-auto" priority />
        </div>
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-[#6b5c4f] dark:text-muted-foreground">
          404
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-[#1c1917] dark:text-foreground">
          Page not found
        </h1>
        <p className="mt-2 text-sm text-[#6b5c4f] dark:text-muted-foreground">
          This link may be broken or the page may have moved. Try the home page or sign in.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button
            asChild
            className="rounded-full bg-[#1a1f2e] text-white hover:bg-[#252b3d] dark:bg-primary dark:text-primary-foreground"
          >
            <Link href="/">Go home</Link>
          </Button>
          <Button asChild variant="outline" className="rounded-full">
            <Link href="/login">Sign in</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
