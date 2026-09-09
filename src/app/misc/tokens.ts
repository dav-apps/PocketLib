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
