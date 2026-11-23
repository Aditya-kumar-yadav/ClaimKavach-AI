import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Public routes that do NOT require authentication
const isPublicRoute = createRouteMatcher([
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/sso-callback(.*)",
  "/images(.*)",
  "/api(.*)",
]);

export default clerkMiddleware((auth, req) => {
  const { userId } = auth();

  // If user is already authenticated and visits sign-in or sign-up, redirect to home audit page
  if (userId && (req.nextUrl.pathname.startsWith("/sign-in") || req.nextUrl.pathname.startsWith("/sign-up"))) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // If route is not public, protect it with explicit unauthenticatedUrl to prevent Clerk notFound()
  if (!isPublicRoute(req)) {
    const signInUrl = new URL("/sign-in", req.url).toString();
    auth().protect({ unauthenticatedUrl: signInUrl });
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
