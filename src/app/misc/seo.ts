/** Keep content selectors, but discard tracking parameters and URL fragments. */
export function canonicalUrl(path: string, navigationUrl: string): string {
	const url = new URL(`/${path.replace(/^\/+/, "")}`, "https://pocketlib.app")
	url.pathname = url.pathname.replace(/\/+$/, "") || "/"
	url.search = ""
	url.hash = ""

	if (/^\/store\/(author|publisher|category|series)\/[^/]+$/.test(url.pathname)) {
		const query = new URL(navigationUrl, url.origin).searchParams
		const page = query.get("page")
		if (page != null && /^\d+$/.test(page) && Number.isSafeInteger(Number(page)) && Number(page) > 1) {
			url.searchParams.set("page", String(Number(page)))
		}
		if (url.pathname.startsWith("/store/publisher/") && query.get("query")?.trim()) {
			url.searchParams.set("query", query.get("query").trim())
		}
	}
	return url.href
}
