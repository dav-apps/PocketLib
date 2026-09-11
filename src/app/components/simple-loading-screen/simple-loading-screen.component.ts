import { Component, ChangeDetectionStrategy } from "@angular/core"

@Component({
	selector: "pocketlib-simple-loading-screen",
	templateUrl: "./simple-loading-screen.component.html",
	styleUrl: "./simple-loading-screen.component.scss",
	changeDetection: ChangeDetectionStrategy.Eager,
	standalone: false
})
export class SimpleLoadingScreenComponent {}
