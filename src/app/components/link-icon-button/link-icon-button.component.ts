import { Component, Input, ChangeDetectionStrategy } from "@angular/core"
import { IconDefinition } from "@fortawesome/free-solid-svg-icons"

@Component({
	selector: "pocketlib-link-icon-button",
	templateUrl: "./link-icon-button.component.html",
	changeDetection: ChangeDetectionStrategy.Eager,
	standalone: false
})
export class LinkIconButtonComponent {
	@Input() icon: IconDefinition
	@Input() link: string = ""
}
