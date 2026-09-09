import { InjectionToken } from "@angular/core"

/**
 * The Accept-Language header of the request being server rendered, or null in
 * the browser and while prerendering.
 *
 * The browser tells us its language through navigator.language, the server only
 * learns it from this header. Without it every server rendered page comes out
 * in English - including the alt texts of the book covers, which is what search
 * engines read.
 *
 * Deliberately without `providedIn: "root"`: a root provider lives in the
 * application injector, which is a child of the platform injector that
 * CommonEngine passes its providers to, so the default would shadow the real
 * header. Inject it with @Optional() instead, which yields null in the browser.
 */
export const REQUEST_LANGUAGE = new InjectionToken<string | null>(
	"REQUEST_LANGUAGE"
)

/**
 * Lets the application tell the server which status to answer with. The object
 * is created per request, so writing to it cannot leak into another one.
 *
 * Without this a slug that resolves to nothing still answers 200 with an empty
 * shell - a soft 404, which search engines index and then hold against the
 * site rather than dropping the url.
 *
 * Same reason as REQUEST_LANGUAGE for having no `providedIn: "root"` default.
 */
export interface ResponseState {
	status: number
}

export const RESPONSE_STATE = new InjectionToken<ResponseState>(
	"RESPONSE_STATE"
)
