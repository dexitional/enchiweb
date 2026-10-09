// Permanent redirects from the old Hostinger site's URLs
// (enchicoe.edu.gh/overview, /college-management, /hall-of-residence, ...) to
// their new homes, so existing links and search results keep working.
// Client-safe; used by the catch-all section routes.
//
// /admissions and /academics are section paths on the new site too, so they
// need no entry here.

const PAGES: Record<string, string> = {
  "/home": "/",
  "/about-us": "/about/overview",
  "/overview": "/about/overview",
  "/history": "/about/history",
  "/mission-and-vision": "/about/mission-and-vision",
  "/accreditation-and-institutional-status": "/about/accreditation",
  "/college-management": "/about/management",
  "/programmes": "/academics/programmes",
  "/academic-calendar": "/academics/academic-calendar",
  "/esrp": "/academics/esrp",
  "/staff": "/directory",
  "/admission-list-2026": "/announcements/how-to-check-your-admission-status",
  "/student": "/student-life",
  "/campus-life": "/student-life/campus-life",
  "/hall-of-residence": "/student-life/halls-of-residence",
  "/src": "/student-life/student-leadership",
  "/enchicoe-creative-hub": "/student-life",
  "/transcript-request": "/alumni/transcript-request",
  "/honor-roll": "/alumni/give-to-enchicoe",
};

export function legacyRedirect(pathname: string): string | null {
  const path = pathname.toLowerCase().replace(/\/+$/, "") || "/";
  return PAGES[path] ?? null;
}
