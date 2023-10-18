import { Component, Input } from "@angular/core"
import { Router } from "@angular/router"
import { isSuccessStatusCode } from "dav-js"
import { DataService } from "src/app/services/data-service"
import { ApiService } from "src/app/services/api-service"
import { AuthorListItem, ApiResponse } from "src/app/misc/types"

const maxVisibleAuthors = 8
type HorizontalAuthorListType = "latest" | "random"
type HorizontalAuthorListAlignment = "start" | "center"

@Component({
	selector: "pocketlib-horizontal-author-list",
	templateUrl: "./horizontal-author-list.component.html",
	styleUrls: ["./horizontal-author-list.component.scss"]
})
export class HorizontalAuthorListComponent {
	@Input() type: HorizontalAuthorListType = "latest"
	@Input() headline: string = ""
	@Input() alignment: HorizontalAuthorListAlignment = "start"
	authors: AuthorListItem[] = []
	loading: boolean = true

	constructor(
		public dataService: DataService,
		private apiService: ApiService,
		private router: Router
	) {}

	async ngOnInit() {
		await this.LoadAuthors(this.type == "random")
	}

	async LoadAuthors(random: boolean) {
		// Get the latest authors
		let response = await this.apiService.listAuthors(
			`
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
				random,
				limit: maxVisibleAuthors
			}
		)

		let responseData = response.data.listAuthors
		if (responseData == null) return

		this.authors = []

		let profileImageAltTemplate =
			this.dataService.GetLocale().misc.authorProfileImageAlt

		for (let author of responseData.items) {
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
