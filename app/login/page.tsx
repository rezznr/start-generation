import Image from "next/image";
import { Button } from "@/components/ui/button";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <>
      <header className="bg-navy-deep">
        {/* Sizes scale with the viewport so margins and logo keep the proportions of the Star Generation site. */}
        <div className="flex h-[clamp(64px,6.6vw,104px)] items-center justify-between gap-6 px-[clamp(16px,6.2vw,140px)]">
          <Image src="/stargeneration-logo.webp" alt="Star Generation, creating stars for the future generation" width={800} height={116} priority className="h-auto w-[clamp(190px,21vw,340px)]" />
          <nav aria-label="Star Generation site" className="hidden items-center gap-[clamp(24px,2.2vw,40px)] text-[clamp(14px,1.05vw,18px)] font-semibold uppercase text-white lg:flex">
            {["Expertise", "Our Programs", "Achievements", "Career", "About Us"].map((l) => (
              <a key={l} href="https://stargeneration.net" className="hover:text-gold-soft">{l}</a>
            ))}
          </nav>
          <Button href="/login" aria-current="page">Sign In</Button>
        </div>
      </header>
      <main className="bg-grid grid flex-1 place-items-center px-4 py-12">
        <div className="w-full max-w-md">
          <h1 className="mb-6 text-center text-2xl font-bold">Sign in to your account</h1>
          <div className="rounded-card border border-border bg-white/90 p-8 shadow-sm">
            <LoginForm />
          </div>
          <p className="mt-6 text-center text-sm text-muted">Group Class Enrollment &amp; Billing</p>
        </div>
      </main>
    </>
  );
}
