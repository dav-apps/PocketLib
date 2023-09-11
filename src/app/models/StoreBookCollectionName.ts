import { Language, StoreBookCollectionNameResource } from "../misc/types"
import { GetLanguageByString } from "../misc/utils"
import { ApiService } from "../services/api-service"

export class StoreBookCollectionName {
	public uuid: string
	public name: string
	public language: Language

	constructor(nameResource: StoreBookCollectionNameResource) {
		if (nameResource != null) {
			if (nameResource.uuid != null) this.uuid = nameResource.uuid
			if (nameResource.name != null) this.name = nameResource.name
			if (nameResource.language != null)
				this.language = GetLanguageByString(nameResource.language)
		}
	}

	static async Retrieve(
		uuid: string,
		apiService: ApiService
	): Promise<StoreBookCollectionName> {
		let response = await apiService.retrieveStoreBookCollectionName(
			`
				uuid
				name
				language
			`,
			{ uuid }
		)

		let responseData = response.data.retrieveStoreBookCollectionName
		if (responseData == null) return null

		return new StoreBookCollectionName(responseData)
	}
}
