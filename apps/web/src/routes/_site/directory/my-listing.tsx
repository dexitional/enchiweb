import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { MyListingPage } from "#/components/directory/my-listing/MyListingPage";
import { getMyListingData } from "#/server/staff-portal-fns";

// Staff manage their own directory listing here (signed in with Google).
export const Route = createFileRoute("/_site/directory/my-listing")({
  validateSearch: z.object({
    error: z.string().max(40).optional().catch(undefined),
  }),
  loader: () => getMyListingData(),
  head: () => ({
    meta: [
      { title: "My Directory Listing | Enchi College of Education" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: MyListingRoute,
});

function MyListingRoute() {
  const { error } = Route.useSearch();
  const { me, config } = Route.useLoaderData();
  return <MyListingPage error={error} initialMe={me} config={config} />;
}
