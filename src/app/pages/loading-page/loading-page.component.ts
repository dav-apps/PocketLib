import { Component } from "@angular/core"
import { Router } from "@angular/router"
import { DataService } from "src/app/services/data-service"
import { GetBook } from "src/app/models/BookManager"
import { EpubBook } from "src/app/models/EpubBook"
import { PdfBook } from "src/app/models/PdfBook"

@Component({
	selector: "pocketlib-loading-page",
	template: "",
	standalone: false
})
export class LoadingPageComponent {
	height: number = 500
	dualScreenLayout: boolean = false

	constructor(private dataService: DataService, private router: Router) {
		this.dataService.navbarVisible = false
		this.dataService.loadingScreenVisible = true
	}

	async ngOnInit() {
		// Wait for the user to be loaded
		await this.dataService.userPromiseHolder.AwaitResult()

		await this.LoadSettings()
	}

	ngOnDestroy() {
		this.dataService.loadingScreenVisible = false
	}

	async LoadSettings() {
		// Wait for the settings to be loaded
		await this.dataService.settingsLoadPromiseHolder.AwaitResult()

		// Wait for the settings to be synced if the user is logged in
		if (this.dataService.dav.isLoggedIn) {
			await new Promise((resolve: Function) => {
				let resolved: boolean = false

				// Wait for the settings to be synced
				this.dataService.settingsSyncPromiseHolder
					.AwaitResult()
					.then(() => {
						if (!resolved) {
							resolved = true
							resolve()
						}
					})

				// Wait for max 8 seconds
				setTimeout(() => {
					if (!resolved) {
						resolved = true
						resolve()
					}
				}, 8000)
			})
		}

		// Show the book
		this.LoadCurrentBook()
	}

	async LoadCurrentBook() {
		// Load the current book
		this.dataService.currentBook = await GetBook(
			this.dataService.settings.book
		)

		// Check if the book exits and if the user can access the book
		if (
			!this.dataService.currentBook ||
			(this.dataService.currentBook.storeBook &&
				!this.dataService.dav.isLoggedIn)
		) {
			this.router.navigate(["/"])
			return
		}

		// Load the progress of the current book
		if (this.dataService.currentBook instanceof EpubBook) {
			this.dataService.currentBook.chapter =
				this.dataService.settings.chapter
			this.dataService.currentBook.progress =
				this.dataService.settings.progress
		} else if (this.dataService.currentBook instanceof PdfBook) {
			this.dataService.currentBook.page = this.dataService.settings.progress
		}

		// Go to the book page to show the current book
		this.router.navigate(["book"])
	}
}
