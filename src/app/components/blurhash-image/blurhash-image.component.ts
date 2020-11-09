import {
	Component,
	Input,
	ViewChild,
	ElementRef,
	SimpleChange,
	SimpleChanges
} from '@angular/core'
import { decode } from 'blurhash'

@Component({
	selector: 'pocketlib-blurhash-image',
	templateUrl: "./blurhash-image.component.html"
})
export class BlurhashImageComponent{
	@Input() src: string = ""
	@Input() fallback: string = ""
	@Input() blurhash: string = null
	@Input() width: number = 0
	@Input() height: number = 0
	@Input() margin: string = ""
	@Input() shadow: boolean = false				// Show shadow-sm on the image
	@Input() shadowOnHover: boolean = false	// Show shadow-sm on the image and shadow on the image on hover
	@Input() rounded: boolean = false			// Show the image as a circle
	@Input() cursor: boolean = false
	@ViewChild('image', { static: true }) image: ElementRef<HTMLImageElement>

	classes: string[] = []
	hover: boolean = false

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
		if(this.shadow || this.shadowOnHover) this.classes.push("shadow-sm")
		if (this.rounded) this.classes.push("rounded-circle")

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

		if(this.src == null) return

		// Start loading the proper image
		let img = document.createElement("img")
		img.src = this.src
		img.onload = () => {
			// Show the proper image
			this.image.nativeElement.src = this.src
		}
	}

	SetHover(hover: boolean) {
		if (!this.shadowOnHover) return

		if (hover) {
			// Remove shadow-sm
			let i = this.classes.indexOf("shadow-sm")
			if (i != -1) this.classes.splice(i, 1)
			
			// Add shadow
			this.classes.push('shadow')
		} else {
			// Remove shadow
			let i = this.classes.indexOf("shadow")
			if (i != -1) this.classes.splice(i, 1)
			
			// Add shadow-sm
			this.classes.push('shadow-sm')
		}
	}
}