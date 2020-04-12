import { Component, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { IIconStyles } from 'office-ui-fabric-react';
import { ApiResponse } from 'dav-npm';
import { DataService, Author, FindAppropriateLanguage } from 'src/app/services/data-service';
import { ApiService } from 'src/app/services/api-service';
import { RoutingService } from 'src/app/services/routing-service';
import { EditPriceComponent } from 'src/app/components/edit-price/edit-price.component';

@Component({
	selector: 'pocketlib-new-book-page',
	templateUrl: './new-book-page.component.html'
})
export class NewBookPageComponent{
	author: Author = {
		uuid: "",
		firstName: "",
		lastName: "",
		bios: [],
		collections: [],
		profileImage: false
	}

	name: string = "";
	submittedName: string = "";
	nameSubmitted: boolean = false;

	collections: {
		uuid: string,
		name: string,
		cover: boolean,
		coverContent: string
	}[] = [];
	selectedCollection: number = -2;

	description: string = "";
	language: string = this.dataService.locale.startsWith("de") ? "de" : "en";

	selectedCategories: string[] = [];

	@ViewChild('editPrice', { static: true }) editPriceComponent: EditPriceComponent;
	price: number = 0;

	//#region Navigation variables
	section: number = 0;
	visibleSection: number = 0;
	forwardNavigation: boolean = true;
	//#endregion

	//#region Sample data variables
	sampleDataIndex: number = 0;
	nameSamples: string[] = [
		"Das winzigste Elflein",
		"Der Wasserkreislauf"
	]
	descriptionSamples: string[] = [
		"Dieses Buch beschreibt die Geschichte von einem klitzekleinen Männchen, das im Märchenwald herumläuft und allerlei entzückende Abenteuer erlebt.",
		"Nachdem die Wissenschaftler der ganzen Welt mit großem Zeitaufwand Ozeane erforscht, Regengüsse untersucht und verschiedene Trinkbrunnen intensiv angestarrt hatten, haben sie eine Theorie dazu entwickelt, wie sich das Wasser auf unserem Planeten verteilt; diese Theorie haben sie den \"Wasserkreislauf\" genannt. Der Wasserkreislauf besteht aus drei zentralen Erscheinungen - Verdunstung, Niederschlag und Abfluss -, und alle drei sind gleich langweilig."
	]
	//#endregion

	backButtonIconStyles: IIconStyles = {
		root: {
         fontSize: 18
		}
	}

	constructor(
		public dataService: DataService,
		private apiService: ApiService,
		private routingService: RoutingService,
		private activatedRoute: ActivatedRoute
	){
		this.sampleDataIndex = this.RandomInteger(0, this.nameSamples.length - 1);
	}

	async ngOnInit() {
		await this.dataService.userAuthorPromise;

		// Get the author
		if (this.dataService.userIsAdmin) {
			// Get the uuid of the author from the url
			let authorUuid = this.activatedRoute.snapshot.queryParamMap.get("author");

			// Find the author with the uuid
			let author = this.dataService.adminAuthors.find(a => a.uuid == authorUuid);
			if (!author) {
				this.GoBack();
				return;
			}

			this.author = author;
		} else if (this.dataService.userAuthor) {
			// Get the current author
			this.author = this.dataService.userAuthor;
		} else {
			// Go back, as the user it not an author and not an admin
			this.GoBack();
			return;
		}
		
		// Get the collections
		for (let collection of this.author.collections) {
			// Find the correct name
			let i = FindAppropriateLanguage(this.dataService.locale.slice(0, 2), collection.names);

			// Find a cover
			let cover: boolean = false;
			let coverContent: string = "";
			for (let book of collection.books) {
				if (book.cover) {
					cover = true;
					coverContent = book.coverContent;
					break;
				}
			}

			this.collections.push({
				uuid: collection.uuid,
				name: collection.names[i].name,
				cover,
				coverContent
			})
		}

		if (this.dataService.categories.length == 0) {
			// Get the categories
			let getCategoriesResponse: ApiResponse<any> = await this.apiService.GetCategories();

			// Get the names in the appropriate language	
			for (let category of getCategoriesResponse.data.categories) {
				let currentLanguageIndex = FindAppropriateLanguage(this.dataService.locale.slice(0, 2), category.names);
				let currentLanguage = category.names[currentLanguageIndex];

				this.dataService.categories.push({
					key: category.key,
					name: currentLanguage.name,
					language: currentLanguage.language
				});
			}

			this.dataService.categoriesPromiseResolve();
		}
	}

	GoBack(){
		this.routingService.NavigateBack("/author");
	}

	Previous(){
		this.NavigateToSection(this.section - 1);
	}

	Next(){
		this.NavigateToSection(this.section + 1);
	}

	NavigateToSection(index: number){
		this.forwardNavigation = index > this.section;

		this.section = index;

		setTimeout(() => {
			this.visibleSection = index;
		}, 500);
	}

	//#region Name functions
	SubmitName(){
		if(this.name.length >= 3){
			this.Next();

			this.submittedName = this.name;
			this.nameSubmitted = true;
		}
	}
	//#endregion

	//#region Collection functions
	SubmitCollection() {
		if (this.selectedCollection != -2) {
			this.Next();
		}
	}
	//#endregion

	//#region Description + Language functions
	SetLanguage(language: string){
		this.language = language;
	}

	SubmitDescription(){
		// TODO: Update the book with the description and language on the server
		this.Next();
	}
	//#endregion

	//#region Categories functions
	CategoryCheckboxSelected(event: {checked: boolean}, key: string) {
		if (event.checked) {
			// Add the category to the selected categories
			this.selectedCategories.push(key);
		} else {
			// Remove the category from the selected categories
			let i = this.selectedCategories.indexOf(key);
			if (i != -1) this.selectedCategories.splice(i, 1);
		}
	}

	SubmitCategories() {
		if (this.selectedCategories.length > 0) {
			this.Next();
		}
	}
	//#endregion

	//#region Price functions
	SetPrice(price: number) {
		this.price = price;

		// TODO: Update the price on the server + error handling


		this.editPriceComponent.SetPrice(price);
	}

	SubmitPrice() {
		
	}
	//#endregion

	RandomInteger(min, max) {
		return Math.floor(Math.random() * (max - min + 1)) + min;
	}
}