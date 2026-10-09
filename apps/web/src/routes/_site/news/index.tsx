import { createFileRoute } from "@tanstack/react-router";
import { getPostList } from "#/server/public";
import { PostListingPage, postListSearchSchema } from "#/components/site/post-pages";

export const Route = createFileRoute("/_site/news/")({
  validateSearch: postListSearchSchema,
  loaderDeps: ({ search }) => search,
  loader: ({ deps }) => getPostList({ data: { type: "news", ...deps } }),
  head: () => ({ meta: [{ title: "News | Enchi College of Education" }] }),
  component: ListingRoute,
});

function ListingRoute() {
  return <PostListingPage type="news" search={Route.useSearch()} data={Route.useLoaderData()} />;
}
