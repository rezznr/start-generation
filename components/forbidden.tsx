import { Button } from "@/components/ui/button";
import type { Role } from "@/lib/auth";

export function Forbidden({ role }: { role: Role }) {
  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <p className="text-5xl font-bold">403</p>
      <h1 className="mt-3 text-xl font-bold">You do not have access to this page</h1>
      <p className="mb-6 mt-1 text-muted">This area is limited to another role. Your account is signed in as {role}.</p>
      <Button href={`/${role}`}>Go to my dashboard</Button>
    </div>
  );
}
