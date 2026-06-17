export function getGoogleMapEmbedSrc(link: string) {
  const query = getGoogleMapQuery(link);
  if (!query) return "about:blank";

  return `https://www.google.com/maps?q=${encodeURIComponent(
    query,
  )}&output=embed`;
}

export function isGoogleMapsShortLink(link: string) {
  try {
    const url = new URL(link.trim());

    return (
      url.hostname === "maps.app.goo.gl" ||
      (url.hostname === "goo.gl" && url.pathname.startsWith("/maps"))
    );
  } catch {
    return false;
  }
}

export function isAllowedGoogleMapsUrl(link: string) {
  try {
    const url = new URL(link.trim());

    return (
      url.hostname === "maps.app.goo.gl" ||
      url.hostname === "goo.gl" ||
      url.hostname.endsWith("google.com") ||
      url.hostname.endsWith("google.co.id") ||
      url.hostname === "maps.google.com"
    );
  } catch {
    return false;
  }
}

export function getGoogleMapQuery(link: string) {
  const trimmedLink = link.trim();

  if (!trimmedLink) return "";

  try {
    const url = new URL(trimmedLink);
    const coordinateQuery = getCoordinatesFromMapsUrl(url);

    if (coordinateQuery) return coordinateQuery;

    const q = url.searchParams.get("q");

    if (q) return q;

    const placeMatch = url.pathname.match(/\/maps\/place\/([^/]+)/);

    if (placeMatch?.[1]) {
      return decodeURIComponent(placeMatch[1].replace(/\+/g, " "));
    }

    return trimmedLink;
  } catch {
    return trimmedLink;
  }
}

function getCoordinatesFromMapsUrl(url: URL) {
  const dataCoordinates = url.href.match(
    /!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/,
  );

  if (dataCoordinates) {
    return `${dataCoordinates[1]},${dataCoordinates[2]}`;
  }

  const atCoordinates = url.href.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);

  if (atCoordinates) {
    return `${atCoordinates[1]},${atCoordinates[2]}`;
  }

  return null;
}
