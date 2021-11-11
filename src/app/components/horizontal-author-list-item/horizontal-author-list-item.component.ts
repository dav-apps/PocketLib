import { Component, Input, ViewChild } from '@angular/core'
import { AuthorListItem } from 'src/app/misc/types'
import { DataService } from 'src/app/services/data-service'
import { BlurhashImageComponent } from '../blurhash-image/blurhash-image.component'

@Component({
	selector: 'pocketlib-horizontal-author-list-item',
	templateUrl: './horizontal-author-list-item.component.html'
})
export class HorizontalAuthorListItemComponent {
	@Input() author: AuthorListItem = {
		uuid: "",
		firstName: "",
		lastName: "",
		profileImage: false,
		profileImageContent: null,
		profileImageBlurhash: null,
		profileImageAlt: ""
	}
	@ViewChild('blurhashImage', { static: true }) blurhashImage: BlurhashImageComponent
	hovered: boolean = false

	constructor(
		public dataService: DataService
	) { }

	ShowImageShadow() {
		this.hovered = true
		this.blurhashImage.AddShadow()
	}

	HideImageShadow() {
		this.hovered = false
		this.blurhashImage.RemoveShadow()
	}
}