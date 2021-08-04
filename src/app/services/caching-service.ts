import { Injectable } from '@angular/core'
import { ApiResponse } from 'dav-js'

@Injectable()
export class CachingService {
	private apiRequestCache: {
		[key: string]: ApiResponse<any>
	} = {}
	private blurhashImageCache: {
		[key: string]: string
	} = {}

	//#region api request cache
	GetApiRequestCacheKey(functionName: string, params: object): string{
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

	ClearApiRequestCache(functionName: string) {
		for (let selectedKey of Object.keys(this.apiRequestCache).filter(key => key.startsWith(functionName))) {
			delete this.apiRequestCache[selectedKey]
		}
	}
	//#endregion

	//#region blurhash image cache
	GetBlurhashImageCacheKey(blurhash: string, width: number, height: number): string {
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