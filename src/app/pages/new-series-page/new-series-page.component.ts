import { Component } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import { DataService } from 'src/app/services/data-service'
import { RoutingService } from 'src/app/services/routing-service'
import { Author } from 'src/app/misc/types'
import { enUS } from 'src/locales/locales'

@Component({
	selector: 'pocketlib-new-series-page',
	templateUrl: './new-series-page.component.html'
})
export class NewSeriesPageComponent {
	//#region Navigation variables
	section: number = 0
	visibleSection: number = 0
	forwardNavigation: boolean = true
	//#endregion

	//#region General variables
	locale = enUS.newSeriesPage
	author: Author = {
		uuid: "",
		firstName: "",
		lastName: "",
		websiteUrl: null,
		facebookUsername: null,
		instagramUsername: null,
		twitterUsername: null,
		bios: [],
		collections: [],
		series: [],
		profileImage: false,
		profileImageBlurhash: null
	}
	//#endregion

	//#region Name
	name: string = ""
	submittedName: string = ""
	nameSubmitted: boolean = false
	//#endregion

	constructor(
		public dataService: DataService,
		private routingService: RoutingService,
		private activatedRoute: ActivatedRoute
	) {
		this.locale = this.dataService.GetLocale().newSeriesPage
	}

	async ngOnInit() {
		await this.dataService.userAuthorPromiseHolder.AwaitResult()

		// Get the author
		if (this.dataService.userIsAdmin) {
			// Get the uuid of the author from the url
			let authorUuid = this.activatedRoute.snapshot.queryParamMap.get("author")

			// Find the author with the uuid
			let author = this.dataService.adminAuthors.find(a => a.uuid == authorUuid)
			if (!author) {
				this.GoBack()
				return
			}

			this.author = author
		} else if (this.dataService.userAuthor) {
			// Get the current author
			this.author = this.dataService.userAuthor
		} else {
			// Go back, as the user it not an author and not an admin
			this.GoBack()
			return
		}
	}

	GoBack() {
		this.routingService.NavigateBack("/author")
	}

	SubmitName(name: string) {
		this.name = name

		this.Next()

		this.submittedName = this.name
		this.nameSubmitted = true
	}

	Previous() {
		this.NavigateToSection(this.section - 1)
	}

	Next() {
		this.NavigateToSection(this.section + 1)
	}

	NavigateToSection(index: number) {
		this.forwardNavigation = index > this.section
		this.section = index

		setTimeout(() => {
			this.visibleSection = index
		}, 500)
	}

	Finish() {
		
	}
}