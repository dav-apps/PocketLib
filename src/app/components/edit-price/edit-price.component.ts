import { Component, Input, Output, EventEmitter } from '@angular/core';
import { DataService } from 'src/app/services/data-service';
import { enUS } from 'src/locales/locales';

@Component({
	selector: 'pocketlib-edit-price',
	templateUrl: './edit-price.component.html'
})
export class EditPriceComponent{
	locale = enUS.editPrice;
	price: string = "0";
	@Input() canEdit: boolean = false;
	@Output() update = new EventEmitter();
	formattedPrice: string = this.locale.free;
	edit: boolean;
	errorMessage: string = "";

	constructor(
		public dataService: DataService
	) {
		this.locale = this.dataService.GetLocale().editPrice;
	}

	ngOnInit() {
		this.UpdateFormattedPrice();
	}

	UpdatePrice() {
		this.errorMessage = "";
		
		if (this.price == "") this.price = "0";
		this.update.emit(parseInt(this.price));
	}

	public SetPrice(price: number) {
		this.price = price.toString();
		this.UpdateFormattedPrice();
		this.edit = false;
	}

	public SetError(error: string) {
		this.errorMessage = error;
	}

	UpdateFormattedPrice() {
		let price = parseInt(this.price);

		if (price == 0) {
			this.formattedPrice = this.locale.free;
		} else {
			this.formattedPrice = (price / 100).toFixed(2) + " €";

			if (this.dataService.locale.slice(0, 2) == "de") {
				this.formattedPrice = this.formattedPrice.replace('.', ',');
			}
		}
	}
}