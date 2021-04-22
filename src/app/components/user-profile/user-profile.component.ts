import { Component, Input, Output, EventEmitter } from '@angular/core'
import { DataService } from 'src/app/services/data-service'
import { BytesToGigabytesText } from 'src/app/misc/utils'
import { enUS } from 'src/locales/locales'

@Component({
	selector: 'pocketlib-user-profile',
	templateUrl: './user-profile.component.html'
})
export class UserProfileComponent {
	locale = enUS.userProfile
	@Input() compact: boolean = false
	@Output() logoutClick = new EventEmitter()
	usedStoragePercent: number = 0
	usedStorageText: string = ""

	constructor(
		public dataService: DataService
	) {
		this.locale = this.dataService.GetLocale().userProfile
	}

	async ngOnInit() {
		await this.dataService.userPromiseHolder.AwaitResult()
		
		this.usedStoragePercent = (this.dataService.dav.user.UsedStorage / this.dataService.dav.user.TotalStorage) * 100
		this.usedStorageText = this.locale.storageUsed
			.replace("{0}", BytesToGigabytesText(this.dataService.dav.user.UsedStorage, 1))
			.replace("{1}", BytesToGigabytesText(this.dataService.dav.user.TotalStorage, 0))
	}

	LogoutClick() {
		this.logoutClick.emit()
	}
}