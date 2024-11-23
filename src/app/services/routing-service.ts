import { Injectable } from "@angular/core"
import { Router, ActivatedRoute, NavigationEnd } from "@angular/router"
import { DataService } from "./data-service"
import { Route } from "src/app/misc/types"

@Injectable()
export class RoutingService {
	private history: Route[] = []
	public showsStore: boolean = false
	public toolbarNavigationEvent: Function

	constructor(
		private dataService: DataService,
		private router: Router,
		private activatedRoute: ActivatedRoute
	) {
		this.router.events.subscribe(event => {
			if (event instanceof NavigationEnd) {
				this.addUrlToHistory(event.url)

				if (this.showsStore && this.dataService.updateInstalled) {
					window.location.reload()
				}
			}
		})
	}

	NavigateBack(alternativeRoute: string) {
		// Remove the current route
		this.history.pop()

		// Navigate to the last url or the alternative route
		if (this.history.length > 0) {
			let historyItem = this.history.pop()
			this.router.navigateByUrl(historyItem.fullUrl ?? historyItem.url)
		} else {
			this.router.navigateByUrl(alternativeRoute)
		}
	}

	GetLastVisitedRoute(alternativeRoute: string): Route {
		if (this.history.length > 1) {
			// Return the second-last route in the history
			return this.history[this.history.length - 2]
		} else {
			return {
				url: alternativeRoute,
				params: {}
			}
		}
	}

	NavigateToLibraryPage() {
		this.navigateToPage(["/"])
	}

	NavigateToAuthorPage() {
		this.navigateToPage(["author"])
	}

	NavigateToStorePage() {
		this.navigateToPage(["store"])
	}

	NavigateToUserPage() {
		this.navigateToPage(["user"])
	}

	NavigateToSettingsPage() {
		this.navigateToPage(["settings"])
	}

	private addUrlToHistory(url: string) {
		let cuttedUrl = url.includes("?")
			? url.substring(0, url.indexOf("?"))
			: url
		this.showsStore = cuttedUrl.startsWith("/store")

		this.history.push({
			url: cuttedUrl,
			fullUrl: url,
			params: this.activatedRoute.snapshot.queryParams
		})
	}

	private async navigateToPage(route: string[]) {
		if (this.toolbarNavigationEvent) {
			if (await this.toolbarNavigationEvent()) this.router.navigate(route)
		} else {
			this.router.navigate(route)
		}
	}
}
