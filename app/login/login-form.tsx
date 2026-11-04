"use client";

import { Eye, EyeOff } from "lucide-react";
import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { ErrorToast } from "@/components/ui/toast";
import { Input } from "@/components/ui/field";
import { signIn } from "./actions";

export function LoginForm() {
  const [state, action, pending] = useActionState(signIn, null);
  const [show, setShow] = useState(false);
  return (
    <form action={action} className="space-y-5" aria-busy={pending}>
      <label className="block text-sm font-bold">
        Email
        <Input name="email" type="email" autoComplete="email" required placeholder="Insert Email" className="mt-2 font-normal" />
      </label>
      <label className="block text-sm font-bold">
        Password
        <span className="relative mt-2 block">
          <Input name="password" type={show ? "text" : "password"} autoComplete="current-password" required placeholder="Insert Password" className="pr-12 font-normal" />
          <button type="button" onClick={() => setShow(!show)} aria-label={show ? "Hide password" : "Show password"}
            className="absolute right-1 top-1/2 grid size-11 -translate-y-1/2 place-items-center text-muted hover:text-navy">
            {show ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
          </button>
        </span>
      </label>
      <ErrorToast message={state?.error} token={state} />
      <Button type="submit" variant="soft" square loading={pending} className="w-full font-semibold !normal-case !tracking-normal">
        Sign In
      </Button>
    </form>
  );
}
