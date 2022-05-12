import { Component, Input } from "@angular/core"

@Component({
	selector: "pocketlib-publisher-profile",
	templateUrl: "./publisher-profile.component.html"
})
export class PublisherProfileComponent {
	@Input() uuid: string
}