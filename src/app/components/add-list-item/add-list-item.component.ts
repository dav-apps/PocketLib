import { Component, Input } from "@angular/core"
import { transition, trigger, state, style, animate } from "@angular/animations"
import { faPlus as faPlusLight } from "@fortawesome/pro-light-svg-icons"

@Component({
	selector: "pocketlib-add-list-item",
	templateUrl: "./add-list-item.component.html",
	styleUrls: ["./add-list-item.component.scss"],
	animations: [
		trigger("hover", [
			state(
				"false",
				style({
					transform: "rotateZ(0deg)",
					fontSize: "22px"
				})
			),
			state(
				"true",
				style({
					transform: "rotateZ(90deg)",
					fontSize: "28px"
				})
			),
			transition("true => false", [animate("0.18s ease-in")]),
			transition("false => true", [animate("0.18s ease-out")])
		])
	]
})
export class AddListItemComponent {
	@Input() link: string = ""
	@Input() linkParams = {}
	faPlusLight = faPlusLight
	hover: boolean = false
}
