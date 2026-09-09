import { Injectable, Inject, Optional, PLATFORM_ID, TransferState, makeStateKey } from "@angular/core"
import { isPlatformBrowser } from "@angular/common"
import * as locales from "src/locales/locales"
import { Language } from "../misc/types"
import { REQUEST_LANGUAGE } from "../misc/tokens"

const renderedLanguage = makeStateKey<string>("pocketlib.language")

@Injectable()
export class LocalizationService {
	locale = locales.enUS
	/** The language the interface is displayed in */
	language: Language = Language.en

	constructor(
		@Inject(PLATFORM_ID) private platformId: object,
		@Optional() @Inject(REQUEST_LANGUAGE) requestLanguage: string | null,
		transferState: TransferState
	) {
		const browser = isPlatformBrowser(this.platformId)
		const preferred = browser
			? preferredLanguageTag(navigator.languages.join(","))
			: preferredLanguageTag(requestLanguage)
		// Hydrate with the exact locale used for the server markup.
		const tag = browser
			? transferState.get(renderedLanguage, preferred ?? "en")
			: preferred ?? "en"
		if (!browser) transferState.set(renderedLanguage, tag)

		this.locale = this.getLocale(tag)
		this.language = tag?.toLowerCase().startsWith("de")
			? Language.de
			: Language.en
	}

	private getLocale(language?: string) {
		if (language == null) return locales.enUS

		const locale = language.toLowerCase()

		if (locale.startsWith("en")) {
			if (locale == "en-gb") return locales.enGB
			return locales.enUS
		} else if (locale.startsWith("de")) {
			if (locale == "de-at") return locales.deAT
			if (locale == "de-ch") return locales.deCH
			return locales.deDE
		}

		return locales.enUS
	}

	getFullLanguage(language: Language) {
		let languagesLocale = this.locale.misc.languages

		switch (language) {
			case Language.de:
				return languagesLocale.de
			default:
				return languagesLocale.en
		}
	}
}

/**
 * Picks the language tag to render in out of an Accept-Language header such as
 * "de-AT,de;q=0.9,en-US;q=0.8". Only the languages the app has locales for are
 * considered, so a visitor whose first choice is French still gets the English
 * interface rather than an arbitrary match.
 */
function preferredLanguageTag(header: string | null): string | null {
	if (header == null) return null

	const supported = ["de", "en"]

	const candidates = header
		.split(",")
		.map(part => {
			const [tag, ...parameters] = part.trim().split(";")
			const quality = parameters
				.map(parameter => parameter.trim())
				.find(parameter => parameter.startsWith("q="))

			return {
				tag: tag.trim().toLowerCase(),
				quality: quality == null ? 1 : Number(quality.slice(2))
			}
		})
		.filter(
			candidate =>
				candidate.tag.length > 0 &&
				Number.isFinite(candidate.quality) &&
				candidate.quality > 0 &&
				supported.includes(candidate.tag.slice(0, 2))
		)
		.sort((a, b) => b.quality - a.quality)

	return candidates[0]?.tag ?? null
}
