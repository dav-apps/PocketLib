import {
	Component,
	Input,
	ViewChild,
	ElementRef,
	SimpleChange,
	SimpleChanges
} from '@angular/core'
import { decode } from 'blurhash'
import { CachingService } from 'src/app/services/caching-service'

@Component({
	selector: 'pocketlib-blurhash-image',
	templateUrl: "./blurhash-image.component.html"
})
export class BlurhashImageComponent{
	@Input() src: string = ""
	@Input() fallback: string = ""
	@Input() blurhash: string = null
	@Input() title: string = ""
	@Input() alt: string = ""
	@Input() width: number = 0
	@Input() height: number = 0
	@Input() fillWidth: boolean = false			// If true, the entire width will be used by the image
	@Input() margin: string = ""
	@Input() shadowSm: boolean = false			// Show shadow-sm on the image
	@Input() shadow: boolean = false				// Show shadow on the image
	@Input() shadowOnHover: boolean = false	// Show shadow-sm on the image and shadow on the image on hover
	@Input() transform: string = ""				// The transform applied to the image
	@Input() rounded: boolean = false			// Show the image as a circle
	@Input() cursor: boolean = false
	@Input() loading: boolean = false			// Show the opacity on the image and the spinner if true
	@ViewChild('image', { static: true }) image: ElementRef<HTMLImageElement>

	classes: string[] = []
	hover: boolean = false

	constructor(
		private cachingService: CachingService
	) { }

	ngOnInit() {
		this.Init()
	}

	ngOnChanges(changes: SimpleChanges) {
		// Trigger Init if the src or the blurhash has changed
		let change: SimpleChange
		if (changes.src) change = changes.src
		if (changes.blurhash) change = changes.blurhash
		if (!change) return
		
		this.Init()
	}

	public Init() {
		this.classes = []
		if (this.shadowOnHover || this.cursor) this.classes.push("cursor")
		if (this.shadowSm || this.shadowOnHover) this.classes.push("shadow-sm")
		else if(this.shadow) this.classes.push("shadow")
		if (this.rounded) {
			this.classes.push("rounded-circle")
		} else {
			this.classes.push("rounded")
		}

		let fallbackSrc = this.fallback

		if (typeof this.width == "string") this.width = +this.width
		if (typeof this.height == "string") this.height = +this.height

		if (this.blurhash != null && this.blurhash.length >= 6) {
			let cacheKey = this.cachingService.GetBlurhashImageCacheKey(this.blurhash, this.width, this.height)
			let cacheItem = this.cachingService.GetBlurhashImageCacheItem(cacheKey)

			if (cacheItem != null) {
				fallbackSrc = cacheItem
			} else {
				// Generate the blurhash
				let canvas = document.createElement("canvas")
				canvas.width = this.width
				canvas.height = this.height

				if (canvas.getContext && Number.isFinite(this.width) && Number.isFinite(this.height)) {
					// Decode the blurhash and set the canvas
					let ctx = canvas.getContext('2d')
					let pixels = decode(this.blurhash, this.width, this.height)
					let imageData = ctx.createImageData(this.width, this.height)
					imageData.data.set(pixels)
					ctx.putImageData(imageData, 0, 0)

					//  Convert the canvas content to base64 url
					fallbackSrc = canvas.toDataURL()

					// Save the blurhash in the cache
					this.cachingService.SetBlurhashImageCacheItem(cacheKey, fallbackSrc)
				}
			}
		}

		// Show the fallback image or the blurhash, if there is one
		this.image.nativeElement.src = fallbackSrc

		if(this.src == null) return

		// Start loading the proper image
		let img = document.createElement("img")
		img.src = this.src
		img.onload = () => {
			// Show the proper image
			this.image.nativeElement.src = this.src

			if (this.fillWidth) {
				this.image.nativeElement.width = this.width
			}
		}
	}

	SetHover(hover: boolean) {
		if (!this.shadowOnHover) return

		if (hover) {
			this.AddShadow()
		} else {
			this.RemoveShadow()
		}
	}

	AddShadow() {
		// Remove shadow-sm
		let i = this.classes.indexOf("shadow-sm")
		if (i != -1) this.classes.splice(i, 1)
		
		// Add shadow
		this.classes.push('shadow')
	}

	RemoveShadow() {
		// Remove shadow
		let i = this.classes.indexOf("shadow")
		if (i != -1) this.classes.splice(i, 1)
		
		// Add shadow-sm
		this.classes.push('shadow-sm')
	}
}