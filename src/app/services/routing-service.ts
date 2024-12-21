import { Injectable } from "@angular/core"
import { Router } from "@angular/router"

@Injectable()
export class RoutingService {
	public toolbarNavigationEvent: Function

	constructor(private router: Router) {}

	navigateBack(alternativeRoute: string) {
		if (
			window.history.state == null ||
			window.history.state.navigationId == 1
		) {
			// Navigate to the alternative route
			this.router.navigateByUrl(alternativeRoute)
		} else {
			// Navigate back
			window.history.back()
		}
	}

	navigateToLibraryPage() {
		this.navigateToPage(["/"])
	}

	navigateToAuthorPage() {
		this.navigateToPage(["author"])
	}

	navigateToStorePage() {
		this.navigateToPage(["store"])
	}

	navigateToSearchPage() {
		this.navigateToPage(["search"])
	}

	navigateToUserPage() {
		this.navigateToPage(["user"])
	}

	navigateToSettingsPage() {
		this.navigateToPage(["settings"])
	}

	async navigateToPage(route: any[]) {
		if (this.toolbarNavigationEvent != null) {
			if (await this.toolbarNavigationEvent()) this.router.navigate(route)
		} else {
			this.router.navigate(route)
		}
	}
}
