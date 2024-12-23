import { Injectable } from "@angular/core"
import { DataService } from "src/app/services/data-service"
import * as locales from "src/locales/locales"
import { Language } from "../misc/types"

@Injectable()
export class LocalizationService {
	locale = locales.enUS

	constructor(private dataService: DataService) {
		this.locale = this.getLocale()
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
