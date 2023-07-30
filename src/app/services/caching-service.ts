import { Injectable } from "@angular/core"
import { PromiseHolder } from "dav-js"
import { ApiResponse } from "../misc/types"

@Injectable()
export class CachingService {
	private apiRequestCache: {
		[key: string]: ApiResponse<any>
	} = {}
	private apiRequests: {
		[key: string]: PromiseHolder<boolean>
	} = {}
	private blurhashImageCache: {
		[key: string]: string
	} = {}

	//#region api request cache
	GetApiRequestCacheKey(functionName: string, params: object): string {
		let apiRequestCacheKey = functionName

		for (let key of Object.keys(params)) {
			let value = params[key]
			apiRequestCacheKey += `,${key}:${value}`
		}

		return apiRequestCacheKey
	}

	GetApiRequestCacheItem(key: string): ApiResponse<any> {
		return this.apiRequestCache[key]
	}

	SetApiRequestCacheItem(key: string, data: ApiResponse<any>) {
		this.apiRequestCache[key] = data
	}

	ClearApiRequestCache(...functionNames: string[]) {
		for (let functionName of functionNames) {
			for (let selectedKey of Object.keys(this.apiRequestCache).filter(key =>
				key.startsWith(functionName)
			)) {
				delete this.apiRequestCache[selectedKey]
			}
		}
	}

	SetupApiRequest(key: string) {
		let promiseHolder = this.apiRequests[key]
		if (promiseHolder != null) return

		this.apiRequests[key] = new PromiseHolder()
	}

	GetApiRequest(key: string): PromiseHolder<boolean> {
		return this.apiRequests[key]
	}

	ResolveApiRequest(key: string, success: boolean) {
		let promiseHolder = this.apiRequests[key]
		if (promiseHolder == null) return

		// Resolve the PromiseHolder and remove it from the object
		promiseHolder.Resolve(success)
		delete this.apiRequests[key]
	}
	//#endregion

	//#region blurhash image cache
	GetBlurhashImageCacheKey(
		blurhash: string,
		width: number,
		height: number
	): string {
		return `${blurhash}:${width},${height}`
	}

	GetBlurhashImageCacheItem(key: string): string {
		return this.blurhashImageCache[key]
	}

	SetBlurhashImageCacheItem(key: string, data: string) {
		this.blurhashImageCache[key] = data
	}
	//#endregion
}
