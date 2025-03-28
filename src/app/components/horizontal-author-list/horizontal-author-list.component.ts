import { Component, Input } from "@angular/core"
import { Router } from "@angular/router"
import { isSuccessStatusCode } from "dav-js"
import { DataService } from "src/app/services/data-service"
import { ApiService } from "src/app/services/api-service"
import { LocalizationService } from "src/app/services/localization-service"
import { AuthorListItem, ApiResponse } from "src/app/misc/types"

const maxVisibleAuthors = 8
type HorizontalAuthorListType = "latest" | "random"
type HorizontalAuthorListAlignment = "start" | "center"

@Component({
	selector: "pocketlib-horizontal-author-list",
	templateUrl: "./horizontal-author-list.component.html",
	styleUrl: "./horizontal-author-list.component.scss",
	standalone: false
})
export class HorizontalAuthorListComponent {
	@Input() type: HorizontalAuthorListType = "latest"
	@Input() headline: string = ""
	@Input() page: number = 1
	@Input() alignment: HorizontalAuthorListAlignment = "start"
	authors: AuthorListItem[] = []
	loading: boolean = true

	constructor(
		public dataService: DataService,
		private apiService: ApiService,
		private localizationService: LocalizationService,
		private router: Router
	) {}

	async ngOnInit() {
		await this.LoadAuthors(this.type == "random")
	}

	async LoadAuthors(random: boolean) {
		// Get the latest authors
		let page = this.page - 1
		if (page < 0) page = 0

		let response = await this.apiService.listAuthors(
			`
				items {
					uuid
					slug
					firstName
					lastName
					profileImage {
						url
						blurhash
					}
				}
			`,
			{
				random,
				limit: maxVisibleAuthors,
				offset: maxVisibleAuthors * page
			}
		)

		let responseData = response.data.listAuthors
		if (responseData == null) return

		this.authors = []

		let profileImageAltTemplate =
			this.localizationService.locale.misc.authorProfileImageAlt

		for (let author of responseData.items) {
			let authorItem: AuthorListItem = {
				uuid: author.uuid,
				slug: author.slug,
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
