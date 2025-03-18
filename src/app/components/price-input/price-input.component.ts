import {
	Component,
	Input,
	Output,
	EventEmitter,
	Inject,
	PLATFORM_ID
} from "@angular/core"
import { isPlatformBrowser } from "@angular/common"
import {
	faFloppyDisk as faFloppyDiskLight,
	faPen as faPenLight
} from "@fortawesome/pro-light-svg-icons"
import { DataService } from "src/app/services/data-service"
import { LocalizationService } from "src/app/services/localization-service"
import { getLanguage } from "src/app/misc/utils"
import { Language } from "src/app/misc/types"

@Component({
	selector: "pocketlib-price-input",
	templateUrl: "./price-input.component.html",
	styleUrl: "./price-input.component.scss",
	standalone: false
})
export class PriceInputComponent {
	locale = this.localizationService.locale.priceInput
	faFloppyDiskLight = faFloppyDiskLight
	faPenLight = faPenLight
	price: string = "0"
	@Input() canEdit: boolean = false
	@Output() update = new EventEmitter()
	formattedPrice: string = this.locale.free
	edit: boolean
	errorMessage: string = ""

	constructor(
		public dataService: DataService,
		private localizationService: LocalizationService,
		@Inject(PLATFORM_ID) private platformId: object
	) {}

	ngOnInit() {
		this.UpdateFormattedPrice()
	}

	ShowEditPrice() {
		this.edit = true
	}

	UpdatePrice() {
		// Check if the price is valid
		if (+this.price < 0) {
			this.errorMessage = this.locale.errors.priceInvalid
			return
		}

		this.errorMessage = ""

		if (this.price == "") this.price = "0"
		this.update.emit(parseInt(this.price))
	}

	public SetPrice(price: number) {
		this.price = price.toString()
		this.UpdateFormattedPrice()
		this.edit = false
	}

	public SetError(error: string) {
		this.errorMessage = error
	}

	UpdateFormattedPrice() {
		let price = parseInt(this.price)

		if (price == 0) {
			this.formattedPrice = this.locale.free
		} else {
			this.formattedPrice = (price / 100).toFixed(2) + " €"

			if (getLanguage(isPlatformBrowser(this.platformId)) == Language.de) {
				this.formattedPrice = this.formattedPrice.replace(".", ",")
			}
		}
	}
}
