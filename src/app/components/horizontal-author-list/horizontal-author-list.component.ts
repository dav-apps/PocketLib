import { Component } from "@angular/core"
import { Router } from "@angular/router"
import { isSuccessStatusCode } from "dav-js"
import { DataService } from "src/app/services/data-service"
import { ApiService } from "src/app/services/api-service"
import { AuthorListItem, ApiResponse } from "src/app/misc/types"
import { enUS } from "src/locales/locales"

const maxVisibleAuthors = 8

@Component({
	selector: "pocketlib-horizontal-author-list",
	templateUrl: "./horizontal-author-list.component.html",
	styleUrls: ["./horizontal-author-list.component.scss"]
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

		let response = await this.apiService.listAuthors(
			`
				total
				items {
					uuid
					firstName
					lastName
					profileImage {
						url
						blurhash
					}
				}
			`,
			{
				limit: maxVisibleAuthors,
				latest: true
			}
		)

		let profileImageAltTemplate =
			this.dataService.GetLocale().misc.authorProfileImageAlt

		for (let author of response.data.listAuthors.items) {
			let authorItem = {
				uuid: author.uuid,
				firstName: author.firstName,
				lastName: author.lastName,
				profileImageContent: null,
				profileImageBlurhash: author.profileImage?.blurhash,
				profileImageAlt: profileImageAltTemplate.replace(
					"{0}",
					`${author.firstName} ${author.lastName}`
				)
			}

			if (author.profileImage?.url != null) {
				this.apiService
					.downloadFile(author.profileImage.url)
					.then((fileResponse: ApiResponse<string>) => {
						if (isSuccessStatusCode(fileResponse.status)) {
							authorItem.profileImageContent = (
								fileResponse as ApiResponse<string>
							).data
						}
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
