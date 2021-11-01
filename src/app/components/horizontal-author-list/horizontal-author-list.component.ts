import { Component } from '@angular/core'
import { Router } from '@angular/router'
import { ApiResponse } from 'dav-js'
import { DataService } from 'src/app/services/data-service'
import { ApiService } from 'src/app/services/api-service'
import { AuthorListItem } from 'src/app/misc/types'
import { enUS } from 'src/locales/locales'

@Component({
	selector: 'pocketlib-horizontal-author-list',
	templateUrl: './horizontal-author-list.component.html'
})
export class HorizontalAuthorListComponent {
	locale = enUS.horizontalAuthorList
	authors: AuthorListItem[] = []
	loading: boolean = true

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
		let response = await this.apiService.GetLatestAuthors()
		if (response.status != 200) return
		let profileImageAltTemplate = this.dataService.GetLocale().misc.authorProfileImageAlt
		let responseData = (response as ApiResponse<any>).data

		for (let author of responseData.authors) {
			let authorItem = {
				uuid: author.uuid,
				firstName: author.first_name,
				lastName: author.last_name,
				profileImage: author.profile_image,
				profileImageContent: null,
				profileImageBlurhash: author.profile_image_blurhash,
				profileImageAlt: profileImageAltTemplate.replace('{0}', `${author.first_name} ${author.last_name}`)
			}

			if (authorItem.profileImage) {
				this.apiService.GetProfileImageOfAuthor({ uuid: author.uuid }).then((result: ApiResponse<string>) => {
					authorItem.profileImageContent = result.data
				})
			}

			this.authors.push(authorItem)
		}

		this.loading = false
	}

	NavigateToAuthor(uuid: string) {
		this.router.navigate(["store", "author", uuid])
	}
}