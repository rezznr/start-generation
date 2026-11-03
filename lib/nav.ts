import type { Role } from "@/lib/auth";

type Item = { href: string; label: string; icon: string; subtitle: string };

export const nav: Record<Role, Item[]> = {
  admin: [
    { href: "/admin", label: "Dashboard", icon: "layout", subtitle: "Operations at a glance" },
    { href: "/admin/classes", label: "Classes", icon: "star", subtitle: "Create classes, set capacity and assign tutors" },
    { href: "/admin/invoices", label: "Invoices", icon: "receipt", subtitle: "Confirm simulated payments" },
    { href: "/admin/reports", label: "Reports", icon: "file", subtitle: "Review and approve tutor reports" },
    { href: "/admin/earnings", label: "Tutor Earnings", icon: "wallet", subtitle: "Earnings recorded from approved reports" },
  ],
  tutor: [
    { href: "/tutor", label: "Dashboard", icon: "layout", subtitle: "Your classes, lessons and earnings" },
    { href: "/tutor/classes", label: "My Classes", icon: "star", subtitle: "Classes assigned to you" },
    { href: "/tutor/schedule", label: "Schedule", icon: "calendar", subtitle: "Plan lessons in WIB" },
    { href: "/tutor/reports", label: "Reports", icon: "file", subtitle: "One shared report per finished lesson" },
    { href: "/tutor/earnings", label: "Earnings", icon: "wallet", subtitle: "Earnings from approved lessons" },
  ],
  student: [
    { href: "/student", label: "Dashboard", icon: "layout", subtitle: "Overview of all your classes and learning activities" },
    { href: "/student/browse", label: "Browse Classes", icon: "search", subtitle: "Find a class and reserve your seat" },
    { href: "/student/classes", label: "My Classes", icon: "star", subtitle: "Paid classes open your schedule and reports" },
    { href: "/student/invoices", label: "My Invoices", icon: "receipt", subtitle: "Amounts are fixed when you enroll" },
    { href: "/student/schedule", label: "Schedule", icon: "calendar", subtitle: "Lessons for the classes you have paid for" },
  ],
};
