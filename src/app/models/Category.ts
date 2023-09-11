import { CategoryResource, Language } from "src/app/misc/types"
import { GetLanguageByString } from "src/app/misc/utils"
import { DataService } from "src/app/services/data-service"
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
		dataService: DataService,
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
				languages: await dataService.GetStoreLanguages()
			}
		)

		let responseData = response.data.retrieveCategory
		if (responseData == null) return null

		return new Category(responseData)
	}
}
