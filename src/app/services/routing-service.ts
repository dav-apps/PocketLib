import { Injectable } from '@angular/core';
import { Router, ActivatedRoute, NavigationEnd } from '@angular/router';
import { DataService } from './data-service';

@Injectable()
export class RoutingService{
	private history: string[] = [];
	public showsStore: boolean = false;

	constructor(
		private dataService: DataService,
		private router: Router,
		private activatedRoute: ActivatedRoute
	){
		// Log the user in if there is a jwt in the url
      this.activatedRoute.queryParams.subscribe(async params => {
			if (params["jwt"]) {
            // Login with the jwt
            if(await this.dataService.user.Login(params["jwt"])){
               window.location.href = this.router.url.slice(0, this.router.url.indexOf('?'));
            }
         }
		});

		this.router.events.subscribe(event => {
			if(event instanceof NavigationEnd){
				this.showsStore = event.url.startsWith('/store');	
				this.history.push(event.url);
			}
		});
	}

	NavigateBack(alternativeRoute: string){
		// Remove the current url
		this.history.pop();
		
		// Navigate to the last url or the alternative route
		if(this.history.length > 0){
			this.router.navigateByUrl(this.history.pop());
		}else{
			this.router.navigateByUrl(alternativeRoute);
		}
	}
}