import { Component } from '@angular/core'
import { Router } from '@angular/router'
import { ApiResponse } from 'dav-js'
import { DataService } from 'src/app/services/data-service'
import { ApiService } from 'src/app/services/api-service'
import { enUS } from 'src/locales/locales'

@Component({
	selector: 'pocketlib-horizontal-author-list',
	templateUrl: './horizontal-author-list.component.html'
})
export class HorizontalAuthorListComponent {
	locale = enUS.horizontalAuthorList
	authors: {
		uuid: string,
		firstName: string,
		lastName: string,
		profileImage: boolean,
		profileImageContent: string,
		profileImageBlurhash: string
	}[] = []

	constructor(
		public dataService: DataService,
		private apiService: ApiService,
		private router: Router
	) {
		this.locale = this.dataService.GetLocale().horizontalAuthorList
	}

	async ngOnInit() {
		// Get the latest authors
		this.authors = []
		let response: ApiResponse<any> = await this.apiService.GetLatestAuthors()
		if (response.status != 200) return

		for (let author of response.data.authors) {
			let authorItem = {
				uuid: author.uuid,
				firstName: author.first_name,
				lastName: author.last_name,
				profileImage: author.profile_image,
				profileImageContent: null,
				profileImageBlurhash: author.profile_image_blurhash
			}

			if (authorItem.profileImage) {
				this.apiService.GetProfileImageOfAuthor({ uuid: author.uuid }).then((result: ApiResponse<string>) => {
					authorItem.profileImageContent = result.data
				})
			}

			this.authors.push(authorItem)
		}
	}

	NavigateToAuthor(uuid: string) {
		this.router.navigate(["store", "author", uuid])
	}
}