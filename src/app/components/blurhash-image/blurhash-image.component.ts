import { Component, Input, ViewChild, ElementRef } from '@angular/core'
import { decode } from 'blurhash'

@Component({
	selector: 'pocketlib-blurhash-image',
	templateUrl: "./blurhash-image.component.html"
})
export class BlurhashImageComponent{
	@Input() width: number = 0
	@Input() height: number = 0
	@Input() src: string = ""
	@Input() fallback: string = ""
	@Input() blurhash: string = ""
	@ViewChild('image', { static: true }) image: ElementRef<HTMLImageElement>

	ngOnInit() {
		let fallbackSrc = this.fallback
		let canvas = document.createElement("canvas")
		canvas.width = this.width
		canvas.height = this.height

		if (canvas.getContext && this.blurhash != null) {
			// Decode the blurhash and set the canvas
			let ctx = canvas.getContext('2d')
			let pixels = decode(this.blurhash, this.width, this.height)
			let imageData = ctx.createImageData(this.width, this.height)
			imageData.data.set(pixels)
			ctx.putImageData(imageData, 0, 0)

			//  Convert the canvas content to base64 url
			fallbackSrc = canvas.toDataURL()
		}

		// Show the fallback image or the blurhash, if there is one
		this.image.nativeElement.src = fallbackSrc

		// Start loading the proper image
		let img = document.createElement("img")
		img.src = this.src
		img.onload = () => {
			// Show the proper image
			this.image.nativeElement.src = this.src
		}
	}
}