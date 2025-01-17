import {
	Component,
	HostListener,
	NgZone,
	ViewChild,
	ElementRef
} from "@angular/core"
import { Router } from "@angular/router"
import { faBookmark as faBookmarkSolid } from "@fortawesome/free-solid-svg-icons"
import {
	faHouse as faHouseRegular,
	faBookmark as faBookmarkRegular,
	faFolderBookmark as faFolderBookmarkRegular
} from "@fortawesome/pro-regular-svg-icons"
import {
	faArrowLeft as faArrowLeftLight,
	faArrowRight as faArrowRightLight,
	faHouse as faHouseLight,
	faBookmark as faBookmarkLight,
	faFolderBookmark as faFolderBookmarkLight
} from "@fortawesome/pro-light-svg-icons"
import { BottomSheet } from "dav-ui-components"
import { DataService } from "src/app/services/data-service"
import { LocalizationService } from "src/app/services/localization-service"
import { PdfBook } from "src/app/models/PdfBook"

const progressFactor = 100000
const currentViewerZIndex = -2
const nextPageViewerZIndex = -3
const previousPageViewerZIndex = -1
const touchStart = "touchstart"
const touchMove = "touchmove"
const touchEnd = "touchend"
const click = "click"
const firstViewerId = "first-viewer"
const secondViewerId = "second-viewer"
const thirdViewerId = "third-viewer"
const firstViewerLeftId = "first-viewer-left"
const defaultViewerTransitionTime = 500
const navigationDoubleTapAreaWidth = 50
const doubleTapToleranceTime = 400

@Component({
	selector: "pocketlib-pdf-viewer",
	templateUrl: "./pdf-viewer.component.html",
	styleUrl: "./pdf-viewer.component.scss",
	standalone: false
})
export class PdfViewerComponent {
	locale = this.localizationService.locale.pdfViewer
	faArrowLeftLight = faArrowLeftLight
	faArrowRightLight = faArrowRightLight
	faHouseRegular = faHouseRegular
	faHouseLight = faHouseLight
	faBookmarkSolid = faBookmarkSolid
	faBookmarkRegular = faBookmarkRegular
	faBookmarkLight = faBookmarkLight
	faFolderBookmarkRegular = faFolderBookmarkRegular
	faFolderBookmarkLight = faFolderBookmarkLight

	pdfContent: Uint8Array = null
	currentBook: PdfBook
	currentPage: number = 1
	totalPages: number = 0
	isLoaded: boolean = false
	initialized: boolean = false
	showSecondPage: boolean = false
	firstPage: boolean = false // If true, hides the previous button
	lastPage: boolean = false // If true, hides the next button
	isMobile: boolean = false // Is true on small devices with width < 600 px

	viewerRatio: number = 0
	viewerWidth: number = 500
	width: number = 500 // The width of the entire window
	height: number = 500 // The height of the entire window

	firstViewer: Viewer = {
		page: 1, // The currently displayed page
		zIndex: -1, // The z-index of the viewer; -1, -2 or -3
		positionLeft: 0, // How much the viewer is moved to the right
		transitionTime: defaultViewerTransitionTime // The time for the transition animation
	}

	secondViewer: Viewer = {
		page: 1,
		zIndex: -1,
		positionLeft: 0,
		transitionTime: defaultViewerTransitionTime
	}

	thirdViewer: Viewer = {
		page: 1,
		zIndex: -1,
		positionLeft: 0,
		transitionTime: defaultViewerTransitionTime
	}

	currentViewer: CurrentViewer = CurrentViewer.First // Shows which viewer is currently visible
	showPageRunning: boolean = false // If true, ShowPage is currently executing

	//#region Variables for touch events
	swipeDirection: SwipeDirection = SwipeDirection.None // Whether the user swipes vertically or horizontally
	swipeStart: boolean = false
	touchStartX: number = 0
	touchStartY: number = 0
	touchDiffX: number = 0
	touchDiffY: number = 0
	touchMoveCount: number = 0
	doubleTapTimerRunning: boolean = false
	//#endregion

	//#region Variables for progress bar
	totalProgress: number = 0 // The current progress in percent between 0 and 1
	//#endregion

	//#region Variables for Booksmarks panel
	currentPageBookmark: boolean = false
	showBookmarksPanel: boolean = false
	//#endregion

	//#region Variables for the bottom sheet
	@ViewChild("bottomSheet", { static: true })
	bottomSheet: ElementRef<BottomSheet>
	@ViewChild("bottomSheetBookmarksContainer", { static: false })
	bottomSheetBookmarksContainer: ElementRef<HTMLDivElement>
	bottomSheetVisible: boolean = false
	bottomSheetPosition: number = 0
	bottomSheetStartPosition: number = 0
	bottomSheetContainerHeight: number = 0
	//#endregion

	//#region Global event listeners
	keydownEventListener = (event: KeyboardEvent) => this.onKeyDown(event)
	mouseWheelEventListener = (event: WheelEvent) => this.onMouseWheel(event)
	//#endregion

	constructor(
		private dataService: DataService,
		private localizationService: LocalizationService,
		private router: Router,
		private ngZone: NgZone
	) {}

	async ngOnInit() {
		this.currentBook = this.dataService.currentBook as PdfBook
		this.setSize()

		// Read the book blob as UInt8Array
		let readPromise: Promise<ProgressEvent> = new Promise(resolve => {
			let fileReader = new FileReader()
			fileReader.onload = resolve
			fileReader.readAsArrayBuffer(this.dataService.currentBook.file)
		})
		this.pdfContent = (await readPromise).target["result"]

		// Set the zoom
		this.UpdateZoom(this.currentBook.zoom)

		// Bind the keydown and wheel events
		document.addEventListener("keydown", this.keydownEventListener)
		document.addEventListener("wheel", this.mouseWheelEventListener)

		// Bind the touch events
		document
			.getElementById(firstViewerId)
			.addEventListener(touchStart, (e: TouchEvent) =>
				this.ngZone.run(() => this.HandleTouch(e))
			)
		document
			.getElementById(secondViewerId)
			.addEventListener(touchStart, (e: TouchEvent) =>
				this.ngZone.run(() => this.HandleTouch(e))
			)
		document
			.getElementById(thirdViewerId)
			.addEventListener(touchStart, (e: TouchEvent) =>
				this.ngZone.run(() => this.HandleTouch(e))
			)
		document
			.getElementById(firstViewerId)
			.addEventListener(touchMove, (e: TouchEvent) =>
				this.ngZone.run(() => this.HandleTouch(e))
			)
		document
			.getElementById(secondViewerId)
			.addEventListener(touchMove, (e: TouchEvent) =>
				this.ngZone.run(() => this.HandleTouch(e))
			)
		document
			.getElementById(thirdViewerId)
			.addEventListener(touchMove, (e: TouchEvent) =>
				this.ngZone.run(() => this.HandleTouch(e))
			)
		document
			.getElementById(firstViewerId)
			.addEventListener(touchEnd, (e: TouchEvent) =>
				this.ngZone.run(() => this.HandleTouch(e))
			)
		document
			.getElementById(secondViewerId)
			.addEventListener(touchEnd, (e: TouchEvent) =>
				this.ngZone.run(() => this.HandleTouch(e))
			)
		document
			.getElementById(thirdViewerId)
			.addEventListener(touchEnd, (e: TouchEvent) =>
				this.ngZone.run(() => this.HandleTouch(e))
			)

		// Bind the click event
		document
			.getElementById(firstViewerId)
			.addEventListener(click, (e: MouseEvent) =>
				this.ngZone.run(() => this.HandleClick(e))
			)
		document
			.getElementById(secondViewerId)
			.addEventListener(click, (e: MouseEvent) =>
				this.ngZone.run(() => this.HandleClick(e))
			)
		document
			.getElementById(thirdViewerId)
			.addEventListener(click, (e: MouseEvent) =>
				this.ngZone.run(() => this.HandleClick(e))
			)

		if (this.isMobile) {
			// Show the BottomSheet
			this.bottomSheetVisible = true
		}
	}

	ngOnDestroy() {
		// Remove the event listeners for the document
		document.removeEventListener("keydown", this.keydownEventListener)
		document.removeEventListener("wheel", this.mouseWheelEventListener)
	}

	@HostListener("window:resize")
	async setSize() {
		this.width = window.innerWidth
		this.height = window.innerHeight
		this.setViewerSize()

		this.isMobile = this.width < 600
		this.bottomSheetVisible = this.initialized && this.isMobile
		this.showSecondPage = this.viewerWidth * 2 < this.width

		if (
			this.showSecondPage &&
			this.currentPage > 0 &&
			this.currentPage % 2 == 0
		)
			this.currentPage--

		if (this.initialized) {
			await this.ShowPage(NavigationDirection.None, this.currentPage)
		}
	}

	setViewerSize() {
		if (!this.initialized) return

		// width = height * viewerRadio
		let newWidth = this.height * this.viewerRatio
		if (newWidth > this.width) {
			this.viewerWidth = this.width
		} else {
			this.viewerWidth = newWidth - 10
		}
	}

	async PrevPage() {
		if (this.firstPage || this.showPageRunning) return

		this.showPageRunning = true
		await this.ShowPage(
			NavigationDirection.Back,
			this.currentPage - (this.showSecondPage ? 2 : 1)
		)
	}

	async NextPage() {
		if (this.showPageRunning) return

		if (this.lastPage) {
			// Reset the progress
			await this.currentBook.SetPage(1)
			await this.dataService.settings.SetBook("", 0, 0)

			// Go back to the library page
			this.router.navigate(["/"])
			return
		}

		this.showPageRunning = true
		await this.ShowPage(
			NavigationDirection.Forward,
			this.currentPage + (this.showSecondPage ? 2 : 1)
		)
	}

	/**
	 * The order of the viewers at the beginning:
	 *  _____    _____----|
	 * |     |  |     | 2.|
	 * |  3. |  |  1. |   |
	 * |_____|  |_____|---|
	 *
	 * When going to the next page, move the viewers clockwise (1 -> 3, 3 -> 2, 2 -> 1):
	 *
	 *  _____    _____----|
	 * |     |  |     | 3.|
	 * |  1. |  |  2. |   |
	 * |_____|  |_____|---|
	 *
	 * When going to the previous page, move the viewers counterclockwise (1 -> 2, 2 -> 3, 3 -> 1):
	 *
	 *  _____    _____----|
	 * |     |  |     | 1.|
	 * |  2. |  |  3. |   |
	 * |_____|  |_____|---|
	 *
	 * @param direction Specifies the direction of the navigation
	 * @param newPage The page that is shown after the navigation
	 */
	async ShowPage(
		direction: NavigationDirection = NavigationDirection.None,
		newPage: number
	) {
		// direction == Forward ?
		// 	Move 1 -> 3, 3 -> 2 and 2 -> 1
		// 	viewer 2 is now the currently visible viewer
		// 	Update the page of viewer 3
		// direction == back ?
		// 	Move 1 -> 2, 2 -> 3 and 3 -> 1
		// 	viewer 3 is now the currently visible viewer
		// 	Update the page of viewer 2
		// direction == None ?
		// 	Update the pages
		// 	Update the position and z-index of the viewers

		if (direction == NavigationDirection.Forward) {
			// Move to the next viewer
			await this.MoveViewersForward()

			// Update the pages
			this.UpdatePages(newPage)
		} else if (direction == NavigationDirection.Back) {
			// Move to the previous viewer
			await this.MoveViewersBackward()

			// Update the pages
			this.UpdatePages(newPage)
		} else {
			// Update the pages
			this.UpdatePages(newPage)

			// Update the positions of the viewers
			this.SetLeftOfCurrentViewer(0)
			this.SetLeftOfNextViewer(0)
			this.SetLeftOfPreviousViewer(-this.width)

			// Update the z-index of the viewers
			this.SetZIndexOfCurrentViewer(currentViewerZIndex)
			this.SetZIndexOfNextViewer(nextPageViewerZIndex)
			this.SetZIndexOfPreviousViewer(previousPageViewerZIndex)
		}

		// Set currentPageBookmarked
		if (this.showSecondPage) {
			this.currentPageBookmark =
				this.currentBook.bookmarks.includes(this.currentPage) ||
				this.currentBook.bookmarks.includes(this.currentPage + 1)
		} else {
			this.currentPageBookmark = this.currentBook.bookmarks.includes(
				this.currentPage
			)
		}

		this.showPageRunning = false

		// Save the new progress
		await this.currentBook.SetPage(this.currentPage)
		await this.dataService.settings.SetBook(
			this.currentBook.uuid,
			null,
			this.currentPage
		)

		// Save the new total progress
		this.totalProgress = this.currentBook.page / this.totalPages
		await this.currentBook.SetTotalProgress(
			Math.ceil(this.totalProgress * 100 * progressFactor)
		)
	}

	async MoveViewersForward() {
		// Set the transition times
		this.SetTransitionTimeOfCurrentViewer(defaultViewerTransitionTime)
		this.SetTransitionTimeOfNextViewer(0)
		this.SetTransitionTimeOfPreviousViewer(0)

		// Set the position of the viewers
		this.SetLeftOfCurrentViewer(-this.width)
		this.SetLeftOfNextViewer(0)
		this.SetLeftOfPreviousViewer(0)

		// Set the z-index of the viewers
		this.SetZIndexOfCurrentViewer(previousPageViewerZIndex)
		this.SetZIndexOfNextViewer(currentViewerZIndex)
		this.SetZIndexOfPreviousViewer(nextPageViewerZIndex)

		// Update currentViewer
		switch (this.currentViewer) {
			case CurrentViewer.First:
				this.currentViewer = CurrentViewer.Second
				break
			case CurrentViewer.Second:
				this.currentViewer = CurrentViewer.Third
				break
			case CurrentViewer.Third:
				this.currentViewer = CurrentViewer.First
				break
		}

		await new Promise(resolve =>
			setTimeout(resolve, defaultViewerTransitionTime)
		)

		// Reset the transition times
		this.SetTransitionTimeOfCurrentViewer(defaultViewerTransitionTime)
		this.SetTransitionTimeOfNextViewer(defaultViewerTransitionTime)
		this.SetTransitionTimeOfPreviousViewer(defaultViewerTransitionTime)
	}

	async MoveViewersBackward() {
		// Set the transition times
		this.SetTransitionTimeOfCurrentViewer(0)
		this.SetTransitionTimeOfNextViewer(0)
		this.SetTransitionTimeOfPreviousViewer(defaultViewerTransitionTime)

		// Set the position of the viewers
		this.SetLeftOfCurrentViewer(0)
		this.SetLeftOfNextViewer(-this.width)
		this.SetLeftOfPreviousViewer(0)

		// Set the z-index of the viewers
		this.SetZIndexOfCurrentViewer(nextPageViewerZIndex)
		this.SetZIndexOfNextViewer(previousPageViewerZIndex)
		this.SetZIndexOfPreviousViewer(currentViewerZIndex)

		// Update currentViewer
		switch (this.currentViewer) {
			case CurrentViewer.First:
				this.currentViewer = CurrentViewer.Third
				break
			case CurrentViewer.Second:
				this.currentViewer = CurrentViewer.First
				break
			case CurrentViewer.Third:
				this.currentViewer = CurrentViewer.Second
				break
		}

		await new Promise(resolve =>
			setTimeout(resolve, defaultViewerTransitionTime)
		)

		// Reset the transition times
		this.SetTransitionTimeOfCurrentViewer(defaultViewerTransitionTime)
		this.SetTransitionTimeOfNextViewer(defaultViewerTransitionTime)
		this.SetTransitionTimeOfPreviousViewer(defaultViewerTransitionTime)
	}

	UpdatePages(newPage: number) {
		this.currentPage = newPage

		// Update firstPage and lastPage
		this.firstPage = this.currentPage <= 1
		this.lastPage = this.currentPage >= this.totalPages

		// Update the viewers
		let pageDiff = this.showSecondPage ? 2 : 1

		this.SetPageOfCurrentViewer(this.currentPage)

		if (this.lastPage) {
			this.SetPageOfNextViewer(0)
		} else {
			this.SetPageOfNextViewer(this.currentPage + pageDiff)
		}

		this.SetPageOfPreviousViewer(this.currentPage - pageDiff)
	}

	GoHome() {
		this.router.navigate(["/"])
	}

	PdfLoaded(data: any) {
		this.totalPages = data.numPages
	}

	PageRendered(e: CustomEvent) {
		if (this.initialized) return
		this.initialized = true

		let pdfViewer = document.getElementById(firstViewerLeftId)
		let pdfViewerHeightString = getComputedStyle(pdfViewer).height
		let pdfViewerWidthString = getComputedStyle(pdfViewer).width

		let pdfViewerHeight = +pdfViewerHeightString.replace("px", "")
		let pdfViewerWidth = +pdfViewerWidthString.replace("px", "")

		this.viewerRatio = pdfViewerWidth / pdfViewerHeight

		this.currentPage = this.currentBook.page
		this.setSize()
		this.ShowPage(NavigationDirection.None, this.currentBook.page)
	}

	onKeyDown(event: KeyboardEvent) {
		switch (event.code) {
			case "Backspace": // Back key
				this.ngZone.run(() => this.GoHome())
				break
			case "ArrowLeft": // Left arrow key
				this.ngZone.run(() => this.PrevPage())
				break
			case "ArrowRight": // Right arrow key
				this.ngZone.run(() => this.NextPage())
				break
		}
	}

	onMouseWheel(event: WheelEvent) {
		if (event.deltaY > 0) {
			// Wheel down
			this.ngZone.run(() => this.NextPage())
		} else {
			// Wheel up
			this.ngZone.run(() => this.PrevPage())
		}
	}

	HandleTouch(event: TouchEvent) {
		if (event.touches.length > 1 || window["visualViewport"].scale > 1.001) {
			return
		}

		let bottomSheetTouch = this.bottomSheet.nativeElement.contains(
			event.target as Node
		)

		if (event.type == touchStart) {
			let touch = event.touches.item(0)
			this.touchStartX = touch.screenX
			this.touchStartY = touch.screenY
			this.touchMoveCount = 0
			this.swipeDirection = SwipeDirection.None
			this.swipeStart = true
			this.bottomSheetStartPosition = this.bottomSheet.nativeElement.position

			this.firstViewer.transitionTime = 0
			this.secondViewer.transitionTime = 0
			this.thirdViewer.transitionTime = 0
		} else if (event.type == touchMove) {
			// Calculate the difference between the positions of the first touch and the current touch
			let touch = event.touches.item(0)

			this.touchDiffX = this.touchStartX - touch.screenX
			this.touchDiffY = this.touchStartY - touch.screenY
			this.touchMoveCount++

			if (this.swipeStart) {
				// Check if the user is swiping up or down
				this.swipeDirection =
					Math.abs(this.touchDiffX) > Math.abs(this.touchDiffY)
						? SwipeDirection.Horizontal
						: SwipeDirection.Vertical

				// Disable navigating through pages when touching the BottomSheet
				if (
					this.swipeDirection == SwipeDirection.Horizontal &&
					bottomSheetTouch
				) {
					return
				}

				this.swipeStart = false
			} else if (this.swipeDirection == SwipeDirection.Horizontal) {
				// Move the pages
				if (this.touchDiffX > 0) {
					// Swipe to the left; move the current viewer to the left
					this.SetLeftOfCurrentViewer(-this.touchDiffX)
				} else if (!this.firstPage) {
					// Swipe to the right; move the left viewer to the right
					this.SetLeftOfPreviousViewer(-this.width - this.touchDiffX)
				}
			} else if (
				this.swipeDirection == SwipeDirection.Vertical &&
				this.bottomSheetVisible
			) {
				// Set the new position of the bottom sheet
				this.bottomSheetPosition =
					this.touchDiffY + this.bottomSheetStartPosition
			}
		} else if (event.type == touchEnd) {
			// Reset the transition times
			this.firstViewer.transitionTime = defaultViewerTransitionTime
			this.secondViewer.transitionTime = defaultViewerTransitionTime
			this.thirdViewer.transitionTime = defaultViewerTransitionTime

			if (
				this.swipeDirection == SwipeDirection.Horizontal &&
				!bottomSheetTouch
			) {
				if (this.touchDiffX > 0) {
					// If the page was swiped wide enough, show the next page
					if (this.touchDiffX > this.width * 0.15) {
						this.NextPage()
					} else {
						// Move the page back
						this.SetLeftOfCurrentViewer(0)
					}
				} else if (!this.firstPage) {
					// If the page was swiped wide enough, show the previous page
					if (-this.touchDiffX > this.width * 0.2) {
						this.PrevPage()
					} else {
						this.SetLeftOfPreviousViewer(-this.width)
					}
				}
			}

			// Don't snap the bottom sheet on touch without swipe
			if (this.touchMoveCount > 0) {
				this.bottomSheet.nativeElement.snap()
			}

			this.touchStartX = 0
			this.touchStartY = 0
			this.touchDiffX = 0
			this.touchDiffY = 0
			this.touchMoveCount = 0
			this.bottomSheetStartPosition = 0
		}
	}

	HandleClick(event: MouseEvent) {
		let clickedOnLeftEdge = event.pageX < navigationDoubleTapAreaWidth
		let clickedOnRightEdge =
			this.width - navigationDoubleTapAreaWidth < event.pageX

		// Double tap
		if (clickedOnLeftEdge || clickedOnRightEdge) {
			if (!this.doubleTapTimerRunning) {
				// Start the timer for double tap detection
				this.doubleTapTimerRunning = true

				setTimeout(() => {
					this.doubleTapTimerRunning = false
				}, doubleTapToleranceTime)
			} else {
				// Double tap occured, go to the previous or next page
				this.doubleTapTimerRunning = false

				// Reset the transition viewer times
				this.firstViewer.transitionTime = defaultViewerTransitionTime
				this.secondViewer.transitionTime = defaultViewerTransitionTime
				this.thirdViewer.transitionTime = defaultViewerTransitionTime

				if (clickedOnRightEdge) {
					this.NextPage()
				} else if (clickedOnLeftEdge) {
					this.PrevPage()
				}
			}
		}
	}

	BottomSheetSnapBottom() {
		setTimeout(() => {
			this.showBookmarksPanel = false
			this.bottomSheetContainerHeight = 0
		}, 200)
	}

	ShowBookmarksPanel() {
		this.showBookmarksPanel = true

		if (this.isMobile) {
			setTimeout(() => {
				this.bottomSheetContainerHeight =
					this.bottomSheetBookmarksContainer.nativeElement.clientHeight

				setTimeout(() => {
					this.bottomSheet.nativeElement.snap("top")
				}, 100)
			}, 1)
		}
	}

	async AddOrRemoveBookmark() {
		if (this.showPageRunning) return
		let removeBookmark: boolean = false

		if (this.showSecondPage) {
			removeBookmark =
				this.currentBook.bookmarks.includes(this.currentPage) ||
				this.currentBook.bookmarks.includes(this.currentPage + 1)
		} else {
			removeBookmark = this.currentBook.bookmarks.includes(this.currentPage)
		}

		if (removeBookmark && this.showSecondPage) {
			await this.currentBook.RemoveBookmarks(
				this.currentPage,
				this.currentPage + 1
			)
		} else if (removeBookmark) {
			await this.currentBook.RemoveBookmark(this.currentPage)
		} else {
			this.currentBook.AddBookmark(this.currentPage)
		}

		this.currentPageBookmark = !removeBookmark
	}

	NavigateToPage(page: number) {
		this.showBookmarksPanel = false
		this.ShowPage(NavigationDirection.None, page)

		return false
	}

	UpdateZoom(zoom: number) {
		// Set the transform scale of the first divs of the pdf-viewers
		let pdfViewer = document.getElementsByTagName("pdf-viewer")

		for (let i = 0; i < pdfViewer.length; i++) {
			let viewer = pdfViewer.item(i)
			let viewerDiv = viewer.getElementsByTagName("div")[0]
			if (!viewerDiv) continue

			viewerDiv.setAttribute(
				"style",
				`overflow: hidden; transform: scale(${zoom});`
			)
		}

		// Update the zoom in the database
		this.currentBook.SetZoom(zoom)
	}

	SetPageOfCurrentViewer(page: number) {
		switch (this.currentViewer) {
			case CurrentViewer.First:
				this.firstViewer.page = page
				break
			case CurrentViewer.Second:
				this.secondViewer.page = page
				break
			case CurrentViewer.Third:
				this.thirdViewer.page = page
				break
		}
	}

	SetPageOfNextViewer(page: number) {
		switch (this.currentViewer) {
			case CurrentViewer.First:
				this.secondViewer.page = page
				break
			case CurrentViewer.Second:
				this.thirdViewer.page = page
				break
			case CurrentViewer.Third:
				this.firstViewer.page = page
				break
		}
	}

	SetPageOfPreviousViewer(page: number) {
		switch (this.currentViewer) {
			case CurrentViewer.First:
				this.thirdViewer.page = page
				break
			case CurrentViewer.Second:
				this.firstViewer.page = page
				break
			case CurrentViewer.Third:
				this.secondViewer.page = page
				break
		}
	}

	SetLeftOfCurrentViewer(left: number) {
		switch (this.currentViewer) {
			case CurrentViewer.First:
				this.firstViewer.positionLeft = left
				break
			case CurrentViewer.Second:
				this.secondViewer.positionLeft = left
				break
			case CurrentViewer.Third:
				this.thirdViewer.positionLeft = left
				break
		}
	}

	SetLeftOfNextViewer(left: number) {
		switch (this.currentViewer) {
			case CurrentViewer.First:
				this.secondViewer.positionLeft = left
				break
			case CurrentViewer.Second:
				this.thirdViewer.positionLeft = left
				break
			case CurrentViewer.Third:
				this.firstViewer.positionLeft = left
				break
		}
	}

	SetLeftOfPreviousViewer(left: number) {
		switch (this.currentViewer) {
			case CurrentViewer.First:
				this.thirdViewer.positionLeft = left
				break
			case CurrentViewer.Second:
				this.firstViewer.positionLeft = left
				break
			case CurrentViewer.Third:
				this.secondViewer.positionLeft = left
				break
		}
	}

	SetZIndexOfCurrentViewer(zIndex: number) {
		switch (this.currentViewer) {
			case CurrentViewer.First:
				this.firstViewer.zIndex = zIndex
				break
			case CurrentViewer.Second:
				this.secondViewer.zIndex = zIndex
				break
			case CurrentViewer.Third:
				this.thirdViewer.zIndex = zIndex
				break
		}
	}

	SetZIndexOfNextViewer(zIndex: number) {
		switch (this.currentViewer) {
			case CurrentViewer.First:
				this.secondViewer.zIndex = zIndex
				break
			case CurrentViewer.Second:
				this.thirdViewer.zIndex = zIndex
				break
			case CurrentViewer.Third:
				this.firstViewer.zIndex = zIndex
				break
		}
	}

	SetZIndexOfPreviousViewer(zIndex: number) {
		switch (this.currentViewer) {
			case CurrentViewer.First:
				this.thirdViewer.zIndex = zIndex
				break
			case CurrentViewer.Second:
				this.firstViewer.zIndex = zIndex
				break
			case CurrentViewer.Third:
				this.secondViewer.zIndex = zIndex
				break
		}
	}

	SetTransitionTimeOfCurrentViewer(transitionTime: number) {
		switch (this.currentViewer) {
			case CurrentViewer.First:
				this.firstViewer.transitionTime = transitionTime
				break
			case CurrentViewer.Second:
				this.secondViewer.transitionTime = transitionTime
				break
			case CurrentViewer.Third:
				this.thirdViewer.transitionTime = transitionTime
				break
		}
	}

	SetTransitionTimeOfNextViewer(transitionTime: number) {
		switch (this.currentViewer) {
			case CurrentViewer.First:
				this.secondViewer.transitionTime = transitionTime
				break
			case CurrentViewer.Second:
				this.thirdViewer.transitionTime = transitionTime
				break
			case CurrentViewer.Third:
				this.firstViewer.transitionTime = transitionTime
				break
		}
	}

	SetTransitionTimeOfPreviousViewer(transitionTime: number) {
		switch (this.currentViewer) {
			case CurrentViewer.First:
				this.thirdViewer.transitionTime = transitionTime
				break
			case CurrentViewer.Second:
				this.firstViewer.transitionTime = transitionTime
				break
			case CurrentViewer.Third:
				this.secondViewer.transitionTime = transitionTime
				break
		}
	}
}

interface Viewer {
	page: number
	positionLeft: number
	zIndex: number
	transitionTime: number
}

enum CurrentViewer {
	First = 1,
	Second = 2,
	Third = 3
}

enum SwipeDirection {
	None,
	Horizontal,
	Vertical
}

enum NavigationDirection {
	Forward,
	Back,
	None
}
