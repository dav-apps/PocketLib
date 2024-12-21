import { CategoryResource, Language } from "src/app/misc/types"
import { GetLanguageByString } from "src/app/misc/utils"
import { ApiService } from "src/app/services/api-service"

export class Category {
	public uuid: string
	public key: string
	public name: {
		name: string
		language: Language
	}

	constructor(categoryResource: CategoryResource) {
		if (categoryResource != null) {
			if (categoryResource.uuid != null) this.uuid = categoryResource.uuid
			if (categoryResource.key != null) this.key = categoryResource.key
			this.name = {
				name: categoryResource.name?.name,
				language: GetLanguageByString(categoryResource.name?.language)
			}
		}
	}

	static async Retrieve(
		uuid: string,
		languages: Language[],
		apiService: ApiService
	): Promise<Category> {
		let response = await apiService.retrieveCategory(
			`
				uuid
				key
				name(languages: $languages) {
					name
					language
				}
			`,
			{
				uuid,
				languages
			}
		)

		let responseData = response.data.retrieveCategory
		if (responseData == null) return null

		return new Category(responseData)
	}
}
