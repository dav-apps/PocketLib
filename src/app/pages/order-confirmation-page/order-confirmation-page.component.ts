import { Component } from "@angular/core"
import { confetti } from "@tsparticles/confetti"

@Component({
	templateUrl: "./order-confirmation-page.component.html",
	styleUrl: "./order-confirmation-page.component.scss"
})
export class OrderConfirmationPageComponent {
	ngOnInit() {
		confetti({})
	}
}
