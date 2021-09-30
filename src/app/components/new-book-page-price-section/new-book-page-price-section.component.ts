import { Component, Input, Output, EventEmitter, ViewChild } from '@angular/core'
import { SpinnerSize } from 'office-ui-fabric-react'
import { DataService } from 'src/app/services/data-service'
import { PriceInputComponent } from 'src/app/components/price-input/price-input.component'
import { enUS } from 'src/locales/locales'

@Component({
	selector: 'pocketlib-new-book-page-price-section',
	templateUrl: './new-book-page-price-section.component.html'
})
export class NewBookPagePriceSectionComponent {
	locale = enUS.newBookPage
	@Input() loading: boolean = false
	@Input() section: number = 0
	@Input() visibleSection: number = 0
	@Input() forwardNavigation: boolean = false
	@Output() setPrice = new EventEmitter()
	@Output() previous = new EventEmitter()
	@Output() submit = new EventEmitter()
	@ViewChild('priceInput') priceInput: PriceInputComponent
	price: number = 0
	spinnerSize: SpinnerSize = SpinnerSize.small

	constructor(
		public dataService: DataService
	) {
		this.locale = this.dataService.GetLocale().newBookPage
	}

	SetPrice(price: number) {
		if (price < 0) price = -price

		this.price = price
		this.priceInput.SetPrice(price)
		this.setPrice.emit(price)
	}

	Previous() {
		this.previous.emit()
	}

	Submit() {
		this.submit.emit(this.price)
	}
}