import { Component, HostListener, NgZone, ViewChild } from '@angular/core'
import { Router } from '@angular/router'
import { PromiseHolder } from 'dav-js'
import { DataService } from 'src/app/services/data-service'
import { ChaptersTreeComponent } from '../chapters-tree/chapters-tree.component'
import { EpubBook } from 'src/app/models/EpubBook'
import { EpubBookmark } from 'src/app/models/EpubBookmark'
import { EpubReader, EpubTocItem } from 'src/app/models/EpubReader'
import { FindPositionsInHtmlElement, FindPageBreakPositions, AdaptLinkTag } from 'src/app/misc/utils'
import { enUS } from 'src/locales/locales'
declare var $: any

const secondPageMinWidth = 1050		// Show two pages on the window if the window width is greater than this
const progressFactor = 100000			// The factor with which the progress is saved
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
const defaultViewerTransitionTime = 0.5
const defaultBottomToolbarTransitionTime = 0.2
const navigationDoubleTapAreaWidth = 50
const doubleTapToleranceTime = 400
const navigationToleranceTime = 200

@Component({
	selector: 'pocketlib-epub-content',
	templateUrl: './epub-content.component.html',
	styleUrls: [
		'./epub-content.component.scss'
	]
})
export class EpubContentComponent {
	locale = enUS.epubContent
	book = new EpubReader()
	currentBook: EpubBook
	chapters: BookChapter[] = []
	initialized: boolean = false

	width: number = 500				// The width of the entire window
	height: number = 500				// The height of the entire window
	contentHeight: number = 500	// The height of the iframe (height - 7 - paddingTop)
	pageHeight: number = 500
	paddingX: number = 0
	paddingTop: number = 80
	paddingBottom: number = 60
	viewerTransitionTime: number = defaultViewerTransitionTime

	firstViewer: Viewer = {
		left: {
			iframe: null,
			chapter: -1,	// The html of the chapter that is currently rendered
			width: 500,
			height: 300
		},
		right: {
			iframe: null,
			chapter: -1,
			width: 500,
			height: 300
		},
		positionLeft: 0,	// How much the viewer is moved to the right
		zIndex: -1			// -1, -2 or -3
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
		zIndex: -1
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
		zIndex: -1
	}

	currentChapter: number = 0				// The current chapter index in this.chapters
	currentPage: number = 0					// The current page in the current chapter
	currentChapterTitle: string = ""		// The title of the current chapter

	firstPage: boolean = false		// If true, hides the previous button
	lastPage: boolean = false		// If true, hides the next button
	showSecondPage: boolean = false	// If true, the right viewers are visible
	currentViewer: CurrentViewer = CurrentViewer.First		// Shows, which viewer is currently visible
	goingBack: boolean = false		// If true, the viewer goes to the previous page
	showPageRunning: boolean = false		// If true, ShowPage is currently executing
	runNextPageAfterRender: boolean = false	// If true, NextPage will be called another time
	runPrevPageAfterRender: boolean = false	// If true, PrevPage will be called another time
	navigationHistory: { chapter: number, page: number }[] = []		// The history of visited pages, is used when clicking a link
	nextPageTimerRunning: boolean = false		// If this is true, the timer for NextPage is running, which means that in this timeframe a second call of NextPage is disabled
	prevPageTimerRunning: boolean = false		// If this is true, the timer for PrevPage is running, which means that in this timeframe a second call of PrevPage is disabled
	pageRenderingPromiseHolder = new PromiseHolder()	// PromiseHolder for rendering the pages, is resolved after the rendering of pages is finished

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
	totalProgress: number = 0						// The current progress in percent
	//#endregion

	//#region Variables for the chapters panel
	showChaptersPanel: boolean = false
	@ViewChild('chaptersTree', { static: true }) chapterTree: ChaptersTreeComponent
	panelStyles = {
		main: {
			backgroundColor: getComputedStyle(document.body).getPropertyValue("--theme-color-secondary")
		},
		headerText: {
			color: getComputedStyle(document.body).getPropertyValue("--text-color")
		},
		overlay: {
			backgroundColor: this.dataService.darkTheme ? "rgba(21, 32, 43, 0.4)" : "rgba(255, 255, 255, 0.4)"
		}
	}
	//#endregion

	//#region Variables for bookmarks
	currentPageBookmark: string = null
	showBookmarksPanel: boolean = false
	//#endregion

	constructor(
		private dataService: DataService,
		private router: Router,
		private ngZone: NgZone
	) {
		this.locale = this.dataService.GetLocale().epubContent
		this.setSize()
	}

	async ngOnInit() {
		this.currentBook = this.dataService.currentBook as EpubBook

		// Initialize the html element variables
		this.firstViewer.left.iframe = document.getElementById(firstViewerLeftId) as HTMLIFrameElement
		this.firstViewer.right.iframe = document.getElementById(firstViewerRightId) as HTMLIFrameElement
		this.secondViewer.left.iframe = document.getElementById(secondViewerLeftId) as HTMLIFrameElement
		this.secondViewer.right.iframe = document.getElementById(secondViewerRightId) as HTMLIFrameElement
		this.thirdViewer.left.iframe = document.getElementById(thirdViewerLeftId) as HTMLIFrameElement
		this.thirdViewer.right.iframe = document.getElementById(thirdViewerRightId) as HTMLIFrameElement
		this.navigationHistory = []

		if (this.dataService.currentBook) {
			// Load the ebook
			await this.book.ReadEpubFile(this.dataService.currentBook.file)

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
			await this.ShowPage(NavigationDirection.None, progress)

			this.chapterTree.Init(this.book.toc)

			await this.LoadChapterPercentages()
			this.CalculateTotalProgress(this.currentBook.progress)
		}

		// Bind the keydown and wheel events
		$(document).unbind().keydown((e) => this.onKeyDown(e.keyCode))
		$(document).bind('mousewheel', (e) => this.onMouseWheel(e.originalEvent.wheelDelta))

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
		$(document).unbind()
	}

	@HostListener('window:resize')
	onResize() {
		this.setSize()
	}

	async onKeyDown(keyCode: number) {
		if (this.showChaptersPanel) return
		await this.pageRenderingPromiseHolder.AwaitResult()

		switch (keyCode) {
			case 8:		// Back key
				this.ngZone.run(() => this.GoBack())
				break
			case 37:		// Left arrow key
				this.ngZone.run(() => this.PrevPage())
				break
			case 39:		// Right arrow key
				this.ngZone.run(() => this.NextPage())
				break
		}
	}

	async onMouseWheel(wheelDelta: number) {
		if (this.showChaptersPanel) return
		await this.pageRenderingPromiseHolder.AwaitResult()

		if (wheelDelta > 0) {
			// Wheel up
			this.ngZone.run(() => this.PrevPage())
		} else {
			// Wheel down
			this.ngZone.run(() => this.NextPage())
		}
	}

	async setSize() {
		this.width = window.innerWidth
		this.height = window.innerHeight
		this.contentHeight = this.height - this.paddingTop
		this.pageHeight = this.contentHeight - this.paddingBottom
		this.paddingX = Math.round(this.width * 0.1)

		this.showSecondPage = this.width > secondPageMinWidth
		this.showBottomToolbar = this.width < 500

		if (this.showSecondPage) {
			// Show both pages
			this.firstViewer.left.width = this.width / 2
			this.firstViewer.right.width = this.width / 2
		} else {
			// Hide the second page
			this.firstViewer.left.width = this.width
			this.firstViewer.right.width = 0
		}

		if (this.initialized) {
			await this.ShowPage(NavigationDirection.None)
		}
	}

	async PrevPage() {
		if (this.showPageRunning) {
			this.runPrevPageAfterRender = !this.prevPageTimerRunning
			return
		}

		// Start the timer
		this.prevPageTimerRunning = true
		setTimeout(() => {
			this.prevPageTimerRunning = false
		}, navigationToleranceTime)

		this.showPageRunning = true

		this.goingBack = true
		if (
			(this.showSecondPage && this.currentPage <= 1)
			|| (!this.showSecondPage && this.currentPage <= 0)
		) {
			// Show the previous chapter
			if (this.currentChapter <= 0) return
			this.currentChapter--
			let chapter = this.chapters[this.currentChapter]

			this.currentPage = chapter.GetPageBreakPositions(this.width, this.pageHeight).length - 1
			if (this.showSecondPage && this.currentPage % 2 == 1) this.currentPage--
		} else if (this.showSecondPage) {
			// Go to the second previous page
			this.currentPage -= 2
		} else {
			// Show the previous page
			this.currentPage--
		}

		await this.ShowPage(NavigationDirection.Back)
		this.goingBack = false

		if (this.runNextPageAfterRender) {
			this.runNextPageAfterRender = false
			this.NextPage()
		} else if (this.runPrevPageAfterRender) {
			this.runPrevPageAfterRender = false
			this.PrevPage()
		}
	}

	async NextPage() {
		if (this.showPageRunning) {
			this.runNextPageAfterRender = !this.nextPageTimerRunning
			return
		}

		// Start the timer
		this.nextPageTimerRunning = true
		setTimeout(() => {
			this.nextPageTimerRunning = false
		}, navigationToleranceTime)

		this.showPageRunning = true

		// Check if this is the last chapter and the last page
		if (
			this.currentChapter >= this.chapters.length - 1
			&& this.currentPage >= this.chapters[this.chapters.length - 1].GetPageBreakPositions(this.width, this.pageHeight).length - (this.showSecondPage ? 1 : 0)
		) {
			// Reset the progress
			await this.currentBook.SetPosition(0, 0)
			await this.dataService.settings.SetBook("", 0, 0)

			// Go back to the library page
			this.router.navigate(["/"])
			return
		}

		let chapter = this.chapters[this.currentChapter]
		let chapterPageBreakPositions = chapter.GetPageBreakPositions(this.width, this.pageHeight)

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

		if (this.runNextPageAfterRender) {
			this.runNextPageAfterRender = false
			this.NextPage()
		} else if (this.runPrevPageAfterRender) {
			this.runPrevPageAfterRender = false
			this.PrevPage()
		}
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

		this.pageRenderingPromiseHolder.Setup()

		if (direction == NavigationDirection.Forward) {
			// Move the viewer positions
			await this.MoveViewersClockwise()
		} else if (direction == NavigationDirection.Back) {
			// Move the viewer positions
			await this.MoveViewersCounterClockwise()
		} else {
			// Render the current page on the next page viewer
			await this.RenderCurrentPage(ViewerPosition.Next, progress, elementId)

			// Set the event listeners
			this.SetEventListeners(ViewerPosition.Next)

			// Move the viewer positions
			await this.MoveViewersClockwise()
		}

		this.setFirstLastPage()
		this.LoadCurrentChapterTitle()
		let currentChapter = this.chapters[this.currentChapter]
		let currentChapterPageBreakPositions = currentChapter.GetPageBreakPositions(this.width, this.pageHeight)

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

		this.showPageRunning = false
		this.pageRenderingPromiseHolder.resolve()
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

		let chapterPageBreakPositions = chapter.GetPageBreakPositions(this.width, this.pageHeight)

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
			chapterPageBreakPositions = chapter.GetPageBreakPositions(this.width, this.pageHeight)
		} else {
			this.chapters[this.currentChapter] = chapter
		}

		if (this.showSecondPage && nextPage < chapterPageBreakPositions.length) {
			// Render the chapter on the second page
			await this.RenderChapter(chapter, nextViewer.right)
		}

		// Scroll the left viewer
		nextViewer.left.iframe.contentWindow.scrollTo(0, chapterPageBreakPositions[nextPage])
		if (this.showSecondPage && chapterPageBreakPositions[nextPage + 1]) {
			// Scroll the right viewer
			nextViewer.right.iframe.contentWindow.scrollTo(0, chapterPageBreakPositions[nextPage + 1])
		}

		// Update the height of the left viewer
		// height of iframe = difference between the position of the next page and the position of the current page
		let newViewerLeftHeight = (chapterPageBreakPositions[nextPage + 1] - chapterPageBreakPositions[nextPage])
		this.SetHeightOfNextViewer((newViewerLeftHeight < 0 || isNaN(newViewerLeftHeight)) ? this.contentHeight - 8 : newViewerLeftHeight)

		// Update the height of the right viewer
		if (this.showSecondPage) {
			if (nextPage == chapterPageBreakPositions.length - 1) {
				// The last page is shown on the left page
				// Hide the right page
				this.SetHeightOfNextViewer(0, true)
			} else if (nextPage == chapterPageBreakPositions.length - 2) {
				// Ths last page is shown on the right page
				// Show the entire right page
				this.SetHeightOfNextViewer(this.contentHeight - 8, true)
			} else {
				let newViewerRightHeight = (chapterPageBreakPositions[nextPage + 2] - chapterPageBreakPositions[nextPage + 1])
				this.SetHeightOfNextViewer((newViewerRightHeight < 0 || isNaN(newViewerRightHeight)) ? this.contentHeight - 8 : newViewerRightHeight, true)
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

		let chapterPageBreakPositions = chapter.GetPageBreakPositions(this.width, this.pageHeight)

		// Check if the previous chapter should be rendered
		let renderPreviousChapter = this.currentPage == 0
		if (renderPreviousChapter && this.currentChapter == 0) return

		if (renderPreviousChapter) {
			// Render the previous chapter
			chapterNumber = this.currentChapter - 1
			chapter = await this.InitChapter(chapterNumber)
			if (!chapter) return

			await this.RenderChapter(chapter, previousViewer.left)
			chapterPageBreakPositions = chapter.GetPageBreakPositions(this.width, this.pageHeight)

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
		previousViewer.left.iframe.contentWindow.scrollTo(0, chapterPageBreakPositions[previousPage])
		if (this.showSecondPage && chapterPageBreakPositions[previousPage + 1]) {
			// Scroll the right viewer
			previousViewer.right.iframe.contentWindow.scrollTo(0, chapterPageBreakPositions[previousPage + 1])
		}

		// Update the height of the left viewer
		// height of iframe = difference between the position of the next page and the position of the current page
		let newViewerLeftHeight = (chapterPageBreakPositions[previousPage + 1] - chapterPageBreakPositions[previousPage])
		this.SetHeightOfPreviousViewer((newViewerLeftHeight < 0 || isNaN(newViewerLeftHeight)) ? this.contentHeight - 8 : newViewerLeftHeight)

		// Update the height of the right viewer
		if (this.showSecondPage) {
			if (previousPage == chapterPageBreakPositions.length - 1) {
				// The last page is shown on the left page
				// Hide the right page
				this.SetHeightOfPreviousViewer(0, true)
			} else if (previousPage == chapterPageBreakPositions.length - 2) {
				// Ths last page is shown on the right page
				// Show the entire right page
				this.SetHeightOfPreviousViewer(this.contentHeight - 8, true)
			} else {
				let newViewerRightHeight = (chapterPageBreakPositions[previousPage + 2] - chapterPageBreakPositions[previousPage + 1])
				this.SetHeightOfPreviousViewer((newViewerRightHeight < 0 || isNaN(newViewerRightHeight)) ? this.contentHeight - 8 : newViewerRightHeight, true)
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
		let pageBreakPositions = chapter.GetPageBreakPositions(this.width, this.pageHeight)

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
			let page = Utils.FindPageForPosition(progressPosition, pageBreakPositions)
			if (page != -1) {
				// If it shows two pages and the tag is on the second page, set the current page to the previous page
				if (this.showSecondPage && page % 2 == 1) page -= 1
				this.currentPage = page
			}
		} else if (elementId) {
			// Find the position of the tag
			let position = Utils.FindPositionById(viewer.left.iframe.contentWindow.document.getElementsByTagName("body")[0] as HTMLBodyElement, elementId)

			if (position != -1) {
				// Find the page of the position
				let page = Utils.FindPageForPosition(position, pageBreakPositions)
				if (page != -1) {
					// If it shows two pages and the tag is on the second page, set the current page to the previous page
					if (this.showSecondPage && page % 2 == 1) page -= 1
					this.currentPage = page
				}
			}
		}

		// Scroll the left viewer
		viewer.left.iframe.contentWindow.scrollTo(0, pageBreakPositions[this.currentPage])
		if (this.showSecondPage && pageBreakPositions[this.currentPage + 1]) {
			// Scroll the right viewer
			viewer.right.iframe.contentWindow.scrollTo(0, pageBreakPositions[this.currentPage + 1])
		}

		// Update the height of the left viewer
		// height of iframe = difference between the position of the next page and the position of the current page
		let newViewerLeftHeight = (pageBreakPositions[this.currentPage + 1] - pageBreakPositions[this.currentPage])
		this.SetHeightOfViewer(position, (newViewerLeftHeight < 0 || isNaN(newViewerLeftHeight)) ? this.contentHeight - 8 : newViewerLeftHeight)

		// Update the height of the right viewer
		if (this.showSecondPage) {
			if (this.currentPage == pageBreakPositions.length - 1) {
				// The last page is shown on the left page
				// Hide the right page
				this.SetHeightOfViewer(position, 0, true)
			} else if (this.currentPage == pageBreakPositions.length - 2) {
				// Ths last page is shown on the right page
				// Show the entire right page
				this.SetHeightOfViewer(position, this.contentHeight - 8, true)
			} else {
				let newViewerRightHeight = (pageBreakPositions[this.currentPage + 2] - pageBreakPositions[this.currentPage + 1])
				this.SetHeightOfViewer(position, (newViewerRightHeight < 0 || isNaN(newViewerRightHeight)) ? this.contentHeight - 8 : newViewerRightHeight, true)
			}
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

			this.viewerTransitionTime = 0
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
			this.viewerTransitionTime = defaultViewerTransitionTime
			this.bottomToolbarTransitionTime = defaultBottomToolbarTransitionTime

			if (this.swipeDirection == SwipeDirection.Horizontal) {
				// Disable horizontal swiping until the next and previous pages are fully rendered
				if (this.showPageRunningWhenSwipeStarted) return

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
				this.viewerTransitionTime = defaultViewerTransitionTime
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

	OpenChaptersPanel() {
		this.showChaptersPanel = true

		// Remove outline of the panel close button
		let closeButton = document.body.getElementsByClassName('ms-Panel-closeButton')[0]
		closeButton.setAttribute("style", `outline: none; color: ${this.dataService.darkTheme ? 'white' : 'black'}`)
	}

	OpenBookmarksPanel() {
		this.showBookmarksPanel = true

		// Remove outline of the panel close button
		let closeButton = document.body.getElementsByClassName('ms-Panel-closeButton')[0]
		closeButton.setAttribute("style", `outline: none; color: ${this.dataService.darkTheme ? 'white' : 'black'}`)
	}

	ClosePanel() {
		this.showChaptersPanel = false
		this.showBookmarksPanel = false
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
			let currentChapterPageBreakPositions = currentChapter.GetPageBreakPositions(this.width, this.pageHeight)
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

		this.totalProgress = newTotalProgress / progressFactor
		return newTotalProgress
	}

	GetProgressOfCurrentChapterPage(page: number): number {
		let currentChapter = this.chapters[this.currentChapter]
		let currentChapterPageBreakPositions = currentChapter.GetPageBreakPositions(this.width, this.pageHeight)
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
	 * @param viewerSide The ViewSide where to render the chapter
	 */
	 async RenderChapter(chapter: BookChapter, viewerSide: ViewerSide) {
		let pageWidth = this.showSecondPage ? this.width / 2 : this.width
		pageWidth = pageWidth - 2 * this.paddingX

		await chapter.Render(
			viewerSide,
			this.width,
			this.pageHeight,
			pageWidth,
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

	async MoveViewersClockwise(): Promise<void> {
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

		return new Promise(resolve => setTimeout(resolve, this.viewerTransitionTime * 1000))
	}

	async MoveViewersCounterClockwise(): Promise<void> {
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

		return new Promise(resolve => setTimeout(resolve, this.viewerTransitionTime * 1000))
	}

	SetEventListeners(position: ViewerPosition) {
		let viewer = this.GetViewer(position)

		this.SetEventListenersForViewer(viewer.left.iframe)
		this.SetEventListenersForViewer(viewer.right.iframe)

		viewer.left.iframe.contentWindow.focus()
	}

	SetEventListenersForViewer(viewer: HTMLIFrameElement) {
		// Bind the keydown and wheel events to the viewers
		$(viewer.contentWindow).keydown((e: any) => this.onKeyDown(e.keyCode))
		$(viewer.contentWindow).bind('mousewheel', (e: any) => this.onMouseWheel(e.originalEvent.wheelDelta))

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
		this.firstPage = this.currentChapter == 0 && this.currentPage == 0;
		this.lastPage =
			(this.currentChapter == this.chapters.length - 1)
			&& (this.currentPage >= this.chapters[this.chapters.length - 1].GetPageBreakPositions(this.width, this.pageHeight).length - (this.showSecondPage ? 2 : 1))
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

class Utils {
	// Go through each element until the element was found, returns -1 if position was not found
	static FindPositionById(currentElement: Element, id: string): number {
		if (currentElement.getAttribute("id") == id) {
			let position = currentElement.getBoundingClientRect()
			return position.top
		}

		if (currentElement.children.length > 0) {
			// Call FindPositionById for each child
			for (let i = 0; i < currentElement.children.length; i++) {
				let child = currentElement.children.item(i)
				let childPosition = this.FindPositionById(child, id)

				if (childPosition != -1) {
					return childPosition
				}
			}
		}

		return -1
	}

	static FindPageForPosition(position: number, pagePositions: number[]): number {
		if (position >= pagePositions[pagePositions.length - 1]) return pagePositions.length - 1

		for (let i = 0; i < pagePositions.length - 1; i++) {
			if (position >= pagePositions[i] && position < pagePositions[i + 1]) {
				return i
			}
		}

		return -1
	}

	static TextNodesUnder(el) {
		var n
		var a: Text[] = []
		var walk = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null, false)
		while (n = walk.nextNode() as Text) a.push(n)
		return a
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

			img {
				max-width: {3}px;
				max-height: {4}px;
			}
		`

		let headElement = html.getElementsByTagName("head")[0] as HTMLHeadElement
		headElement.appendChild(styleElement)

		// Add spans to the texts
		let bodyElement = html.getElementsByTagName("body")[0] as HTMLBodyElement
		let textNodes = Utils.TextNodesUnder(bodyElement)

		for (let textNode of textNodes) {
			// Wrap each space within a span
			let span = document.createElement("span")
			span.innerHTML = textNode.textContent.replace(/ /g, '<span> </span>')

			// Add the span and remove the old text node
			textNode.before(span)
			textNode.parentElement.removeChild(textNode)
		}

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
	 * @param width The width of the window
	 * @param height The height of the window
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
	 * @param pageWidth The width of the page
	 * @param pageHeight The height of the page
	 * @param contentWidth The width of the html content
	 * @param contentHeight The height of the html content
	 * @param paddingX The left and right padding for the html
	 * @param marginTop The top margin for the html
	 * @param darkTheme If true, makes the text color white
	 * @param linkCallback The function called when the user clicks a link in the html
	 */
	async Render(
		viewerSide: ViewerSide,
		pageWidth: number,
		pageHeight: number,
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
		let i = this.pageBreakPositions.findIndex(p => p.width == pageWidth && p.height == pageHeight)

		if (i == -1) {
			// Find the page break positions
			let positions: number[] = []
			FindPositionsInHtmlElement(viewerSide.iframe.contentDocument.getElementsByTagName("body")[0] as HTMLBodyElement, positions)

			this.pageBreakPositions.push({
				positions: FindPageBreakPositions(positions, pageHeight),
				width: pageWidth,
				height: pageHeight
			})
		}

		// Adapt the links
		let linkTags = viewerSide.iframe.contentWindow.document.getElementsByTagName("a")
		for (let i = 0; i < linkTags.length; i++) {
			AdaptLinkTag(linkTags.item(i), (href: string) => linkCallback(href))
		}
	}
}

export interface Viewer {
	left: ViewerSide
	right: ViewerSide
	positionLeft: number
	zIndex: number
}

export interface ViewerSide {
	iframe: HTMLIFrameElement
	chapter: number
	width: number
	height: number
}

export enum CurrentViewer {
	First = 1,
	Second = 2,
	Third = 3
}

export enum ViewerPosition {
	Current,
	Next,
	Previous
}

export enum SwipeDirection {
	None,
	Horizontal,
	Vertical
}

export enum NavigationDirection {
	Forward,
	Back,
	None
}