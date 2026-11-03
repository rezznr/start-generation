import Image from "next/image";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <>
      <header className="bg-navy-deep">
        <div className="mx-auto flex h-20 max-w-6xl items-center gap-3 px-4 sm:h-24 sm:px-8">
          <Image src="/tab-icon.webp" alt="" width={44} height={44} className="size-9 sm:size-11" priority />
          <div className="text-gold">
            <p className="text-lg font-light tracking-[0.35em] sm:text-2xl">STAR GENERATION</p>
            <p className="text-[9px] tracking-[0.3em] sm:text-[10px]">Creating stars for the future generation</p>
          </div>
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
