import { PageSkeleton } from "@/components/page-skeleton";

// Own route group so the skeleton shows at once when coming from a sibling page.
export default function Loading() {
  return <PageSkeleton />;
}
