import { Injectable } from '@angular/core'

@Injectable()
export class CachingService {
	private blurhashImageCache: {
		[key: string]: string
	} = {}

	GetBlurhashImageCacheKey(blurhash: string, width: number, height: number) {
		return `${blurhash}:${width},${height}`
	}

	GetBlurhashImageCacheItem(key: string) {
		return this.blurhashImageCache[key]
	}

	SetBlurhashImageCacheItem(key: string, data: string) {
		this.blurhashImageCache[key] = data
	}
}