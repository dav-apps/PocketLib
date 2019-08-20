import { Component } from "@angular/core";
declare var io: any;

@Component({
	selector: "pocketlib-new-app-page",
	templateUrl: "./new-app-page.component.html"
})
export class NewAppPageComponent{
	socket: any = null;
	name: string = "";
	url: string = "";

	ngOnInit(){
		this.socket = io();
	}

	nameChange(name: string){
		this.name = name;
	}

	urlChange(url: string){
		this.url = url;
	}

	createButtonClick(){
		this.socket.emit("message", "Hello World");
	}
}