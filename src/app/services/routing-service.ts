import { Injectable } from '@angular/core'
import { Router, ActivatedRoute, NavigationEnd } from '@angular/router'
import { DataService } from './data-service'
import { Route } from 'src/app/misc/types'

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
		// Log the user in if there is an access token in the url
		this.activatedRoute.queryParams.subscribe(async params => {
			if (params["accessToken"]) {
				// Login with the access token
				await this.dataService.dav.Login(params["accessToken"])
				window.location.href = this.router.url.slice(0, this.router.url.indexOf('?'))
			}
		})

		this.router.events.subscribe(event => {
			if (event instanceof NavigationEnd) {
				let url = event.url.includes('?') ? event.url.substring(0, event.url.indexOf("?")) : event.url
				this.showsStore = url.startsWith('/store')
				
				this.history.push({
					url,
					fullUrl: event.url,
					params: this.activatedRoute.snapshot.queryParams
				})
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
		this.NavigateToPage(["/"])
	}

	NavigateToAuthorPage() {
		this.NavigateToPage(["author"])
	}

	NavigateToStorePage() {
		this.NavigateToPage(["store"])
	}

	NavigateToAccountPage() {
		this.NavigateToPage(["account"])
	}

	NavigateToSettingsPage() {
		this.NavigateToPage(["settings"])
	}

	private async NavigateToPage(route: string[]) {
		if (this.toolbarNavigationEvent) {
			if (await this.toolbarNavigationEvent()) this.router.navigate(route)
		} else {
			this.router.navigate(route)
		}
	}
}