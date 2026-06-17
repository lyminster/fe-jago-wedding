import { NextRequest, NextResponse } from "next/server";

const publicDomain =
  process.env.NEXT_PUBLIC_PUBLIC_INVITATION_DOMAIN ??
  "jago-wedding.up.railway.app";

export function middleware(request: NextRequest) {
  const host = request.headers.get("host")?.split(":")[0] ?? "";
  const pathname = request.nextUrl.pathname;
  const localSlug = getLocalhostSubdomain(host);
  const productionSlug = getProductionSubdomain(host);

  if (pathname === "/") {
    const slug = localSlug ?? productionSlug;
    if (slug) {
      return NextResponse.rewrite(new URL(`/undangan/${slug}`, request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/"],
};

function getLocalhostSubdomain(host: string) {
  const localDomains = [".localhost", ".lvh.me"];
  const matchedDomain = localDomains.find((domain) => host.endsWith(domain));
  if (!matchedDomain) return null;

  const slug = host.slice(0, -matchedDomain.length);
  return slug && slug !== "www" ? slug : null;
}

function getProductionSubdomain(host: string) {
  if (!host.endsWith(`.${publicDomain}`) || host === `www.${publicDomain}`) {
    return null;
  }

  const slug = host.slice(0, -`.${publicDomain}`.length);
  return slug || null;
}
