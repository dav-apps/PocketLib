import {
	Component,
	Input,
	Output,
	EventEmitter,
	SimpleChange,
	SimpleChanges
} from "@angular/core"
import { EpubBook } from "src/app/models/EpubBook"
import { PdfBook } from "src/app/models/PdfBook"
import { DataService } from "src/app/services/data-service"
import { LocalizationService } from "src/app/services/localization-service"

@Component({
	selector: "pocketlib-library-page-book-card",
	templateUrl: "./library-page-book-card.component.html",
	styleUrl: "./library-page-book-card.component.scss",
	standalone: false
})
export class LibraryPageBookCardComponent {
	@Input() book: EpubBook | PdfBook = new EpubBook(null, null, true, null)
	@Input() width: number = 180
	@Output() click = new EventEmitter()
	@Output() contextMenu = new EventEmitter()
	cover: string = ""
	alt: string = ""
	showDefaultCover: boolean = false

	constructor(
		public dataService: DataService,
		private localizationService: LocalizationService
	) {}

	ngOnInit() {
		this.Init()
	}

	ngOnChanges(changes: SimpleChanges) {
		// Call Init if the book has changed
		let change: SimpleChange
		if (changes.book) change = changes.book
		if (change == null || change.previousValue == null) return

		this.Init()
	}

	Init() {
		if (this.book instanceof EpubBook && this.book.cover != null) {
			this.cover = this.book.cover
			this.showDefaultCover = false
		} else {
			this.cover = this.dataService.defaultStoreBookCover
			this.showDefaultCover = true
		}

		this.alt = this.localizationService.locale.misc.bookCoverAlt.replace(
			"{0}",
			this.book.title
		)
	}

	ContextMenu(event: MouseEvent) {
		this.contextMenu.emit(event)
		return false
	}
}
