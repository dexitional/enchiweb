// Client-safe server function for /directory/my-listing's loader, so the page
// renders signed-in state on the server. Server modules are imported
// dynamically to keep them out of the browser bundle.
import { createServerFn } from "@tanstack/react-start";
import { getCookie } from "@tanstack/react-start/server";

export const getMyListingData = createServerFn({ method: "GET" }).handler(async () => {
  const { STAFF_SESSION_COOKIE, accountFromToken, staffAuthConfig } =
    await import("./staff-session.js");
  const { portalState } = await import("./staff-listings.js");
  const account = await accountFromToken(getCookie(STAFF_SESSION_COOKIE));
  return { me: await portalState(account), config: staffAuthConfig() };
});
