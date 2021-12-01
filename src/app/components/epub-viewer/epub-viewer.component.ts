import { Component, HostListener, NgZone, ViewChild } from '@angular/core'
import { Router } from '@angular/router'
import { PromiseHolder } from 'dav-js'
import { DataService } from 'src/app/services/data-service'
import { ChaptersTreeComponent } from '../chapters-tree/chapters-tree.component'
import { EpubBook } from 'src/app/models/EpubBook'
import { EpubBookmark } from 'src/app/models/EpubBookmark'
import { EpubReader, EpubTocItem } from 'src/app/models/EpubReader'
import {
	FindPositionsInHtmlElement,
	FindPageBreakPositions,
	FindPositionById,
	FindPageForPosition,
	AdaptLinkTag
} from 'src/app/misc/utils'
import { enUS } from 'src/locales/locales'
import { GetDualScreenSettings } from 'src/app/misc/utils'

const secondPageMinWidth = 1050		// Show two pages on the window if the window width is greater than this
const progressFactor = 100000			// The factor which is used to save the progress
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
const firstViewerRightId = "first-viewer-right"
const secondViewerLeftId = "second-viewer-left"
const secondViewerRightId = "second-viewer-right"
const thirdViewerLeftId = "third-viewer-left"
const thirdViewerRightId = "third-viewer-right"
const bottomToolbarMarginBottomOpened = 0
const bottomToolbarMarginBottomClosed = -40
const defaultViewerTransitionTime = 500
const defaultBottomToolbarTransitionTime = 200
const navigationDoubleTapAreaWidth = 50
const doubleTapToleranceTime = 400

@Component({
	selector: 'pocketlib-epub-viewer',
	templateUrl: './epub-viewer.component.html',
	styleUrls: ['./epub-viewer.component.scss']
})
export class EpubViewerComponent {
	locale = enUS.epubViewer
	book = new EpubReader()
	currentBook: EpubBook
	chapters: BookChapter[] = []
	initialized: boolean = false

	width: number = 500				// The width of the entire window
	height: number = 500				// The height of the entire window
	viewerHeight: number = 500		// The height of the iframe (height - 7 - paddingTop)
	contentWidth: number = 500		// The width of the html content (width - 2 * paddingX)
	contentHeight: number = 500	// The height of the html content (height - 7 - paddingTop - paddingBottom)
	paddingX: number = 0
	paddingTop: number = 80
	paddingBottom: number = 60

	firstViewer: Viewer = {
		left: {
			iframe: null,
			chapter: -1,										// The html of the chapter that is currently rendered
			width: 500,
			height: 300
		},
		right: {
			iframe: null,
			chapter: -1,
			width: 500,
			height: 300
		},
		positionLeft: 0,										// How much the viewer is moved to the right
		zIndex: -1,												// -1, -2 or -3
		transitionTime: defaultViewerTransitionTime	// The time for the transition animation
	}
	secondViewer: Viewer = {
		left: {
			iframe: null,
			chapter: -1,
			width: 500,
			height: 300
		},
		right: {
			iframe: null,
			chapter: -1,
			width: 500,
			height: 300
		},
		positionLeft: 0,
		zIndex: -1,
		transitionTime: defaultViewerTransitionTime
	}
	thirdViewer: Viewer = {
		left: {
			iframe: null,
			chapter: -1,
			width: 500,
			height: 300
		},
		right: {
			iframe: null,
			chapter: -1,
			width: 500,
			height: 300
		},
		positionLeft: 0,
		zIndex: -1,
		transitionTime: defaultViewerTransitionTime
	}

	currentChapter: number = 0				// The current chapter index in this.chapters
	currentPage: number = 0					// The current page in the current chapter
	currentChapterTitle: string = ""		// The title of the current chapter

	firstPage: boolean = false		// If true, hides the previous button
	lastPage: boolean = false		// If true, hides the next button
	showSecondPage: boolean = false	// If true, the right viewers are visible
	dualScreenLayout: boolean = false	// If true, the app is displayed on a dual-screen like Surface Duo with a vertical fold
	progressRingVisible: boolean = false	// If true, the progress ring is visible
	currentViewer: CurrentViewer = CurrentViewer.First		// Shows which viewer is currently visible
	showPageRunning: boolean = false		// If true, ShowPage is currently executing
	isRenderingNextOrPrevPage: boolean = false		// If true, ShowPage is currently preparing the next and previous pages
	renderPrevPageAfterShowPage: boolean = false		// If true, the viewer will navigate to the previous page after ShowPage
	renderNextPageAfterShowPage: boolean = false		// If true, the viewer will navigate to the next page after ShowPage
	navigationHistory: { chapter: number, page: number }[] = []		// The history of visited pages; is used when clicking a link

	//#region Variables for touch events
	swipeDirection: SwipeDirection = SwipeDirection.None	// Whether the user swipes vertically or horizontally
	swipeStart: boolean = false
	showPageRunningWhenSwipeStarted: boolean = false		// Is set at the beginning of a touch. If true, showPage was running and the touch will be completely ignored
	touchStartX: number = 0
	touchStartY: number = 0
	touchDiffX: number = 0
	touchDiffY: number = 0
	touchStartBottomToolbarMarginBottom: number = -40		// The margin bottom of the bottom toolbar at the moment of the beginning of the swipe
	doubleTapTimerRunning: boolean = false
	//#endregion

	//#region Variables for the bottom toolbar
	showBottomToolbar: boolean = false			// Whether the bottom toolbar is visible
	bottomToolbarOpened: boolean = false		// Whether the bottom toolbar is opened or closed
	bottomToolbarMarginBottom: number = -40	// The margin bottom of the bottom toolbar
	bottomToolbarTransitionTime: number = defaultBottomToolbarTransitionTime
	//#endregion

	//#region Variables for the progress bar
	totalProgress: number = 0						// The current progress in percent between 0 and 1
	//#endregion

	//#region Variables for the chapters panel
	showChaptersPanel: boolean = false
	@ViewChild('chaptersTree', { static: true }) chapterTree: ChaptersTreeComponent
	//#endregion

	//#region Variables for bookmarks
	currentPageBookmark: string = null
	showBookmarksPanel: boolean = false
	//#endregion

	//#region Global event listeners
	keydownEventListener = (event: KeyboardEvent) => this.onKeyDown(event)
	mouseWheelEventListener = (event: WheelEvent) => this.onMouseWheel(event)
	//#endregion

	constructor(
		public dataService: DataService,
		private router: Router,
		private ngZone: NgZone
	) {
		this.locale = this.dataService.GetLocale().epubViewer
		this.setSize()
	}

	async ngOnInit() {
		this.currentBook = this.dataService.currentBook as EpubBook
		if (!this.dataService.currentBook) {
			// Navigate back to the library page
			this.router.navigate(['/'])
			return
		}

		// Initialize the html element variables
		this.firstViewer.left.iframe = document.getElementById(firstViewerLeftId) as HTMLIFrameElement
		this.firstViewer.right.iframe = document.getElementById(firstViewerRightId) as HTMLIFrameElement
		this.secondViewer.left.iframe = document.getElementById(secondViewerLeftId) as HTMLIFrameElement
		this.secondViewer.right.iframe = document.getElementById(secondViewerRightId) as HTMLIFrameElement
		this.thirdViewer.left.iframe = document.getElementById(thirdViewerLeftId) as HTMLIFrameElement
		this.thirdViewer.right.iframe = document.getElementById(thirdViewerRightId) as HTMLIFrameElement
		this.navigationHistory = []

		// Check if this is a dual-screen device with a vertical fold
		this.dualScreenLayout = GetDualScreenSettings().dualScreenLayout

		// Load the ebook
		if (
			!await this.book.Init(this.dataService.currentBook.file)
			|| !await this.book.LoadChapters()
		) return

		// Create a chapter for each chapter of the book
		this.chapters = []
		for (let i = 0; i < this.book.chapters.length; i++) {
			let bookChapter = this.book.chapters[i]

			this.chapters.push(
				new BookChapter({
					chapterIndex: i,
					filename: bookChapter.filePath
				})
			)
		}

		// Get the current chapter and progress of the book
		let chapter = this.currentBook.chapter
		let progress = this.currentBook.progress
		this.currentChapter = chapter
		this.currentViewer = CurrentViewer.First

		this.initialized = true
		this.showPageRunning = true
		await this.ShowPage(NavigationDirection.None, progress)
		this.SetProgressRingColor()

		this.chapterTree.Init(this.book.toc)

		await this.LoadChapterPercentages()
		this.CalculateTotalProgress(this.currentBook.progress)

		// Bind the keydown and wheel events
		document.addEventListener("keydown", this.keydownEventListener)
		document.addEventListener("wheel", this.mouseWheelEventListener)

		document.getElementById(firstViewerId).addEventListener(touchStart, (e: TouchEvent) => this.ngZone.run(() => this.HandleTouch(e)))
		document.getElementById(secondViewerId).addEventListener(touchStart, (e: TouchEvent) => this.ngZone.run(() => this.HandleTouch(e)))
		document.getElementById(thirdViewerId).addEventListener(touchStart, (e: TouchEvent) => this.ngZone.run(() => this.HandleTouch(e)))
		document.getElementById(firstViewerId).addEventListener(touchMove, (e: TouchEvent) => this.ngZone.run(() => this.HandleTouch(e)))
		document.getElementById(secondViewerId).addEventListener(touchMove, (e: TouchEvent) => this.ngZone.run(() => this.HandleTouch(e)))
		document.getElementById(thirdViewerId).addEventListener(touchMove, (e: TouchEvent) => this.ngZone.run(() => this.HandleTouch(e)))
		document.getElementById(firstViewerId).addEventListener(touchEnd, (e: TouchEvent) => this.ngZone.run(() => this.HandleTouch(e)))
		document.getElementById(secondViewerId).addEventListener(touchEnd, (e: TouchEvent) => this.ngZone.run(() => this.HandleTouch(e)))
		document.getElementById(thirdViewerId).addEventListener(touchEnd, (e: TouchEvent) => this.ngZone.run(() => this.HandleTouch(e)))

		// Bind the click event
		document.getElementById(firstViewerId).addEventListener(click, (e: MouseEvent) => this.ngZone.run(() => this.HandleClick(e)))
		document.getElementById(secondViewerId).addEventListener(click, (e: MouseEvent) => this.ngZone.run(() => this.HandleClick(e)))
		document.getElementById(thirdViewerId).addEventListener(click, (e: MouseEvent) => this.ngZone.run(() => this.HandleClick(e)))
	}

	ngOnDestroy() {
		// Remove the event listeners for the document
		document.removeEventListener("keydown", this.keydownEventListener)
		document.removeEventListener("wheel", this.mouseWheelEventListener)
	}

	async onKeyDown(event: KeyboardEvent) {
		if (this.showChaptersPanel) return

		switch (event.code) {
			case "Backspace":		// Back key
				this.ngZone.run(() => this.GoBack())
				break
			case "ArrowLeft":		// Left arrow key
				this.ngZone.run(() => this.PrevPage())
				break
			case "ArrowRight":	// Right arrow key
				this.ngZone.run(() => this.NextPage())
				break
		}
	}

	async onMouseWheel(event: WheelEvent) {
		if (this.showChaptersPanel) return

		if (event.deltaY > 0) {
			// Wheel down
			this.ngZone.run(() => this.NextPage())
		} else {
			// Wheel up
			this.ngZone.run(() => this.PrevPage())
		}
	}

	@HostListener('window:resize')
	async setSize() {
		this.width = window.innerWidth
		this.height = window.innerHeight
		this.viewerHeight = this.height - this.paddingTop
		this.contentHeight = this.viewerHeight - this.paddingBottom
		this.paddingX = Math.round(this.width * 0.1)

		this.showSecondPage = this.width > secondPageMinWidth
		this.showBottomToolbar = this.width < 500

		if (this.showSecondPage) {
			// Show both pages
			this.firstViewer.left.width = this.width / 2
			this.firstViewer.right.width = this.width / 2
			this.contentWidth = (this.width / 2) - 2 * this.paddingX
		} else {
			// Hide the second page
			this.firstViewer.left.width = this.width
			this.firstViewer.right.width = 0
			this.contentWidth = this.width - 2 * this.paddingX
		}

		if (this.initialized) {
			await this.ShowPage(NavigationDirection.None)
		}
	}

	async PrevPage() {
		if (this.firstPage) {
			return
		} else if (this.isRenderingNextOrPrevPage) {
			this.progressRingVisible = true
			this.renderPrevPageAfterShowPage = true
			this.renderNextPageAfterShowPage = false
			return
		} else if (this.showPageRunning) {
			return
		}
		this.showPageRunning = true

		if (
			(this.showSecondPage && this.currentPage <= 1)
			|| (!this.showSecondPage && this.currentPage <= 0)
		) {
			// Show the previous chapter
			if (this.currentChapter <= 0) return
			this.currentChapter--
			let chapter = this.chapters[this.currentChapter]

			this.currentPage = chapter.GetPageBreakPositions(this.contentWidth, this.contentHeight).length - 1
			if (this.showSecondPage && this.currentPage % 2 == 1) this.currentPage--
		} else if (this.showSecondPage) {
			// Go to the second previous page
			this.currentPage -= 2
		} else {
			// Show the previous page
			this.currentPage--
		}

		await this.ShowPage(NavigationDirection.Back)
		await this.HandleRenderPrevOrNextPageAfterShowPage()
	}

	async NextPage() {
		if (this.isRenderingNextOrPrevPage) {
			this.progressRingVisible = true
			this.renderPrevPageAfterShowPage = false
			this.renderNextPageAfterShowPage = true
			return
		} else if (this.showPageRunning) {
			return
		}
		this.showPageRunning = true

		// Check if this is the last chapter and the last page
		if (this.lastPage) {
			// Reset the progress
			await this.currentBook.SetPosition(0, 0)
			await this.dataService.settings.SetBook("", 0, 0)

			// Go back to the library page
			this.router.navigate(["/"])
			return
		}

		let chapter = this.chapters[this.currentChapter]
		let chapterPageBreakPositions = chapter.GetPageBreakPositions(this.contentWidth, this.contentHeight)

		if (
			(this.showSecondPage && this.currentPage >= chapterPageBreakPositions.length - 2)
			|| (!this.showSecondPage && this.currentPage >= chapterPageBreakPositions.length - 1)
		) {
			// Show the next chapter
			this.currentChapter++
			this.currentPage = 0
		} else if (this.showSecondPage) {
			// Go to the second next page
			this.currentPage += 2
		} else {
			// Show the next page
			this.currentPage++
		}

		await this.ShowPage(NavigationDirection.Forward)
		await this.HandleRenderPrevOrNextPageAfterShowPage()
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
	 * @param progress If not -1, uses the progress to calculate the current page
	 * @param elementId Finds the element with the id and jumps to the page with the element
	 */
	async ShowPage(
		direction: NavigationDirection = NavigationDirection.None,
		progress: number = -1,
		elementId: string = null
	) {
		// direction == Forward ?
			// Move 1 -> 3, 3 -> 2 and 2 -> 1
			// viewer 2 is now the currently visible viewer
			// Render the next page on viewer 3
		// direction == Back ?
			// Move 1 -> 2, 2 -> 3 and 3 -> 1
			// viewer 3 is now the currently visible viewer
			// Render the previous page on viewer 2
		// direction == None ?
			// Render the current page on viewer 2
			// Move to the next page without animation
			// Render the next page on viewer 3 and the previous page on viewer 1

		if (direction == NavigationDirection.Forward) {
			// Move the viewer positions
			await this.MoveViewersForward()
		} else if (direction == NavigationDirection.Back) {
			// Move the viewer positions
			await this.MoveViewersBackward()
		} else {
			// Render the current page on the next page viewer
			await this.RenderCurrentPage(ViewerPosition.Next, progress, elementId)

			// Set the event listeners
			this.SetEventListeners(ViewerPosition.Next)

			// Move the viewer positions
			await this.MoveViewersForward()
		}

		this.setFirstLastPage()
		this.LoadCurrentChapterTitle()
		let currentChapter = this.chapters[this.currentChapter]
		let currentChapterPageBreakPositions = currentChapter.GetPageBreakPositions(this.contentWidth, this.contentHeight)

		if (progress == -1) {
			// Calculate the new progress
			let currentPagePosition = currentChapterPageBreakPositions[this.currentPage]
			let lastPagePosition = currentChapterPageBreakPositions[currentChapterPageBreakPositions.length - 1]
			let newProgress = currentPagePosition / lastPagePosition

			if (isNaN(newProgress)) {
				newProgress = 0
			} else {
				newProgress = Math.ceil(newProgress * progressFactor)
			}

			// Save the new progress
			await this.currentBook.SetPosition(this.currentChapter, newProgress)
			await this.dataService.settings.SetBook(this.currentBook.uuid, this.currentChapter, newProgress)

			// Calculate the new total progress
			await this.currentBook.SetTotalProgress(Math.ceil(this.CalculateTotalProgress(newProgress)))
		}

		// Set currentPageBookmarked
		this.currentPageBookmark = null

		let lastPage: boolean = currentChapterPageBreakPositions.length - (this.showSecondPage ? 2 : 1) <= this.currentPage
		let currentPageProgress = this.GetProgressOfCurrentChapterPage(this.currentPage)
		let nextPageProgress = this.GetProgressOfCurrentChapterPage(this.currentPage + (this.showSecondPage ? 2 : 1))
		if (nextPageProgress == -1) nextPageProgress = 1 * progressFactor

		for (let bookmark of this.currentBook.bookmarks) {
			if (bookmark.chapter != this.currentChapter) continue

			if (
				(!lastPage && bookmark.progress > currentPageProgress && bookmark.progress < nextPageProgress)
				|| (lastPage && bookmark.progress >= currentPageProgress && bookmark.progress <= nextPageProgress)
			) {
				this.currentPageBookmark = bookmark.uuid
				break
			}
		}

		this.isRenderingNextOrPrevPage = true

		if (direction == NavigationDirection.Forward) {
			// Check if the next page is the last page
			if (this.lastPage) {
				this.ClearNextPage()
			} else {
				// Render the next page
				await this.RenderNextPage()

				// Set the event listeners for the next page
				this.SetEventListeners(ViewerPosition.Next)
			}
		} else if (direction == NavigationDirection.Back) {
			// Render the previous page
			await this.RenderPreviousPage()

			// Set the event listeners for the previous page
			this.SetEventListeners(ViewerPosition.Previous)
		} else {
			// Render the next and the previous page
			await this.RenderNextPage()
			await this.RenderPreviousPage()

			// Set the event listeners for the next and previous page
			this.SetEventListeners(ViewerPosition.Next)
			this.SetEventListeners(ViewerPosition.Previous)
		}

		this.isRenderingNextOrPrevPage = false
		this.progressRingVisible = false
		this.showPageRunning = false
	}

	async RenderNextPage() {
		let nextViewer = this.GetNextViewer()

		let nextPage = this.currentPage + 1
		if (this.showSecondPage) nextPage++

		let chapterNumber = this.currentChapter
		let chapter = await this.InitChapter(chapterNumber)
		if (!chapter) return

		// Render the chapter and generate chapter pages
		await this.RenderChapter(chapter, nextViewer.left)

		let chapterPageBreakPositions = chapter.GetPageBreakPositions(this.contentWidth, this.contentHeight)

		// Check if the next chapter should be rendered
		let renderNextChapter = nextPage >= chapterPageBreakPositions.length
		if (renderNextChapter && this.currentChapter >= this.chapters.length - 1) return

		if (renderNextChapter) {
			// Render the next chapter
			nextPage = 0
			chapterNumber = this.currentChapter + 1
			chapter = await this.InitChapter(chapterNumber)
			if (!chapter) return

			await this.RenderChapter(chapter, nextViewer.left)
			chapterPageBreakPositions = chapter.GetPageBreakPositions(this.contentWidth, this.contentHeight)
		} else {
			this.chapters[this.currentChapter] = chapter
		}

		if (this.showSecondPage && nextPage < chapterPageBreakPositions.length) {
			// Render the chapter on the second page
			await this.RenderChapter(chapter, nextViewer.right)
		}

		// Scroll the left viewer
		nextViewer.left.iframe.contentWindow.scrollTo(0, chapterPageBreakPositions[nextPage] + 2)
		if (this.showSecondPage && chapterPageBreakPositions[nextPage + 1]) {
			// Scroll the right viewer
			nextViewer.right.iframe.contentWindow.scrollTo(0, chapterPageBreakPositions[nextPage + 1] + 2)
		}

		// Update the height of the left viewer
		// height of iframe = difference between the position of the next page and the position of the current page
		let newViewerLeftHeight = (chapterPageBreakPositions[nextPage + 1] - chapterPageBreakPositions[nextPage])
		this.SetHeightOfNextViewer((newViewerLeftHeight < 0 || isNaN(newViewerLeftHeight)) ? this.viewerHeight - 8 : newViewerLeftHeight)

		// Update the height of the right viewer
		if (this.showSecondPage) {
			if (nextPage == chapterPageBreakPositions.length - 1) {
				// The last page is shown on the left page
				// Hide the right page
				this.SetHeightOfNextViewer(0, true)
			} else if (nextPage == chapterPageBreakPositions.length - 2) {
				// Ths last page is shown on the right page
				// Show the entire right page
				this.SetHeightOfNextViewer(this.viewerHeight - 8, true)
			} else {
				let newViewerRightHeight = (chapterPageBreakPositions[nextPage + 2] - chapterPageBreakPositions[nextPage + 1])
				this.SetHeightOfNextViewer((newViewerRightHeight < 0 || isNaN(newViewerRightHeight)) ? this.viewerHeight - 8 : newViewerRightHeight, true)
			}
		}
	}

	ClearNextPage() {
		let nextViewer = this.GetNextViewer()

		nextViewer.left.iframe.srcdoc = ""
		nextViewer.right.iframe.srcdoc = ""
	}

	async RenderPreviousPage() {
		let previousViewer = this.GetPreviousViewer()

		let previousPage = this.currentPage - 1
		if (this.showSecondPage) previousPage--

		let chapterNumber = this.currentChapter
		let chapter = await this.InitChapter(chapterNumber)
		if (!chapter) return

		// Render the chapter and generate chapter pages
		await this.RenderChapter(chapter, previousViewer.left)

		let chapterPageBreakPositions = chapter.GetPageBreakPositions(this.contentWidth, this.contentHeight)

		// Check if the previous chapter should be rendered
		let renderPreviousChapter = this.currentPage == 0
		if (renderPreviousChapter && this.currentChapter == 0) return

		if (renderPreviousChapter) {
			// Render the previous chapter
			chapterNumber = this.currentChapter - 1
			chapter = await this.InitChapter(chapterNumber)
			if (!chapter) return

			await this.RenderChapter(chapter, previousViewer.left)
			chapterPageBreakPositions = chapter.GetPageBreakPositions(this.contentWidth, this.contentHeight)

			// Update previousPage after generating pagePositions of the previous chapter
			previousPage = chapterPageBreakPositions.length - 1
			if (this.showSecondPage && previousPage % 2 == 1) previousPage--
		} else {
			this.chapters[this.currentChapter] = chapter
		}

		if (this.showSecondPage && previousPage < chapterPageBreakPositions.length) {
			// Render the chapter on the second page
			await this.RenderChapter(chapter, previousViewer.right)
		}

		// Scroll the left viewer
		previousViewer.left.iframe.contentWindow.scrollTo(0, chapterPageBreakPositions[previousPage] + 2)
		if (this.showSecondPage && chapterPageBreakPositions[previousPage + 1]) {
			// Scroll the right viewer
			previousViewer.right.iframe.contentWindow.scrollTo(0, chapterPageBreakPositions[previousPage + 1] + 2)
		}

		// Update the height of the left viewer
		// height of iframe = difference between the position of the next page and the position of the current page
		let newViewerLeftHeight = (chapterPageBreakPositions[previousPage + 1] - chapterPageBreakPositions[previousPage])
		this.SetHeightOfPreviousViewer((newViewerLeftHeight < 0 || isNaN(newViewerLeftHeight)) ? this.viewerHeight - 8 : newViewerLeftHeight)

		// Update the height of the right viewer
		if (this.showSecondPage) {
			if (previousPage == chapterPageBreakPositions.length - 1) {
				// The last page is shown on the left page
				// Hide the right page
				this.SetHeightOfPreviousViewer(0, true)
			} else if (previousPage == chapterPageBreakPositions.length - 2) {
				// Ths last page is shown on the right page
				// Show the entire right page
				this.SetHeightOfPreviousViewer(this.viewerHeight - 8, true)
			} else {
				let newViewerRightHeight = (chapterPageBreakPositions[previousPage + 2] - chapterPageBreakPositions[previousPage + 1])
				this.SetHeightOfPreviousViewer((newViewerRightHeight < 0 || isNaN(newViewerRightHeight)) ? this.viewerHeight - 8 : newViewerRightHeight, true)
			}
		}
	}

	async RenderCurrentPage(position: ViewerPosition, progress: number = -1, elementId: string = null) {
		let viewer = this.GetViewer(position)
		let chapterNumber = this.currentChapter
		let chapter = await this.InitChapter(chapterNumber)
		if (!chapter) return

		// Render the chapter
		await this.RenderChapter(chapter, viewer.left)

		// Get the page break positions
		let pageBreakPositions = chapter.GetPageBreakPositions(this.contentWidth, this.contentHeight)

		if (this.showSecondPage && this.currentPage < pageBreakPositions.length) {
			// Render the chapter on the second page
			await this.RenderChapter(chapter, viewer.right)
		}

		if (progress >= 0) {
			// Update the current page according to the progress
			let lastPosition = pageBreakPositions[pageBreakPositions.length - 1]
			let progressPercent = progress / progressFactor
			let progressPosition = lastPosition * progressPercent

			// Find the page of the position
			let page = FindPageForPosition(progressPosition, pageBreakPositions)
			if (page != -1) {
				// If it shows two pages and the tag is on the second page, set the current page to the previous page
				if (this.showSecondPage && page % 2 == 1) page -= 1
				this.currentPage = page
			}
		} else if (elementId) {
			// Find the position of the tag
			let position = FindPositionById(viewer.left.iframe.contentWindow.document.getElementsByTagName("body")[0] as HTMLBodyElement, elementId)

			if (position != -1) {
				// Find the page of the position
				let page = FindPageForPosition(position, pageBreakPositions)
				if (page != -1) {
					// If it shows two pages and the tag is on the second page, set the current page to the previous page
					if (this.showSecondPage && page % 2 == 1) page -= 1
					this.currentPage = page
				}
			}
		}

		// Scroll the left viewer
		viewer.left.iframe.contentWindow.scrollTo(0, pageBreakPositions[this.currentPage] + 2)
		if (this.showSecondPage && pageBreakPositions[this.currentPage + 1]) {
			// Scroll the right viewer
			viewer.right.iframe.contentWindow.scrollTo(0, pageBreakPositions[this.currentPage + 1] + 2)
		}

		// Update the height of the left viewer
		// height of iframe = difference between the position of the next page and the position of the current page
		let newViewerLeftHeight = (pageBreakPositions[this.currentPage + 1] - pageBreakPositions[this.currentPage])
		this.SetHeightOfViewer(position, (newViewerLeftHeight < 0 || isNaN(newViewerLeftHeight)) ? this.viewerHeight - 8 : newViewerLeftHeight)

		// Update the height of the right viewer
		if (this.showSecondPage) {
			if (this.currentPage == pageBreakPositions.length - 1) {
				// The last page is shown on the left page
				// Hide the right page
				this.SetHeightOfViewer(position, 0, true)
			} else if (this.currentPage == pageBreakPositions.length - 2) {
				// Ths last page is shown on the right page
				// Show the entire right page
				this.SetHeightOfViewer(position, this.viewerHeight - 8, true)
			} else {
				let newViewerRightHeight = (pageBreakPositions[this.currentPage + 2] - pageBreakPositions[this.currentPage + 1])
				this.SetHeightOfViewer(position, (newViewerRightHeight < 0 || isNaN(newViewerRightHeight)) ? this.viewerHeight - 8 : newViewerRightHeight, true)
			}
		}
	}

	async HandleRenderPrevOrNextPageAfterShowPage() {
		if (this.renderNextPageAfterShowPage) {
			this.renderNextPageAfterShowPage = false
			await this.NextPage()
		} else if (this.renderPrevPageAfterShowPage) {
			this.renderPrevPageAfterShowPage = false
			await this.PrevPage()
		}
	}

	HandleTouch(event: TouchEvent) {
		if (event.touches.length > 1 || window["visualViewport"].scale > 1.001) return

		if (event.type == touchStart) {
			let touch = event.touches.item(0)
			this.touchStartX = touch.screenX
			this.touchStartY = touch.screenY
			this.swipeDirection = SwipeDirection.None
			this.swipeStart = true
			this.showPageRunningWhenSwipeStarted = this.showPageRunning

			this.firstViewer.transitionTime = 0
			this.secondViewer.transitionTime = 0
			this.thirdViewer.transitionTime = 0
			this.bottomToolbarTransitionTime = 0
		} else if (event.type == touchMove) {
			// Calculate the difference between the positions of the first touch and the current touch
			let touch = event.touches.item(0)
			this.touchDiffX = this.touchStartX - touch.screenX
			this.touchDiffY = this.touchStartY - touch.screenY

			if (this.swipeStart) {
				// Check if the user is swiping up or down
				this.swipeDirection = Math.abs(this.touchDiffX) > Math.abs(this.touchDiffY) ? SwipeDirection.Horizontal : SwipeDirection.Vertical
				this.touchStartBottomToolbarMarginBottom = this.bottomToolbarMarginBottom

				this.swipeStart = false
			} else if (this.swipeDirection == SwipeDirection.Horizontal) {
				// Disable horizontal swiping until the next and previous pages are fully rendered
				if (this.showPageRunningWhenSwipeStarted) return

				// Move the pages
				if (this.touchDiffX > 0) {
					// Swipe to the left; move the current viewer to the left
					this.SetLeftOfCurrentViewer(-this.touchDiffX)
				} else if (!this.firstPage) {
					// Swipe to the right; move the left viewer to the right
					this.SetLeftOfPreviousViewer(-this.width - this.touchDiffX)
				}
			} else if (this.swipeDirection == SwipeDirection.Vertical && this.showBottomToolbar) {
				// Update the margin bottom of the bottom toolbar
				this.bottomToolbarMarginBottom = this.touchStartBottomToolbarMarginBottom + (this.touchDiffY / 2)

				// Make sure the bottom toolbar does not move outside its area
				if (this.bottomToolbarMarginBottom > bottomToolbarMarginBottomOpened) {
					this.bottomToolbarMarginBottom = bottomToolbarMarginBottomOpened
					this.bottomToolbarOpened = true
				} else if (this.bottomToolbarMarginBottom < bottomToolbarMarginBottomClosed) {
					this.bottomToolbarMarginBottom = bottomToolbarMarginBottomClosed
					this.bottomToolbarOpened = false
				}
			}
		} else if (event.type == touchEnd) {
			// Reset the transition times
			this.firstViewer.transitionTime = defaultViewerTransitionTime
			this.secondViewer.transitionTime = defaultViewerTransitionTime
			this.thirdViewer.transitionTime = defaultViewerTransitionTime
			this.bottomToolbarTransitionTime = defaultBottomToolbarTransitionTime

			if (this.swipeDirection == SwipeDirection.Horizontal) {
				// Disable horizontal swiping until the next and previous pages are fully rendered
				if (this.showPageRunningWhenSwipeStarted) {
					if (this.isRenderingNextOrPrevPage) {
						// Show the progress ring and navigate to the next or previous page after ShowPage
						this.progressRingVisible = true

						if (this.touchDiffX > this.width * 0.15) {
							this.renderNextPageAfterShowPage = true
							this.renderPrevPageAfterShowPage = false
						} else if (-this.touchDiffX > this.width * 0.2) {
							this.renderNextPageAfterShowPage = false
							this.renderPrevPageAfterShowPage = true
						}
					}

					return
				}

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
			} else if (this.swipeDirection == SwipeDirection.Vertical) {
				if (this.bottomToolbarMarginBottom < bottomToolbarMarginBottomClosed / 2) {
					this.bottomToolbarMarginBottom = bottomToolbarMarginBottomClosed
					this.bottomToolbarOpened = false
				} else {
					this.bottomToolbarMarginBottom = bottomToolbarMarginBottomOpened
					this.bottomToolbarOpened = true
				}
			}

			this.touchStartX = 0
			this.touchStartY = 0
			this.touchDiffX = 0
			this.touchDiffY = 0
		}
	}

	HandleClick(event: MouseEvent) {
		let clickedOnLeftEdge = event.pageX < navigationDoubleTapAreaWidth
		let clickedOnRightEdge = this.width - navigationDoubleTapAreaWidth < event.pageX

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
				this.bottomToolbarTransitionTime = defaultBottomToolbarTransitionTime

				if (clickedOnRightEdge) {
					this.NextPage()
				} else if (clickedOnLeftEdge) {
					this.PrevPage()
				}
			}
		}
	}

	OpenOrCloseBottomToolbar() {
		if (this.bottomToolbarOpened) {
			// Close the bottom toolbar
			this.CloseBottomToolbar()
		} else {
			// Open the bottom toolbar
			this.OpenBottomToolbar()
		}
	}

	OpenBottomToolbar() {
		this.bottomToolbarMarginBottom = bottomToolbarMarginBottomOpened
		this.bottomToolbarOpened = true
	}

	CloseBottomToolbar() {
		this.bottomToolbarMarginBottom = bottomToolbarMarginBottomClosed
		this.bottomToolbarOpened = false
	}

	CloseBookmarksPanel() {
		this.showBookmarksPanel = false
		this.CloseBottomToolbar()
	}

	CloseChaptersPanel() {
		this.showChaptersPanel = false
		this.CloseBottomToolbar()
	}

	async AddOrRemoveBookmark() {
		if (this.showPageRunning) return

		if (this.currentPageBookmark) {
			await this.currentBook.RemoveBookmark(this.currentPageBookmark)
			this.currentPageBookmark = null
		} else {
			// Calculate the progress of the current page
			let currentChapter = this.chapters[this.currentChapter]
			let currentChapterPageBreakPositions = currentChapter.GetPageBreakPositions(this.contentWidth, this.contentHeight)
			let lastPage: boolean = currentChapterPageBreakPositions.length - (this.showSecondPage ? 2 : 1) <= this.currentPage

			let currentPagePosition = currentChapterPageBreakPositions[this.currentPage]
			let nextPagePosition = lastPage ? currentPagePosition : currentChapterPageBreakPositions[this.currentPage + 1]
			let lastPagePosition = currentChapterPageBreakPositions[currentChapterPageBreakPositions.length - 1]

			let pageMiddlePosition: number
			if (this.showSecondPage) {
				pageMiddlePosition = nextPagePosition
			} else {
				// Get the position of the current page in the middle
				let currentNextPageDiff = lastPage ? 0 : ((nextPagePosition - currentPagePosition) / 2)
				pageMiddlePosition = currentNextPageDiff + currentPagePosition
			}

			// Calculate the progress from the middle position
			let progress = pageMiddlePosition / lastPagePosition

			if (isNaN(progress)) {
				progress = 0
			} else {
				progress = Math.ceil(progress * progressFactor)
			}

			// Get the chapter title
			let chapterTitle = this.currentChapterTitle
			if (!chapterTitle) chapterTitle = this.locale.untitledBookmark

			// Create the bookmark
			this.currentPageBookmark = await this.currentBook.AddBookmark(chapterTitle, this.currentChapter, progress)
		}
	}

	SetProgressRingColor() {
		let circles = document.getElementsByTagName('circle')

		for (let i = 0; i < circles.length; i++){
			let circle = circles.item(i)
			let color = this.dataService.darkTheme ? 'white' : 'black'
			circle.setAttribute('style', circle.getAttribute('style') + ` stroke: ${color}`)
		}
	}

	/**
	 * Counts the size of each chapter html and calculates the size relative to the entire book
	 */
	async LoadChapterPercentages() {
		if (this.currentBook.chapterPercentages.length > 0) return

		// Get the html of each chapter and count the elements
		let totalElements = 0
		let chapterElements: number[] = []
		let chapterPercentages: number[] = []

		for (let i = 0; i < this.book.chapters.length; i++) {
			let html = await this.book.chapters[i].GetChapterHtml()
			let body = html.getElementsByTagName("body")[0]
			let currentChapterElements = body.getElementsByTagName("*").length

			totalElements += currentChapterElements
			chapterElements.push(currentChapterElements)
		}

		let percentageBase = 100 / totalElements * progressFactor

		// Calculate the percentage of each chapter
		for (let i = 0; i < chapterElements.length; i++) {
			let chapterPercentage = Math.ceil(percentageBase * chapterElements[i])
			chapterPercentages.push(chapterPercentage)
		}

		// Save the chapter progresses and the total progress
		await this.currentBook.SetChapterPercentages(chapterPercentages)
	}

	/**
	 * Calculates, sets and returns the total progress based on the current chapter, the chapterPercentages and the progress of the current chapter
	 * @param currentChapterProgress The progress of the current chapter
	 */
	CalculateTotalProgress(currentChapterProgress: number) {
		if (this.currentBook.chapterPercentages.length == 0) return
		let newTotalProgress = 0

		for (let i = 0; i < this.chapters.length; i++) {
			if (i == this.currentChapter) {
				// Calculate the progress within the current chapter
				if (currentChapterProgress > 0) currentChapterProgress /= progressFactor
				newTotalProgress += this.currentBook.chapterPercentages[i] * currentChapterProgress
				break
			} else {
				// Add the entire percentage of the chapter
				newTotalProgress += this.currentBook.chapterPercentages[i]
			}
		}

		this.totalProgress = newTotalProgress / progressFactor / 100
		return newTotalProgress
	}

	GetProgressOfCurrentChapterPage(page: number): number {
		let currentChapter = this.chapters[this.currentChapter]
		let currentChapterPageBreakPositions = currentChapter.GetPageBreakPositions(this.contentWidth, this.contentHeight)
		if (page < 0 || page >= currentChapterPageBreakPositions.length) return -1

		let lastPagePosition = currentChapterPageBreakPositions[currentChapterPageBreakPositions.length - 1]
		let pagePosition = currentChapterPageBreakPositions[page]
		let pageProgress = pagePosition / lastPagePosition

		if (isNaN(pageProgress)) {
			pageProgress = 0
		} else {
			pageProgress = Math.ceil(pageProgress * progressFactor)
		}

		return pageProgress
	}

	ChapterLinkClicked(link: string) {
		this.showChaptersPanel = false
		this.NavigateToLink(link)
	}

	/**
	 * Initializes the given chapter and adapts it to the size of the window
	 * @param chapterIndex The chapter at the position of this.chapters
	 */
	async InitChapter(chapterIndex: number): Promise<BookChapter> {
		let chapter = this.chapters[chapterIndex]
		if (!chapter) return null

		if (!chapter.IsInitialized()) {
			// Get the html and init the chapter
			let chapterHtml: HTMLHtmlElement = await this.book.chapters[chapterIndex].GetChapterHtml()
			chapter.Init(chapterHtml)
		}

		return chapter
	}

	/**
	 * Renders the given chapter on the appropriate iframe with the correct dimensions
	 * @param chapter The chapter to render
	 * @param viewerSide The ViewSide to render the chapter on
	 */
	 async RenderChapter(chapter: BookChapter, viewerSide: ViewerSide) {
		await chapter.Render(
			viewerSide,
			this.contentWidth,
			this.contentHeight,
			this.paddingX,
			3000,
			this.dataService.darkTheme,
			(link: string) => this.ngZone.run(() => this.NavigateToLink(link))
		)
	}

	GetViewer(position: ViewerPosition): Viewer {
		switch (position) {
			case ViewerPosition.Current:
				return this.GetCurrentViewer()
			case ViewerPosition.Next:
				return this.GetNextViewer()
			case ViewerPosition.Previous:
				return this.GetPreviousViewer()
		}
	}

	GetCurrentViewer(): Viewer {
		switch (this.currentViewer) {
			case CurrentViewer.First:
				return this.firstViewer
			case CurrentViewer.Second:
				return this.secondViewer
			case CurrentViewer.Third:
				return this.thirdViewer
		}
	}

	GetNextViewer(): Viewer {
		switch (this.currentViewer) {
			case CurrentViewer.First:
				return this.secondViewer
			case CurrentViewer.Second:
				return this.thirdViewer
			case CurrentViewer.Third:
				return this.firstViewer
		}
	}

	GetPreviousViewer(): Viewer {
		switch (this.currentViewer) {
			case CurrentViewer.First:
				return this.thirdViewer
			case CurrentViewer.Second:
				return this.firstViewer
			case CurrentViewer.Third:
				return this.secondViewer
		}
	}

	SetHeightOfViewer(viewer: ViewerPosition, height: number, right: boolean = false) {
		switch (viewer) {
			case ViewerPosition.Current:
				this.SetHeightOfCurrentViewer(height, right)
				break
			case ViewerPosition.Next:
				this.SetHeightOfNextViewer(height, right)
				break
			case ViewerPosition.Previous:
				this.SetHeightOfPreviousViewer(height, right)
				break
		}
	}

	SetHeightOfCurrentViewer(height: number, right: boolean = false) {
		switch (this.currentViewer) {
			case CurrentViewer.First:
				if (right) this.firstViewer.right.height = height
				else this.firstViewer.left.height = height
				break
			case CurrentViewer.Second:
				if (right) this.secondViewer.right.height = height
				else this.secondViewer.left.height = height
				break
			case CurrentViewer.Third:
				if (right) this.thirdViewer.right.height = height
				else this.thirdViewer.left.height = height
				break
		}
	}

	SetHeightOfNextViewer(height: number, right: boolean = false) {
		switch (this.currentViewer) {
			case CurrentViewer.First:
				if (right) this.secondViewer.right.height = height
				else this.secondViewer.left.height = height
				break
			case CurrentViewer.Second:
				if (right) this.thirdViewer.right.height = height
				else this.thirdViewer.left.height = height
				break
			case CurrentViewer.Third:
				if (right) this.firstViewer.right.height = height
				else this.firstViewer.left.height = height
				break
		}
	}

	SetHeightOfPreviousViewer(height: number, right: boolean = false) {
		switch (this.currentViewer) {
			case CurrentViewer.First:
				if (right) this.thirdViewer.right.height = height
				else this.thirdViewer.left.height = height
				break
			case CurrentViewer.Second:
				if (right) this.firstViewer.right.height = height
				else this.firstViewer.left.height = height
				break
			case CurrentViewer.Third:
				if (right) this.secondViewer.right.height = height
				else this.secondViewer.left.height = height
				break
		}
	}

	SetLeftOfViewer(viewer: ViewerPosition, left: number) {
		switch (viewer) {
			case ViewerPosition.Current:
				this.SetLeftOfCurrentViewer(left)
				break
			case ViewerPosition.Next:
				this.SetLeftOfNextViewer(left)
				break
			case ViewerPosition.Previous:
				this.SetLeftOfPreviousViewer(left)
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

	async MoveViewersForward(): Promise<void> {
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

		await new Promise(resolve => setTimeout(resolve, defaultViewerTransitionTime))

		// Reset the transition times
		this.SetTransitionTimeOfCurrentViewer(defaultViewerTransitionTime)
		this.SetTransitionTimeOfNextViewer(defaultViewerTransitionTime)
		this.SetTransitionTimeOfPreviousViewer(defaultViewerTransitionTime)
	}

	async MoveViewersBackward(): Promise<void> {
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

		await new Promise(resolve => setTimeout(resolve, defaultViewerTransitionTime))

		// Reset the transition times
		this.SetTransitionTimeOfCurrentViewer(defaultViewerTransitionTime)
		this.SetTransitionTimeOfNextViewer(defaultViewerTransitionTime)
		this.SetTransitionTimeOfPreviousViewer(defaultViewerTransitionTime)
	}

	SetEventListeners(position: ViewerPosition) {
		let viewer = this.GetViewer(position)

		this.SetEventListenersForViewer(viewer.left.iframe)
		this.SetEventListenersForViewer(viewer.right.iframe)

		viewer.left.iframe.contentWindow.focus()
	}

	SetEventListenersForViewer(viewer: HTMLIFrameElement) {
		// Bind the keydown and wheel events to the viewers
		viewer.contentWindow.addEventListener("keydown", (event: KeyboardEvent) => this.onKeyDown(event))
		viewer.contentWindow.addEventListener("wheel", (event: WheelEvent) => this.onMouseWheel(event))

		// Bind the touch and click events to the viewers
		viewer.contentWindow.addEventListener(touchStart, (e: TouchEvent) => this.ngZone.run(() => this.HandleTouch(e)))
		viewer.contentWindow.addEventListener(touchMove, (e: TouchEvent) => this.ngZone.run(() => this.HandleTouch(e)))
		viewer.contentWindow.addEventListener(touchEnd, (e: TouchEvent) => this.ngZone.run(() => this.HandleTouch(e)))
		viewer.contentWindow.addEventListener(click, (e: MouseEvent) => this.ngZone.run(() => this.HandleClick(e)))
	}

	/**
	 * Updates the firstPage and lastPage properties for updating the UI
	 */
	setFirstLastPage() {
		this.firstPage = this.currentChapter == 0 && this.currentPage == 0
		this.lastPage =
			(this.currentChapter >= this.chapters.length - 1)
			&& (this.currentPage >= this.chapters[this.chapters.length - 1].GetPageBreakPositions(this.contentWidth, this.contentHeight).length - (this.showSecondPage ? 2 : 1))
	}

	LoadCurrentChapterTitle() {
		let chapterFilePath = this.book.chapters[this.currentChapter].filePath

		if (chapterFilePath.includes('#')) {
			// Remove the last part
			chapterFilePath = chapterFilePath.slice(0, chapterFilePath.lastIndexOf('#'))
		}

		// Find the toc item with the same href
		let tocItem: EpubTocItem = null

		for (let item of this.book.toc) {
			tocItem = this.FindTocItemByHref(item, chapterFilePath)
			if (tocItem != null) break
		}

		if (tocItem) this.currentChapterTitle = tocItem.title
		else this.currentChapterTitle = null
	}

	FindTocItemByHref(item: EpubTocItem, href: string): EpubTocItem {
		if (item.href == href) return item

		if (item.items.length > 0) {
			for (let subItem of item.items) {
				let result = this.FindTocItemByHref(subItem, href)
				if (result != null) return result
			}
		}
	}

	GoBack() {
		if (this.navigationHistory.length > 0) {
			// Navigate back to the last position
			let lastPosition = this.navigationHistory.pop()
			this.currentChapter = lastPosition.chapter
			this.currentPage = lastPosition.page
			this.ShowPage()
		}
	}

	GoHome() {
		this.router.navigate(["/"])
	}

	async NavigateToLink(href: string) {
		// Separate the chapter name from the anchor
		let elementId = null
		let chapterName = href

		if (chapterName.includes('#')) {
			elementId = chapterName.slice(chapterName.lastIndexOf('#') + 1)
			chapterName = chapterName.slice(0, chapterName.lastIndexOf('#'))
		}

		// Find the chapter of the href
		let linkedChapterIndex = this.chapters.findIndex((chapter: BookChapter) => chapter.GetFilename() == chapterName)
		if (linkedChapterIndex == -1) return

		// Add the current position to the navigation history
		this.navigationHistory.push({
			chapter: this.currentChapter,
			page: this.currentPage
		})

		this.currentChapter = linkedChapterIndex
		this.currentPage = 0

		if (elementId) {
			// Navigate to the page of the chapter with the element with the id
			let elementId = href.slice(href.lastIndexOf('#') + 1)
			await this.ShowPage(NavigationDirection.None, -1, elementId)
		} else {
			// Navigate to the first page of the chapter
			await this.ShowPage()
		}
	}

	NavigateToBookmark(bookmark: EpubBookmark) {
		this.showBookmarksPanel = false
		this.currentChapter = bookmark.chapter

		this.ShowPage(NavigationDirection.None, bookmark.progress)
		return false
	}
}

export class BookChapter {
	private html: HTMLHtmlElement				// The html of the chapter
	private initialized: boolean = false
	private chapterIndex: number				// The number of the chapter that the html represents
	private filename: string					// The name of the chapter file
	private pageBreakPositions: {
		positions: number[],
		width: number,
		height: number
	}[] = []											// The positions within the html for page breaks for the different width and height combinations

	constructor(params: {
		chapterIndex: number,
		filename: string
	}) {
		this.chapterIndex = params.chapterIndex
		this.filename = params.filename
	}

	/**
	 * Initializes the BookChapter with the given html
	 * @param html The html of the chapter
	 */
	Init(html: HTMLHtmlElement) {
		if (this.initialized) return

		// Prepare the html
		let styleElement = document.createElement("style") as HTMLStyleElement
		styleElement.innerHTML = `
			body {
				padding: 0px {0}px;
				margin: 0px 0px {1}px 0px;
				color: {2};
				background-color: transparent;
				font-family: Segoe UI;
			}

			h1, h2, h3, h4, h5, h6 {
				text-align: center;
				margin: 2em 0;
				font-weight: 300;
			}

			h1 {
				font-size: 1.75em;
			}

			blockquote > cite {
				display: block;
				text-align: right;
			}

			blockquote > header {
				text-align: right;
			}

			section[role="doc-dedication"] {
				text-align: center;
				max-width: 50%;
				margin: auto;
			}

			section[role="doc-epigraph"], section[role="doc-colophon"] {
				text-align: center;
			}

			section[role="doc-epigraph"] > blockquote, section[role="doc-dedication"] > blockquote {
				display: inline-block;
				text-align: left;
			}

			header {
				text-align: center;
			}

			header > p {
				max-width: 70%;
				margin: auto;
				text-align: left;
			}

			header > blockquote {
				display: inline-block;
				text-align: left;
			}

			footer {
				text-align: right;
			}

			a {
				color: {5};
			}

			a[role="doc-noteref"] {
				font-size: 80%;
				vertical-align: super;
			}

			img {
				max-width: {3}px;
				max-height: {4}px;
				text-align: center;
			}

			hr {
				margin: 4em 25%;
			}

			table {
				border-spacing: 1em;
			}

			th, td {
				vertical-align: top;
			}

			td > p {
				margin: 0;
			}

			pre {
				white-space: pre-wrap;
			}
		`

		let headElement = html.getElementsByTagName("head")[0] as HTMLHeadElement
		headElement.appendChild(styleElement)

		this.html = html
		this.initialized = true
	}

	/**
	 * Getter for the html
	 * @param width The max width for images
	 * @param height The max height for images
	 * @param paddingX The left and right padding
	 * @param marginTop The top margin
	 * @param darktheme If true, makes the text color white
	 * @returns The html of the BookChapter
	 */
	GetHtml(
		width: number,
		height: number,
		paddingX: number,
		marginTop: number,
		darkTheme: boolean
	): HTMLHtmlElement {
		if (!this.initialized) return null

		let updatedHtml = this.html.cloneNode(true) as HTMLHtmlElement
		let styleElement = updatedHtml.getElementsByTagName("style")[0] as HTMLStyleElement
		styleElement.innerHTML = styleElement.innerHTML
			.replace('{0}', paddingX.toString())
			.replace('{1}', marginTop.toString())
			.replace('{2}', darkTheme ? 'white !important' : 'black !important')
			.replace('{3}', width.toString())
			.replace('{4}', height.toString())
			.replace('{5}', darkTheme ? '#7eade8' : '#0000ee')

		return updatedHtml
	}

	/**
	 * Getter for initialized
	 * @returns true, if the BookChapter is initialized
	 */
	IsInitialized(): boolean {
		return this.initialized
	}

	/**
	 * Getter for the filename
	 * @returns The filename of the BookChapter
	 */
	GetFilename(): string{
		return this.filename
	}

	/**
	 * Finds and returns the page break positions for the corresponding window width and height
	 * @param width The width of the html content
	 * @param height The height of the html content
	 * @returns The page break positions for the given width and height
	 */
	GetPageBreakPositions(width: number, height: number): number[]{
		let i = this.pageBreakPositions.findIndex(p => p.width == width && p.height == height)
		if(i == -1) return [0]
		return this.pageBreakPositions[i].positions
	}

	/**
	 * Renders the chapter on the given ViewerSide and finds the page break positions, if necessary
	 * @param viewerSide The ViewerSide on which to render the chapter
	 * @param contentWidth The width of the html content
	 * @param contentHeight The height of the html content
	 * @param paddingX The left and right padding for the html
	 * @param marginTop The top margin for the html
	 * @param darkTheme If true, makes the text color white
	 * @param linkCallback The function called when the user clicks a link in the html
	 */
	async Render(
		viewerSide: ViewerSide,
		contentWidth: number,
		contentHeight: number,
		paddingX: number,
		marginTop: number,
		darkTheme: boolean,
		linkCallback: Function
	) {
		if (!this.initialized) return

		// Check if the chapter is already rendered on the iframe
		if (this.chapterIndex == viewerSide.chapter) return

		// Render the chapter on the iframe
		let viewerLoadPromise = new PromiseHolder()
		viewerSide.iframe.onload = () => viewerLoadPromise.Resolve()
		viewerSide.iframe.srcdoc = this.GetHtml(
			contentWidth,
			contentHeight,
			paddingX,
			marginTop,
			darkTheme
		).outerHTML
		await viewerLoadPromise.AwaitResult()

		// Check if the chapter already contains the page break positions for the current width and height
		let i = this.pageBreakPositions.findIndex(p => p.width == contentWidth && p.height == contentHeight)

		if (i == -1) {
			// Find the page break positions
			let positions: number[] = []
			FindPositionsInHtmlElement(viewerSide.iframe.contentDocument.getElementsByTagName("body")[0] as HTMLBodyElement, positions)

			// Sort the positions
			positions.sort((a: number, b: number) => a > b ? 1 : -1)

			this.pageBreakPositions.push({
				positions: FindPageBreakPositions(positions, contentHeight),
				width: contentWidth,
				height: contentHeight
			})
		}

		// Adapt the links
		let linkTags = viewerSide.iframe.contentWindow.document.getElementsByTagName("a")
		for (let i = 0; i < linkTags.length; i++) {
			AdaptLinkTag(linkTags.item(i), (href: string) => linkCallback(href))
		}
	}
}

interface Viewer {
	left: ViewerSide
	right: ViewerSide
	positionLeft: number
	zIndex: number,
	transitionTime: number
}

interface ViewerSide {
	iframe: HTMLIFrameElement
	chapter: number
	width: number
	height: number
}

enum CurrentViewer {
	First = 1,
	Second = 2,
	Third = 3
}

enum ViewerPosition {
	Current,
	Next,
	Previous
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