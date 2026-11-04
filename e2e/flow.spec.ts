// End-to-end flow from the brief, against the real Supabase project. Run `pnpm db:seed` first.
import { expect, test, type Page } from "@playwright/test";

const title = `E2E Physics ${Date.now()}`;
const PASSWORD = "StarGen!2026";
// A random past day keeps reruns from tripping the tutor overlap rule.
const AGO = 30 + Math.floor(Math.random() * 300);

async function login(page: Page, user: string) {
  await page.context().clearCookies();
  await page.goto("/login");
  await page.getByLabel("Email").fill(`${user}@stargeneration.demo`);
  await page.getByLabel("Password", { exact: true }).fill(PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL(new RegExp(`/(admin|tutor|student)`));
}

// Drives the custom date and time picker: walk back to the month, pick the day, hour and minute.
async function pickDateTime(page: Page, label: string, daysAgo: number, hour: string, minute: string) {
  const d = new Date(Date.now() + 7 * 3600_000 - daysAgo * 86400_000);
  const iso = d.toISOString().slice(0, 10);
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel(label).click();
  const header = new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric", timeZone: "UTC" }).format(d);
  for (let i = 0; i < 14 && !(await dialog.getByText(header, { exact: true }).isVisible()); i++) {
    await dialog.getByRole("button", { name: "Previous month" }).click();
  }
  await dialog.getByRole("button", { name: iso }).click();
  await dialog.getByRole("button", { name: `Hour ${hour}` }).click();
  await dialog.getByRole("button", { name: `Minute ${minute}` }).click();
  await dialog.getByRole("button", { name: "Done" }).click();
}

test("enrollment to paid access to approved report to earnings", async ({ page }) => {
  // 1. Admin creates a class.
  await login(page, "admin");
  await page.goto("/admin/classes");
  await page.getByRole("button", { name: "Create class" }).click();
  await page.getByLabel("Title").fill(title);
  await page.getByLabel("Capacity").fill("2");
  await page.locator("select[name=tutor_id]").selectOption({ label: "Rina Kusuma" });
  await page.getByLabel("Student price (IDR)").fill("600000");
  await page.getByLabel("Tutor hourly rate (IDR)").fill("100000");
  await page.getByRole("dialog").getByRole("button", { name: "Create class" }).click();
  await expect(page.getByRole("dialog")).toBeHidden();
  await expect(page.getByRole("link", { name: title })).toBeVisible();

  // Tutor schedules a past 90 minute lesson and reports on it.
  await login(page, "rina");
  await page.goto("/tutor/schedule");
  await page.getByRole("button", { name: "Schedule lesson" }).first().click();
  await page.locator("select[name=class_id]").selectOption({ label: title });
  await pickDateTime(page, "Starts (WIB)", AGO, "10", "00");
  await pickDateTime(page, "Ends (WIB)", AGO, "11", "30");
  await page.getByRole("dialog").getByRole("button", { name: "Schedule lesson" }).click();
  await expect(page.getByRole("dialog")).toBeHidden();
  await expect(page.getByRole("cell", { name: title }).first()).toBeVisible();

  // 2 and 3. Student enrolls and sees a locked class with an invoice.
  await login(page, "bagas");
  await page.goto("/student/browse");
  const card = page.locator("article", { hasText: title });
  await card.getByRole("button", { name: "Enroll now" }).click();
  await page.getByRole("button", { name: "Confirm enrollment" }).click();
  await expect(page.getByRole("dialog")).toBeHidden();
  await expect(card.getByText("You are enrolled")).toBeVisible();
  await page.goto("/student/invoices");
  await expect(page.getByRole("row", { name: new RegExp(title) })).toContainText("Awaiting Payment");
  await page.goto("/student/schedule");
  await expect(page.getByText(title)).toHaveCount(0);

  // 4. Admin marks the invoice paid.
  await login(page, "admin");
  await page.goto("/admin/invoices?status=unpaid");
  const row = page.getByRole("row", { name: new RegExp(title) });
  await row.getByRole("button", { name: "Mark as Paid" }).click();
  await page.getByRole("button", { name: "Confirm payment" }).click();
  await expect(page.getByRole("dialog")).toBeHidden();
  await expect(page.getByRole("row", { name: new RegExp(title) })).toHaveCount(0);

  // 5. Student now has schedule access.
  await login(page, "bagas");
  await page.goto("/student/schedule?month=" + new Date(Date.now() + 7 * 3600_000 - AGO * 86400_000).toISOString().slice(0, 7));
  await expect(page.getByRole("button", { name: new RegExp(title) }).first()).toBeVisible();

  // 6. Tutor submits the report.
  await login(page, "rina");
  await page.goto("/tutor/reports");
  await page.getByRole("row", { name: new RegExp(title) }).getByRole("button", { name: "Submit report" }).click();
  await page.getByLabel("Topic").fill("Kinematics");
  await page.getByLabel("Learning progress").fill("Solved motion problems.");
  await page.getByLabel("Next steps").fill("Practise projectile motion.");
  await page.getByRole("dialog").getByRole("button", { name: "Submit report" }).click();
  await expect(page.getByRole("dialog")).toBeHidden();
  await expect(page.getByRole("row", { name: new RegExp(title) })).toContainText("Pending approval");

  // 7. Admin sees the Rp150.000 preview and approves.
  await login(page, "admin");
  await page.goto("/admin/reports");
  await page.getByRole("row", { name: new RegExp(title) }).getByRole("button", { name: "Review" }).click();
  await expect(page.getByRole("dialog")).toContainText("150.000");
  await page.getByRole("button", { name: /Approve and record earnings/ }).click();
  await expect(page.getByRole("dialog")).toBeHidden();
  await expect(page.getByRole("row", { name: new RegExp(title) })).toHaveCount(0);

  // 8. Student reads the approved report.
  await login(page, "bagas");
  await page.goto("/student/classes");
  await page.getByRole("row", { name: new RegExp(title) }).getByRole("link", { name: "Open class" }).click();
  await expect(page.getByText("Practise projectile motion.")).toBeVisible();

  // 9. Tutor sees the earning.
  await login(page, "rina");
  await page.goto("/tutor/earnings");
  await expect(page.getByRole("row", { name: new RegExp(title) })).toContainText("150.000");
});

test("every role can sign out from the account menu", async ({ page }) => {
  for (const user of ["bagas", "rina", "admin"]) {
    await login(page, user);
    await page.getByRole("button", { name: "Account menu" }).click();
    await page.getByRole("menuitem", { name: "Sign Out" }).click();
    await page.waitForURL(/\/login/);
    await expect(page.getByRole("heading", { name: "Sign in to your account" })).toBeVisible();
  }
});
