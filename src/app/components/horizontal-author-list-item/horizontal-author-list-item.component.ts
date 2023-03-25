import { Component, Input } from "@angular/core"
import { AuthorListItem } from "src/app/misc/types"
import { DataService } from "src/app/services/data-service"

@Component({
	selector: "pocketlib-horizontal-author-list-item",
	templateUrl: "./horizontal-author-list-item.component.html",
	styleUrls: ["./horizontal-author-list-item.component.scss"]
})
export class HorizontalAuthorListItemComponent {
	@Input() author: AuthorListItem = {
		uuid: "",
		firstName: "",
		lastName: "",
		profileImageContent: null,
		profileImageBlurhash: null,
		profileImageAlt: ""
	}

	constructor(public dataService: DataService) {}
}
