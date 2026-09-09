import { Component } from "@angular/core"
import { LocalizationService } from "src/app/services/localization-service"

/**
 * Shown wherever a url is valid in shape but resolves to nothing: an unknown
 * route, a book, author, publisher, category or series that does not exist.
 * The pages that use it keep their own url and ask DataService for a 404, so
 * the visitor sees this and a crawler is told to drop the url.
 */
@Component({
	selector: "pocketlib-not-found",
	templateUrl: "./not-found.component.html",
	styleUrl: "./not-found.component.scss",
	standalone: false
})
export class NotFoundComponent {
	locale = this.localizationService.locale.notFoundPage

	constructor(private localizationService: LocalizationService) {}
}
