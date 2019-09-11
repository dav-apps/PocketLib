import { Component, HostListener, NgZone, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { DataService } from 'src/app/services/data-service';
import { ChaptersTreeComponent } from '../chapters-tree/chapters-tree.component';
import { enUS } from 'src/locales/locales';
import { EpubBook } from 'src/app/models/EpubBook';
import { EpubReader } from 'src/app/models/EpubReader';
declare var $: any;

const secondPageMinWidth = 1050;		// Show two pages on the window if the window width is greater than this
const progressFactor = 100000;		// The factor with which the progress is saved
const currentViewerZIndex = -2;
const nextPageViewerZIndex = -3;
const previousPageViewerZIndex = -1;
const touchStart = "touchstart";
const touchMove = "touchmove";
const touchEnd = "touchend";
const bottomToolbarMarginBottomOpened = 0;
const bottomToolbarMarginBottomClosed = -40;
const defaultViewerTransitionTime = 0.5;
const defaultBottomToolbarTransitionTime = 0.2;

@Component({
	selector: 'pocketlib-epub-content',
	templateUrl: './epub-content.component.html',
	styleUrls: [
      './epub-content.component.scss'
   ]
})
export class EpubContentComponent{
	locale = enUS.epubContent;
	book = new EpubReader();
	currentBook: EpubBook;
	chapters: BookChapter[] = [];
	initialized: boolean = false;

	viewerLeft: HTMLIFrameElement;
   viewerRight: HTMLIFrameElement;
   viewerLeft2: HTMLIFrameElement;
	viewerRight2: HTMLIFrameElement;
	viewerLeft3: HTMLIFrameElement;
	viewerRight3: HTMLIFrameElement;
	width: number = 500;				// The width of the entire window
	height: number = 500;			// The height of the entire window
	contentHeight: number = 500;	// The height of the iframe (height - 7 - paddingTop)
   paddingX: number = 0;
	paddingTop: number = 80;
	paddingBottom: number = 60;
	viewerLeftWidth: number = 500;
	viewerRightWidth: number = 500;		// The height of the viewers
	viewerLeftHeight: number = 300;
	viewerRightHeight: number = 300;
	viewer2LeftHeight: number = 300;
	viewer2RightHeight: number = 300;
	viewer3LeftHeight: number = 300;
	viewer3RightHeight: number = 300;
	viewerPositionLeft: number = 0;	// How much the viewer is moved to the right
	viewer2PositionLeft: number = 0;
	viewer3PositionLeft: number = 0;
	viewerZIndex: number = -1;    // -1, -2 or -3
   viewer2ZIndex: number = -2;
	viewer3ZIndex: number = -3;
	viewerTransitionTime: number = defaultViewerTransitionTime;

	currentChapter: number = 0;			// The current chapter index in this.chapters
	currentPage: number = 0;				// The current page in the current chapter
	currentChapterTitle: string = "";	// The title of the current chapter
   
   firstPage: boolean = false;	// If true, hides the previous button
	lastPage: boolean = false;		// If true, hides the next button
	currentViewer: CurrentViewer = CurrentViewer.First;	// Shows, which viewer is currently visible
	goingBack: boolean = false;	// If true, the viewer goes to the previous page
	showPageRunning: boolean = false;	// If true, ShowPage is currently executing
	runNextPageAfterRender: boolean = false;	// If true, NextPage will be called another time
	runPrevPageAfterRender: boolean = false;	// If true, PrevPage will be called another time
	navigationHistory: {chapter: number, page: number}[] = [];		// The history of visited pages, is used when clicking a link

	//#region Variables for finding the chapter page positions
	pageHeight: number = 500;
	pagePositions: number[] = [];
	//#endregion

	//#region Variables for touch events
	swipeDirection: SwipeDirection = SwipeDirection.Horizontal;	// Whether the user swipes vertically or horizontally
	swipeStart: boolean = false;
	touchStartX: number = 0;
   touchStartY: number = 0;
   touchDiffX: number = 0;
	touchDiffY: number = 0;
	touchStartBottomToolbarMarginBottom: number = -40;	// The margin bottom of the bottom toolbar at the moment of the beginning of the swipe
	//#endregion

	//#region Variables for the bottom toolbar
	showBottomToolbar: boolean = false;       // Whether the bottom toolbar is visible
	bottomToolbarOpened: boolean = false;		// Whether the bottom toolbar is opened or closed
	bottomToolbarMarginBottom: number = -40;	// The margin bottom of the bottom toolbar
	bottomToolbarTransitionTime: number = defaultBottomToolbarTransitionTime;
   //#endregion
	
	//#region Variables for the chapters panel
   showChaptersPanel: boolean = false;
	@ViewChild('chaptersTree', { static: true }) chapterTree: ChaptersTreeComponent;
	chaptersPanelStyles = {
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

	constructor(
		private dataService: DataService,
		private router: Router,
		private ngZone: NgZone
	){
		this.locale = this.dataService.GetLocale().epubContent;
	}

	async ngOnInit(){
		this.currentBook = this.dataService.currentBook as EpubBook;

		// Initialize the html element variables
		this.viewerLeft = document.getElementById("viewer-left") as HTMLIFrameElement;
      this.viewerRight = document.getElementById("viewer-right") as HTMLIFrameElement;
      this.viewerLeft2 = document.getElementById("viewer-left2") as HTMLIFrameElement;
		this.viewerRight2 = document.getElementById("viewer-right2") as HTMLIFrameElement;
		this.viewerLeft3 = document.getElementById("viewer-left3") as HTMLIFrameElement;
		this.viewerRight3 = document.getElementById("viewer-right3") as HTMLIFrameElement;
		this.navigationHistory = [];
      this.setSize();

		if(this.dataService.currentBook){
			// Load the ebook
			await this.book.ReadEpubFile(this.dataService.currentBook.file);

			// Create a chapter for each chapter of the book
			this.chapters = [];
			for(let i = 0; i < this.book.chapters.length; i++){
				let bookChapter = this.book.chapters[i];
				let chapter = new BookChapter();

				let index = bookChapter.filePath.lastIndexOf('/');
				if(index < 0) index = 0;

				chapter.filename = bookChapter.filePath.slice(index + 1);
				this.chapters.push(chapter);
			}

			// Get the current chapter and progress of the book
			let chapter = this.currentBook.chapter;
			let progress = this.currentBook.progress;
			this.currentChapter = chapter;
			this.currentViewer = CurrentViewer.First;
			
			this.initialized = true;
         await this.ShowPage(NavigationDirection.None, progress);
         
         this.chapterTree.Init(this.book.toc);
		}

		// Bind the keydown and wheel events
		$(document).unbind().keydown((e) => this.onKeyDown(e.keyCode));
		$(document).bind('mousewheel', (e) => this.onMouseWheel(e.originalEvent.wheelDelta));
		
		document.getElementById('viewer').addEventListener(touchStart, (e: TouchEvent) => this.ngZone.run(() => this.HandleTouch(e)));
		document.getElementById('viewer2').addEventListener(touchStart, (e: TouchEvent) => this.ngZone.run(() => this.HandleTouch(e)));
		document.getElementById('viewer3').addEventListener(touchStart, (e: TouchEvent) => this.ngZone.run(() => this.HandleTouch(e)));
		document.getElementById('viewer').addEventListener(touchMove, (e: TouchEvent) => this.ngZone.run(() => this.HandleTouch(e)));
		document.getElementById('viewer2').addEventListener(touchMove, (e: TouchEvent) => this.ngZone.run(() => this.HandleTouch(e)));
		document.getElementById('viewer3').addEventListener(touchMove, (e: TouchEvent) => this.ngZone.run(() => this.HandleTouch(e)));
		document.getElementById('viewer').addEventListener(touchEnd, (e: TouchEvent) => this.ngZone.run(() => this.HandleTouch(e)));
		document.getElementById('viewer2').addEventListener(touchEnd, (e: TouchEvent) => this.ngZone.run(() => this.HandleTouch(e)));
		document.getElementById('viewer3').addEventListener(touchEnd, (e: TouchEvent) => this.ngZone.run(() => this.HandleTouch(e)));
   }
   
   ngOnDestroy(){
      $(document).unbind();
   }

	@HostListener('window:resize')
	onResize(){
		this.setSize();
	}

	onKeyDown(keyCode: number){
		if(this.showChaptersPanel) return;

		switch (keyCode) {
			case 8:		// Back key
				this.ngZone.run(() => this.GoBack());
				break;
			case 37:		// Left arrow key
				this.ngZone.run(() => this.PrevPage());
				break;
			case 39:		// Right arrow key
				this.ngZone.run(() => this.NextPage());
				break;
		}
	}

	onMouseWheel(wheelDelta: number){
		if(this.showChaptersPanel) return;

		if(wheelDelta > 0){
			// Wheel up
			this.ngZone.run(() => this.PrevPage());
		}else{
			// Wheel down
			this.ngZone.run(() => this.NextPage());
		}
	}

	async setSize(){
		this.width = window.innerWidth;
		this.height = window.innerHeight;
		this.contentHeight = this.height - this.paddingTop;
		this.pageHeight = this.contentHeight - this.paddingBottom;
		this.paddingX = Math.round(this.width * 0.1);

		this.showBottomToolbar = this.width < 500;
      
      if(this.width > secondPageMinWidth){
         // Show both pages
			this.viewerLeftWidth = this.width / 2;
			this.viewerRightWidth = this.width / 2;
      }else{
         // Hide the second page
			this.viewerLeftWidth = this.width;
			this.viewerRightWidth = 0;
      }

		if(this.initialized){
			await this.ShowPage(NavigationDirection.None);
		}
	}

	async PrevPage(){
		if(this.showPageRunning){
			this.runPrevPageAfterRender = true;
			return;
		}
		this.showPageRunning = true;

		this.goingBack = true;
		if((this.width > secondPageMinWidth && this.currentPage <= 1)
			|| (this.width <= secondPageMinWidth && this.currentPage <= 0)){
			// Show the previous chapter
			if(this.currentChapter <= 0) return;
			this.currentChapter--;
			let chapter = this.chapters[this.currentChapter];

			this.currentPage = chapter.pagePositions.length - 1;
			if(this.width > secondPageMinWidth && this.currentPage % 2 == 1) this.currentPage--;
		}else if(this.width > secondPageMinWidth){
			// Go to the second previous page
			this.currentPage -= 2;
		}else{
			// Show the previous page
			this.currentPage--;
		}

		await this.ShowPage(NavigationDirection.Back);
		this.goingBack = false;

		if(this.runNextPageAfterRender){
			this.runNextPageAfterRender = false;
			this.NextPage();
		}else if(this.runPrevPageAfterRender){
			this.runPrevPageAfterRender = false;
			this.PrevPage();
		}
	}

	async NextPage(){
		if(this.showPageRunning){
			this.runNextPageAfterRender = true;
			return;
		}
		this.showPageRunning = true;

		// Return if this is the last chapter and the last page
		if(this.currentChapter >= this.chapters.length - 1 
			&& this.currentPage >= this.chapters[this.chapters.length - 1].pagePositions.length - (this.width > secondPageMinWidth ? 2 : 1)) return;

		let chapter = this.chapters[this.currentChapter];

		if((this.width > secondPageMinWidth && this.currentPage >= chapter.pagePositions.length - 2)
			|| (this.width <= secondPageMinWidth && this.currentPage >= chapter.pagePositions.length - 1)){
			// Show the next chapter
			this.currentChapter++;
			this.currentPage = 0;
		}else if(this.width > secondPageMinWidth){
			// Go to the second next page
			this.currentPage += 2;
		}else{
			// Show the next page
			this.currentPage++;
		}

		await this.ShowPage(NavigationDirection.Forward);

		if(this.runNextPageAfterRender){
			this.runNextPageAfterRender = false;
			this.NextPage();
		}else if(this.runPrevPageAfterRender){
			this.runPrevPageAfterRender = false;
			this.PrevPage();
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
	async ShowPage(direction: NavigationDirection = NavigationDirection.None, progress: number = -1, elementId: string = null){
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
		
		if(direction == NavigationDirection.Forward){
			// Move the viewer positions
			await this.MoveViewersClockwise();

			// Render the next page
			await this.RenderNextPage();
		}else if(direction == NavigationDirection.Back){
			// Move the viewer positions
			await this.MoveViewersCounterClockwise();

			// Render the previous page
			await this.RenderPreviousPage();
		}else{
			// Render the current page on the next page viewer
			await this.RenderCurrentPage(ViewerPosition.Next, progress, elementId);

			// Move the viewer positions
			await this.MoveViewersClockwise();

			// Render the next page
			await this.RenderNextPage();

			// Render the previous page
			await this.RenderPreviousPage();
		}

		let currentLeftViewer = this.GetCurrentViewer();
		let currentRightViewer = this.GetCurrentViewer(true);
		let currentChapter = this.chapters[this.currentChapter];

		// Bind the keydown and wheel events to the viewer documents
		$(currentLeftViewer.contentWindow).keydown((e: any) => this.onKeyDown(e.keyCode));
		$(currentRightViewer.contentWindow).keydown((e: any) => this.onKeyDown(e.keyCode));
		$(currentLeftViewer.contentWindow).bind('mousewheel', (e: any) => this.onMouseWheel(e.originalEvent.wheelDelta));
		$(currentRightViewer.contentWindow).bind('mousewheel', (e: any) => this.onMouseWheel(e.originalEvent.wheelDelta));
      currentLeftViewer.contentWindow.focus();
      
      currentLeftViewer.contentWindow.addEventListener(touchStart, (e: TouchEvent) => this.ngZone.run(() => this.HandleTouch(e)));
		currentRightViewer.contentWindow.addEventListener(touchStart, (e: TouchEvent) => this.ngZone.run(() => this.HandleTouch(e)));
		currentLeftViewer.contentWindow.addEventListener(touchMove, (e: TouchEvent) => this.ngZone.run(() => this.HandleTouch(e)));
		currentRightViewer.contentWindow.addEventListener(touchMove, (e: TouchEvent) => this.ngZone.run(() => this.HandleTouch(e)));
		currentLeftViewer.contentWindow.addEventListener(touchEnd, (e: TouchEvent) => this.ngZone.run(() => this.HandleTouch(e)));
		currentRightViewer.contentWindow.addEventListener(touchEnd, (e: TouchEvent) => this.ngZone.run(() => this.HandleTouch(e)));

		// Adapt the links of the left viewer
		let linkTags = currentLeftViewer.contentWindow.document.getElementsByTagName("a");
		for(let i = 0; i < linkTags.length; i++){
			Utils.AdaptLinkTag(linkTags.item(i), (href: string) => this.ngZone.run(() => this.NavigateToLink(href)));
		}

		// Adapt the links of the right viewer
		linkTags = currentRightViewer.contentWindow.document.getElementsByTagName("a");
		for(let i = 0; i < linkTags.length; i++){
			Utils.AdaptLinkTag(linkTags.item(i), (href: string) => this.ngZone.run(() => this.NavigateToLink(href)));
		}

		this.setFirstLastPage();
		this.LoadCurrentChapterTitle();

		if(progress == -1){
			// Calculate the new progress
			let currentPagePosition = currentChapter.pagePositions[this.currentPage];
			let lastPagePosition = currentChapter.pagePositions[currentChapter.pagePositions.length - 1];
			let newProgress = currentPagePosition / lastPagePosition;
			
			if(isNaN(newProgress)){
				newProgress = 0;
			}else{
				newProgress = Math.ceil(newProgress * progressFactor);
			}

			// Save the new progress
			await this.currentBook.SetPosition(this.currentChapter, newProgress);
		}

		this.showPageRunning = false;
	}

	async RenderNextPage(){
		let nextLeftViewer = this.GetNextViewer();
		let nextRightViewer = this.GetNextViewer(true);

		let nextPage = this.currentPage + 1;
		if(this.width > secondPageMinWidth) nextPage++;

		let chapter = await this.GenerateChapterHtml(this.currentChapter);
		if(!chapter) return;

		// Render the chapter and generate chapter pages
		await Utils.RenderHtml(chapter.GetHtml().outerHTML, nextLeftViewer);

		this.CreateCurrentChapterPages(nextLeftViewer);
		for(let position of this.pagePositions){
			chapter.pagePositions.push(position);
		}

		// Check if the next chapter should be rendered
		let renderNextChapter = nextPage >= chapter.pagePositions.length;
		if(renderNextChapter && this.currentChapter >= this.chapters.length - 1) return;

		if(renderNextChapter){
			// Render the next chapter
			nextPage = 0;
			chapter = await this.GenerateChapterHtml(this.currentChapter + 1);
			if(!chapter) return;

			await Utils.RenderHtml(chapter.GetHtml().outerHTML, nextLeftViewer);

			this.CreateCurrentChapterPages(nextLeftViewer);
			for(let position of this.pagePositions){
				chapter.pagePositions.push(position);
			}
		}else{
			this.chapters[this.currentChapter] = chapter;
		}

		if(this.width > secondPageMinWidth && nextPage < chapter.pagePositions.length - 1){
			// Render the chapter on the second page
			await Utils.RenderHtml(chapter.GetHtml().outerHTML, nextRightViewer);
		}else if(this.width > secondPageMinWidth){
			// Clear the second page
			nextRightViewer.srcdoc = "";
		}

		// Scroll the left viewer
		nextLeftViewer.contentWindow.scrollTo(0, chapter.pagePositions[nextPage]);
		if(this.width > secondPageMinWidth && chapter.pagePositions[nextPage + 1]){
			// Scroll the right viewer
			nextRightViewer.contentWindow.scrollTo(0, chapter.pagePositions[nextPage + 1]);
		}

		// Update the height of the left viewer
		// height of iframe = difference between the position of the next page and the position of the current page
		let newViewerLeftHeight = (chapter.pagePositions[nextPage + 1] - chapter.pagePositions[nextPage]);
		this.SetHeightOfNextViewer((newViewerLeftHeight < 0 || isNaN(newViewerLeftHeight)) ? this.contentHeight - 8 : newViewerLeftHeight);

		// Update the height of the right viewer
		if(this.width > secondPageMinWidth){
			if(nextPage == chapter.pagePositions.length - 1){
				// The last page is shown on the left page
				// Hide the right page
				this.SetHeightOfNextViewer(0, true);
			}else if(nextPage == chapter.pagePositions.length - 2){
				// Ths last page is shown on the right page
				// Show the entire right page
				this.SetHeightOfNextViewer(this.contentHeight - 8, true);
			}else{
				let newViewerRightHeight = (chapter.pagePositions[nextPage + 2] - chapter.pagePositions[nextPage + 1]);
				this.SetHeightOfNextViewer((newViewerRightHeight < 0 || isNaN(newViewerRightHeight)) ? this.contentHeight - 8 : newViewerRightHeight, true);
			}
		}
	}

	async RenderPreviousPage(){
		let previousLeftViewer = this.GetPreviousViewer();
		let previousRightViewer = this.GetPreviousViewer(true);

		let previousPage = this.currentPage - 1;
		if(this.width > secondPageMinWidth) previousPage--;

		let chapter = await this.GenerateChapterHtml(this.currentChapter);
		if(!chapter) return;

		// Render the chapter and generate chapter pages
		await Utils.RenderHtml(chapter.GetHtml().outerHTML, previousLeftViewer);

		this.CreateCurrentChapterPages(previousLeftViewer);
		for(let position of this.pagePositions){
			chapter.pagePositions.push(position);
		}

		// Check if the previous chapter should be rendered
		let renderPreviousChapter = this.currentPage == 0;
		if(renderPreviousChapter && this.currentChapter == 0) return;

		if(renderPreviousChapter){
			// Render the previous chapter
			chapter = await this.GenerateChapterHtml(this.currentChapter - 1);
			if(!chapter) return;

			await Utils.RenderHtml(chapter.GetHtml().outerHTML, previousLeftViewer);

			this.CreateCurrentChapterPages(previousLeftViewer);
			for(let position of this.pagePositions){
				chapter.pagePositions.push(position);
			}

			// Update previousPage after generating pagePositions of the previous chapter
			previousPage = chapter.pagePositions.length - 1;
			if(this.width > secondPageMinWidth && previousPage % 2 == 1) previousPage--;
		}else{
			this.chapters[this.currentChapter] = chapter;
		}

		if(this.width > secondPageMinWidth && previousPage < chapter.pagePositions.length - 1){
			// Render the chapter on the second page
			await Utils.RenderHtml(chapter.GetHtml().outerHTML, previousRightViewer);
		}else if(this.width > secondPageMinWidth){
			// Clear the second page
			previousRightViewer.srcdoc = "";
		}

		// Scroll the left viewer
		previousLeftViewer.contentWindow.scrollTo(0, chapter.pagePositions[previousPage]);
		if(this.width > secondPageMinWidth && chapter.pagePositions[previousPage + 1]){
			// Scroll the right viewer
			previousRightViewer.contentWindow.scrollTo(0, chapter.pagePositions[previousPage + 1]);
		}

		// Update the height of the left viewer
		// height of iframe = difference between the position of the next page and the position of the current page
		let newViewerLeftHeight = (chapter.pagePositions[previousPage + 1] - chapter.pagePositions[previousPage]);
		this.SetHeightOfPreviousViewer((newViewerLeftHeight < 0 || isNaN(newViewerLeftHeight)) ? this.contentHeight - 8 : newViewerLeftHeight);

		// Update the height of the right viewer
		if(this.width > secondPageMinWidth){
			if(previousPage == chapter.pagePositions.length - 1){
				// The last page is shown on the left page
				// Hide the right page
				this.SetHeightOfPreviousViewer(0, true);
			}else if(previousPage == chapter.pagePositions.length - 2){
				// Ths last page is shown on the right page
				// Show the entire right page
				this.SetHeightOfPreviousViewer(this.contentHeight - 8, true);
			}else{
				let newViewerRightHeight = (chapter.pagePositions[previousPage + 2] - chapter.pagePositions[previousPage + 1]);
				this.SetHeightOfPreviousViewer((newViewerRightHeight < 0 || isNaN(newViewerRightHeight)) ? this.contentHeight - 8 : newViewerRightHeight, true);
			}
		}
	}

	async RenderCurrentPage(viewer: ViewerPosition, progress: number = -1, elementId: string = null){
		let leftViewer = this.GetViewer(viewer);
		let rightViewer = this.GetViewer(viewer, true);

		let chapter = await this.GenerateChapterHtml(this.currentChapter);
		if(!chapter) return;

		// Render the chapter
		await Utils.RenderHtml(chapter.GetHtml().outerHTML, leftViewer);

		this.CreateCurrentChapterPages(leftViewer);
		for(let position of this.pagePositions){
			chapter.pagePositions.push(position);
		}

		if(this.width > secondPageMinWidth && this.currentPage < chapter.pagePositions.length - 1){
			// Render the chapter on the second page
			await Utils.RenderHtml(chapter.GetHtml().outerHTML, rightViewer);
		}else if(this.width > secondPageMinWidth){
			// Clear the second page
			rightViewer.srcdoc = "";
		}

		if(progress >= 0){
			// Update the current page according to the progress
			let lastPosition = chapter.pagePositions[chapter.pagePositions.length - 1];
			let progressPercent = progress / progressFactor;
			let progressPosition = lastPosition * progressPercent;

			// Find the page of the position
			let page = Utils.FindPageForPosition(progressPosition, chapter.pagePositions);
			if(page != -1){
				// If it shows two pages and the tag is on the second page, set the current page to the previous page
				if(this.width > secondPageMinWidth && page % 2 == 1) page -= 1;
				this.currentPage = page;
			}
		}else if(elementId){
			// Find the position of the tag
			let position = Utils.FindPositionById(leftViewer.contentWindow.document.getElementsByTagName("body")[0] as HTMLBodyElement, elementId);

			if(position != -1){
				// Find the page of the position
				let page = Utils.FindPageForPosition(position, chapter.pagePositions);
				if(page != -1){
					// If it shows two pages and the tag is on the second page, set the current page to the previous page
					if(this.width > secondPageMinWidth && page % 2 == 1) page -= 1;
					this.currentPage = page;
				}
			}
		}

		// Scroll the left viewer
		leftViewer.contentWindow.scrollTo(0, chapter.pagePositions[this.currentPage]);
		if(this.width > secondPageMinWidth && chapter.pagePositions[this.currentPage + 1]){
			// Scroll the right viewer
			rightViewer.contentWindow.scrollTo(0, chapter.pagePositions[this.currentPage + 1]);
		}

		// Update the height of the left viewer
		// height of iframe = difference between the position of the next page and the position of the current page
		let newViewerLeftHeight = (chapter.pagePositions[this.currentPage + 1] - chapter.pagePositions[this.currentPage]);
		this.SetHeightOfViewer(viewer, (newViewerLeftHeight < 0 || isNaN(newViewerLeftHeight)) ? this.contentHeight - 8 : newViewerLeftHeight);

		// Update the height of the right viewer
		if(this.width > secondPageMinWidth){
			if(this.currentPage == chapter.pagePositions.length - 1){
				// The last page is shown on the left page
				// Hide the right page
				this.SetHeightOfViewer(viewer, 0, true);
			}else if(this.currentPage == chapter.pagePositions.length - 2){
				// Ths last page is shown on the right page
				// Show the entire right page
				this.SetHeightOfViewer(viewer, this.contentHeight - 8, true);
			}else{
				let newViewerRightHeight = (chapter.pagePositions[this.currentPage + 2] - chapter.pagePositions[this.currentPage + 1]);
				this.SetHeightOfViewer(viewer, (newViewerRightHeight < 0 || isNaN(newViewerRightHeight)) ? this.contentHeight - 8 : newViewerRightHeight, true);
			}
		}
   }
   
   HandleTouch(event: TouchEvent){
		if(event.touches.length > 1) return;

		if(event.type == touchStart){
			let touch = event.touches.item(0);
			this.touchStartX = touch.pageX;
			this.touchStartY = touch.pageY;
			this.swipeStart = true;

			this.viewerTransitionTime = 0;
			this.bottomToolbarTransitionTime = 0;
		}else if(event.type == touchMove){
			// Calculate the difference between the positions of the first touch and the current touch
			let touch = event.touches.item(0);
			this.touchDiffX = this.touchStartX - touch.pageX;
			this.touchDiffY = this.touchStartY - touch.pageY;

			if(this.swipeStart){
				// Check if the user is swiping up or down
				this.swipeDirection = Math.abs(this.touchDiffX) > Math.abs(this.touchDiffY) ? SwipeDirection.Horizontal : SwipeDirection.Vertical;
				this.touchStartBottomToolbarMarginBottom = this.bottomToolbarMarginBottom;

				this.swipeStart = false;
			}else if(this.swipeDirection == SwipeDirection.Horizontal){
				// Move the pages
				if(this.touchDiffX > 0 && !this.lastPage){
					// Swipe to the left; move the current viewer to the left
					this.SetLeftOfCurrentViewer(-this.touchDiffX);
				}else if(!this.firstPage){
					// Swipe to the right; move the left viewer to the right
					this.SetLeftOfPreviousViewer(-this.width - this.touchDiffX);
				}
			}else if(this.swipeDirection == SwipeDirection.Vertical && this.showBottomToolbar){
				// Update the margin bottom of the bottom toolbar
				this.bottomToolbarMarginBottom = this.touchStartBottomToolbarMarginBottom + (this.touchDiffY / 2);

				// Make sure the bottom toolbar does not move outside its area
				if(this.bottomToolbarMarginBottom > bottomToolbarMarginBottomOpened){
					this.bottomToolbarMarginBottom = bottomToolbarMarginBottomOpened;
					this.bottomToolbarOpened = true;
				}else if(this.bottomToolbarMarginBottom < bottomToolbarMarginBottomClosed){
					this.bottomToolbarMarginBottom = bottomToolbarMarginBottomClosed;
					this.bottomToolbarOpened = false;
				}
			}
		}else if(event.type == touchEnd){
			// Reset the transition times
			this.viewerTransitionTime = defaultViewerTransitionTime;
			this.bottomToolbarTransitionTime = defaultBottomToolbarTransitionTime;

			if(this.swipeDirection == SwipeDirection.Horizontal){
				if(this.touchDiffX > 0 && !this.lastPage){
					// If the page was swiped wide enough, show the next page
					if(this.touchDiffX > this.width * 0.15){
						this.NextPage();
					}else{
						// Move the page back
						this.SetLeftOfCurrentViewer(0);
					}
				}else if(!this.firstPage){
					// If the page was swiped wide enough, show the previous page
					if(-this.touchDiffX > this.width * 0.2){
						this.PrevPage();
					}else{
						this.SetLeftOfPreviousViewer(-this.width);
					}
				}
			}

			this.touchStartX = 0;
			this.touchStartY = 0;
			this.touchDiffX = 0;
			this.touchDiffY = 0;
		}
	}

	OpenOrCloseBottomToolbar(){
		if(this.bottomToolbarOpened){
			// Close the bottom toolbar
			this.CloseBottomToolbar();
		}else{
			// Open the bottom toolbar
			this.OpenBottomToolbar();
		}
	}

	OpenBottomToolbar(){
		this.bottomToolbarMarginBottom = bottomToolbarMarginBottomOpened;
		this.bottomToolbarOpened = true;
	}

	CloseBottomToolbar(){
		this.bottomToolbarMarginBottom = bottomToolbarMarginBottomClosed;
		this.bottomToolbarOpened = false;
	}

	OpenChaptersPanel(){
		this.showChaptersPanel = true;

		// Remove outline of the panel close button
		let closeButton = document.body.getElementsByClassName('ms-Panel-closeButton')[0];
		closeButton.setAttribute("style", `outline: none; color: ${ this.dataService.darkTheme ? 'white' : 'black' }`);
   }
   
   async AddOrRemoveBookmark(){
		// Calculate the progress of the current page
		let currentChapter = this.chapters[this.currentChapter];
		let lastPage: boolean = currentChapter.pagePositions.length == this.currentPage - 1;

		let currentPagePosition = currentChapter.pagePositions[this.currentPage];
		let nextPagePosition = lastPage ? currentPagePosition : currentChapter.pagePositions[this.currentPage + 1];
		let lastPagePosition = currentChapter.pagePositions[currentChapter.pagePositions.length - 1];

		// Get the position of the current page in the middle
		let currentNextPageDiff = lastPage ? 0 : ((nextPagePosition - currentPagePosition) / 2);
		let pageMiddlePosition = currentNextPageDiff + currentPagePosition

		// Calculate the progress from the middle position
		let progress = pageMiddlePosition / lastPagePosition;
		
		if(isNaN(progress)){
			progress = 0;
		}else{
			progress = Math.ceil(progress * progressFactor);
		}

		// Create the bookmark
		await this.currentBook.AddBookmark(this.currentChapterTitle, this.currentChapter, progress);
	}

	ChapterLinkClicked(link: string){
		this.showChaptersPanel = false;
		this.NavigateToLink(link);
	}

	/**
	 * Initializes the given chapter and adapts it to the size of the window
	 * @param chapterIndex The chapter at the position of this.chapters
	 */
	async GenerateChapterHtml(chapterIndex: number) : Promise<BookChapter>{
		let chapter = this.chapters[chapterIndex];
		if(!chapter) return null;

		let chapterHtml: HTMLHtmlElement = chapter.IsInitialized() ? chapter.GetHtml() : await this.book.chapters[chapterIndex].GetChapterHtml();
		let chapterBody = chapterHtml.getElementsByTagName("body")[0] as HTMLBodyElement;
		chapterBody.setAttribute("style", `padding: 0px ${this.paddingX}px; margin: 0px 0px 3000px 0px; color: ${this.dataService.darkTheme ? 'white !important' : 'black !important'};`);

		// Adapt the image sizes to the page size
		let imageTags = chapterHtml.getElementsByTagName("img");
		let pageWidth = this.width > secondPageMinWidth ? this.width / 2 : this.width;
		pageWidth = pageWidth - 2 * this.paddingX;

		for(let i = 0; i < imageTags.length; i++){
			Utils.AdaptImageTagDimensions(imageTags.item(i), this.contentHeight, pageWidth);
		}

		// Add spans to the texts
		let textNodes = Utils.TextNodesUnder(chapterBody);
		for(let textNode of textNodes){
			// Wrap each word inside a span
			let textNodeContent = textNode.textContent.trim();
			if(textNodeContent.length == 0) continue;

			let splittetText: string[] = textNodeContent.split(' ');
			if(splittetText.length < 10) continue;

			for(let text of splittetText){
				// Create a new span Element
				let span = document.createElement("span");
				span.innerText = text + " ";
				textNode.before(span);
			}

			textNode.parentElement.removeChild(textNode);
		}

		chapter.Init(chapterHtml, window.innerWidth, window.innerHeight);
		return chapter;
	}

	GetViewer(viewer: ViewerPosition, right: boolean = false) : HTMLIFrameElement{
		switch (viewer) {
			case ViewerPosition.Current:
				return this.GetCurrentViewer(right);
			case ViewerPosition.Next:
				return this.GetNextViewer(right);
			case ViewerPosition.Previous:
				return this.GetPreviousViewer(right);
		}
	}

	GetCurrentViewer(right: boolean = false) : HTMLIFrameElement{
		switch(this.currentViewer){
			case CurrentViewer.First:
				return right ? this.viewerRight : this.viewerLeft;
			case CurrentViewer.Second:
				return right ? this.viewerRight2 : this.viewerLeft2;
			case CurrentViewer.Third:
				return right ? this.viewerRight3 : this.viewerLeft3;
		}
	}

	GetNextViewer(right: boolean = false) : HTMLIFrameElement{
		switch(this.currentViewer){
			case CurrentViewer.First:
				return right ? this.viewerRight2 : this.viewerLeft2;
			case CurrentViewer.Second:
				return right ? this.viewerRight3 : this.viewerLeft3;
			case CurrentViewer.Third:
				return right ? this.viewerRight : this.viewerLeft;
		}
	}

	GetPreviousViewer(right: boolean = false) : HTMLIFrameElement{
		switch(this.currentViewer){
			case CurrentViewer.First:
				return right ? this.viewerRight3 : this.viewerLeft3;
			case CurrentViewer.Second:
				return right ? this.viewerRight : this.viewerLeft;
			case CurrentViewer.Third:
				return right ? this.viewerRight2 : this.viewerLeft2;
		}
	}

	SetZIndexOfCurrentViewer(zIndex: number){
		switch(this.currentViewer){
			case CurrentViewer.First:
				this.viewerZIndex = zIndex;
				break;
			case CurrentViewer.Second:
				this.viewer2ZIndex = zIndex;
				break;
			case CurrentViewer.Third:
				this.viewer3ZIndex = zIndex;
				break;
		}
	}

	SetZIndexOfNextViewer(zIndex: number){
		switch(this.currentViewer){
			case CurrentViewer.First:
				this.viewer2ZIndex = zIndex;
				break;
			case CurrentViewer.Second:
				this.viewer3ZIndex = zIndex;
				break;
			case CurrentViewer.Third:
				this.viewerZIndex = zIndex;
				break;
		}
	}

	SetZIndexOfPreviousViewer(zIndex: number){
		switch(this.currentViewer){
			case CurrentViewer.First:
				this.viewer3ZIndex = zIndex;
				break;
			case CurrentViewer.Second:
				this.viewerZIndex = zIndex;
				break;
			case CurrentViewer.Third:
				this.viewer2ZIndex = zIndex;
				break;
		}
	}

	SetLeftOfViewer(viewer: ViewerPosition, left: number){
		switch (viewer) {
			case ViewerPosition.Current:
				this.SetLeftOfCurrentViewer(left);
				break;
			case ViewerPosition.Next:
				this.SetLeftOfNextViewer(left);
				break;
			case ViewerPosition.Previous:
				this.SetLeftOfPreviousViewer(left);
				break;
		}
	}

	SetLeftOfCurrentViewer(left: number){
		switch(this.currentViewer){
			case CurrentViewer.First:
				this.viewerPositionLeft = left;
				break;
			case CurrentViewer.Second:
				this.viewer2PositionLeft = left;
				break;
			case CurrentViewer.Third:
				this.viewer3PositionLeft = left;
				break;
		}
	}

	SetLeftOfNextViewer(left: number){
		switch(this.currentViewer){
			case CurrentViewer.First:
				this.viewer2PositionLeft = left;
				break;
			case CurrentViewer.Second:
				this.viewer3PositionLeft = left;
				break;
			case CurrentViewer.Third:
				this.viewerPositionLeft = left;
				break;
		}
	}

	SetLeftOfPreviousViewer(left: number){
		switch(this.currentViewer){
			case CurrentViewer.First:
				this.viewer3PositionLeft = left;
				break;
			case CurrentViewer.Second:
				this.viewerPositionLeft = left;
				break;
			case CurrentViewer.Third:
				this.viewer2PositionLeft = left;
				break;
		}
	}

	SetHeightOfViewer(viewer: ViewerPosition, height: number, right: boolean = false){
		switch (viewer) {
			case ViewerPosition.Current:
				this.SetHeightOfCurrentViewer(height, right);
				break;
			case ViewerPosition.Next:
				this.SetHeightOfNextViewer(height, right);
				break;
			case ViewerPosition.Previous:
				this.SetHeightOfPreviousViewer(height, right);
				break;
		}
	}

	SetHeightOfCurrentViewer(height: number, right: boolean = false){
		switch(this.currentViewer){
			case CurrentViewer.First:
				if(right)	this.viewerRightHeight = height;
				else			this.viewerLeftHeight = height;
				break;
			case CurrentViewer.Second:
				if(right) 	this.viewer2RightHeight = height;
				else			this.viewer2LeftHeight = height;
				break;
			case CurrentViewer.Third:
				if(right)	this.viewer3RightHeight = height;
				else			this.viewer3LeftHeight = height;
				break;
		}
	}

	SetHeightOfNextViewer(height: number, right: boolean = false){
		switch(this.currentViewer){
			case CurrentViewer.First:
				if(right)	this.viewer2RightHeight = height;
				else			this.viewer2LeftHeight = height;
				break;
			case CurrentViewer.Second:
				if(right) 	this.viewer3RightHeight = height;
				else			this.viewer3LeftHeight = height;
				break;
			case CurrentViewer.Third:
				if(right)	this.viewerRightHeight = height;
				else			this.viewerLeftHeight = height;
				break;
		}
	}

	SetHeightOfPreviousViewer(height: number, right: boolean = false){
		switch(this.currentViewer){
			case CurrentViewer.First:
				if(right)	this.viewer3RightHeight = height;
				else			this.viewer3LeftHeight = height;
				break;
			case CurrentViewer.Second:
				if(right) 	this.viewerRightHeight = height;
				else			this.viewerLeftHeight = height;
				break;
			case CurrentViewer.Third:
				if(right)	this.viewer2RightHeight = height;
				else			this.viewer2LeftHeight = height;
				break;
		}
	}

	async MoveViewersClockwise() : Promise<void>{
		// Set the position of the viewers
		this.SetLeftOfCurrentViewer(-this.width);
		this.SetLeftOfNextViewer(0);
		this.SetLeftOfPreviousViewer(0);

		// Set the z-index of the viewers
		this.SetZIndexOfCurrentViewer(previousPageViewerZIndex);
		this.SetZIndexOfNextViewer(currentViewerZIndex);
		this.SetZIndexOfPreviousViewer(nextPageViewerZIndex);

		// Update currentViewer
		switch(this.currentViewer){
			case CurrentViewer.First:
				this.currentViewer = CurrentViewer.Second;
				break;
			case CurrentViewer.Second:
				this.currentViewer = CurrentViewer.Third;
				break;
			case CurrentViewer.Third:
				this.currentViewer = CurrentViewer.First;
				break;
		}

		return new Promise(resolve => setTimeout(resolve, this.viewerTransitionTime * 1000));
	}

	async MoveViewersCounterClockwise() : Promise<void>{
		// Set the position of the viewers
		this.SetLeftOfCurrentViewer(0);
		this.SetLeftOfNextViewer(-this.width);
		this.SetLeftOfPreviousViewer(0);

		// Set the z-index of the viewers
		this.SetZIndexOfCurrentViewer(nextPageViewerZIndex);
		this.SetZIndexOfNextViewer(previousPageViewerZIndex);
		this.SetZIndexOfPreviousViewer(currentViewerZIndex);

		// Update currentViewer
		switch(this.currentViewer){
			case CurrentViewer.First:
				this.currentViewer = CurrentViewer.Third;
				break;
			case CurrentViewer.Second:
				this.currentViewer = CurrentViewer.First;
				break;
			case CurrentViewer.Third:
				this.currentViewer = CurrentViewer.Second;
				break;
		}

		return new Promise(resolve => setTimeout(resolve, this.viewerTransitionTime * 1000));
	}

	/**
	 * Updates the firstPage and lastPage properties for updating the UI
	 */
	setFirstLastPage(){
		this.firstPage = this.currentChapter == 0 && this.currentPage == 0;
		this.lastPage = 
			(this.currentChapter == this.chapters.length - 1)
			&& (this.currentPage >= this.chapters[this.chapters.length - 1].pagePositions.length - (this.width > secondPageMinWidth ? 2 : 1));
	}

	CreateCurrentChapterPages(viewer: HTMLIFrameElement){
		Utils.positions = [];
		Utils.FindPositions(viewer.contentDocument.getElementsByTagName("body")[0] as HTMLBodyElement);
		this.pagePositions = Utils.FindOptimalPagePositions(Utils.positions, this.pageHeight);
	}

	LoadCurrentChapterTitle(){
		let chapterFilePath = this.book.chapters[this.currentChapter].filePath;

		if(chapterFilePath.includes('#')){
			// Remove the last part
			chapterFilePath = chapterFilePath.slice(0, chapterFilePath.lastIndexOf('#'));
		}

		// Find the toc item with the same href
		let tocItem = this.book.toc.find(item => {
			let itemPath = item.href;

			if(itemPath.includes('#')){
				itemPath = itemPath.slice(0, itemPath.lastIndexOf('#'));
			}

			return itemPath == chapterFilePath;
		});

		if(tocItem) this.currentChapterTitle = tocItem.title;
	}

	GoBack(){
		if(this.navigationHistory.length > 0){
			// Navigate back to the last position
			let lastPosition = this.navigationHistory.pop();
			this.currentChapter = lastPosition.chapter;
			this.currentPage = lastPosition.page;
			this.ShowPage();
		}else{
			this.router.navigate(["/"]);
		}
	}

	async NavigateToLink(href: string){
		// Get the chapter name and element id
		let hrefEnd = href;
		if(href.includes('/')){
			hrefEnd = hrefEnd.slice(href.lastIndexOf('/') + 1);
		}

		let elementId = null;
		let chapterName = hrefEnd;

		if(chapterName.includes('#')){
			elementId = chapterName.slice(chapterName.lastIndexOf('#') + 1);
			chapterName = chapterName.slice(0, chapterName.lastIndexOf('#'));
		}
		
		// Find the chapter of the href
		let linkedChapterIndex = this.chapters.findIndex((chapter: BookChapter) => chapter.filename == chapterName);
		if(linkedChapterIndex == -1) return;

		// Add the current position to the navigation history
		this.navigationHistory.push({
			chapter: this.currentChapter,
			page: this.currentPage
		});

		this.currentChapter = linkedChapterIndex;
		this.currentPage = 0;

		if(elementId){
			// Navigate to the page of the chapter with the element with the id
			let elementId = href.slice(href.lastIndexOf('#') + 1);
			await this.ShowPage(NavigationDirection.None, -1, elementId);
		}else{
			// Navigate to the first page of the chapter
			await this.ShowPage();
		}
	}
}

class Utils{
	static positions: number[] = [];

	// Go through each element and save the position
	static FindPositions(currentElement: Element){
		if(currentElement.children.length > 0){
			// Call FindPositions for each child
			for(let i = 0; i < currentElement.children.length; i++){
				let child = currentElement.children.item(i);
				this.FindPositions(child);

				let childPosition = child.getBoundingClientRect();
				let yPos = childPosition.height + childPosition.top + 1;

				if(this.positions.length == 0 || (this.positions.length > 0 && this.positions[this.positions.length - 1] != yPos)){
					this.positions.push(yPos);
				}
			}
		}
	}

	// Go through each element until the element was found, returns -1 if position was not found
	static FindPositionById(currentElement: Element, id: string) : number{
		if(currentElement.getAttribute("id") == id){
			let position = currentElement.getBoundingClientRect();
			return position.top;
		}

		if(currentElement.children.length > 0){
			// Call FindPositionById for each child
			for(let i = 0; i < currentElement.children.length; i++){
				let child = currentElement.children.item(i);
				let childPosition = this.FindPositionById(child, id);

				if(childPosition != -1){
					return childPosition;
				}
			}
		}

		return -1;
	}

	// Finds the nearest values below the page heights
	static FindOptimalPagePositions(positions: number[], pageHeight: number) : number[]{
		if(positions.length == 0) return;
		let pagePositions: number[] = [];

		for(let i = 0; i < positions.length; i++){
			let lastPosition = pagePositions.length > 0 ? pagePositions[pagePositions.length - 1] : 0;
			if(positions[i + 1] && positions[i + 1] > lastPosition + pageHeight){
				// Add the current position to the page positions
				pagePositions.push(positions[i]);
			}
		}

		return pagePositions;
	}
	
	static FindPageForPosition(position: number, pagePositions: number[]) : number{
		if(position >= pagePositions[pagePositions.length - 1]) return pagePositions.length - 1;

		for(let i = 0; i < pagePositions.length - 1; i++){
			if(position >= pagePositions[i] && position < pagePositions[i + 1]){
				return i;
			}
		}

		return -1;
	}
   
   static AdaptImageTagDimensions(tag: Node, maxHeight: number, maxWidth: number){
		// Check if the tag really is an image
		if(tag.nodeType == 3 || tag.nodeName.toLowerCase() != "img") return;

		// If the image is too large, change the height and width
		let imageTag = tag as HTMLImageElement;
		let height = +imageTag.getAttribute("height");
		let width = +imageTag.getAttribute("width");
		if(height == 0 || width == 0) return;
		
		if(height > maxHeight){
			// Change the heigth of the image to the maxHeigth and adjust the width
			imageTag.setAttribute("height", maxHeight.toString());

			// Calculate the new width and set the new width of the image tag
			let diffPercent = (100 / height) * maxHeight / 100;
			let newWidth = Math.round(width * diffPercent);
			imageTag.setAttribute("width", newWidth.toString());

			// Update the variables, for the case that the width is still too high
			height = maxHeight;
			width = newWidth;
		}

		if(width > maxWidth){
			// Change the width of the image to the maxWidth and adjust the height
			imageTag.setAttribute("width", maxWidth.toString());
			
			// Calculate the new height and set the new height of the image tag
			let diffPercent = (100 / width) * maxWidth / 100;
			let newHeight = Math.round(height * diffPercent);
			imageTag.setAttribute("height", newHeight.toString());
		}
	}

	static AdaptLinkTag(tag: Node, callback: Function){
		if(tag.nodeType == 3 || tag.nodeName.toLowerCase() != "a") return;

		let linkTag = tag as HTMLAnchorElement;
		let link = linkTag.getAttribute("href");

		if(!link) return;

		if(link.indexOf('http://') === 0 || link.indexOf('https://') === 0 || link.indexOf('www.') === 0){
			// Set target = blank
			linkTag.setAttribute("target", "blank");
		}else if(link.indexOf('mailto:') !== 0){
			linkTag.onclick = () => {
				callback(link);
				return false;
			}
		}
	}

	static RenderHtml(html: string, viewer: HTMLIFrameElement) : Promise<any>{
		let viewerLoadPromise: Promise<any> = new Promise(resolve => viewer.onload = resolve);
		viewer.srcdoc = html;
		return viewerLoadPromise;
	}

	static TextNodesUnder(el){
		var n;
		var a: Text[] = []
		var walk = document.createTreeWalker(el,NodeFilter.SHOW_TEXT, null, false);
		while(n = walk.nextNode() as Text) a.push(n);
		return a;
	}
}

export class BookChapter{
	private html: HTMLHtmlElement;				// The html of the entire chapter
	private initialized: boolean = false;		// If true, the html was added, the elements were count and the pageTemplateHtml was created
	public pagePositions: number[] = [0];		// The positions for showing the pages
	public windowWidth: number = 0;				// The window width at the time of initializing this chapter
	public windowHeight: number = 0;				// The window height at the time of initializing this chapter
	public filename: string;						// The name of the chapter file

	Init(html: HTMLHtmlElement, windowWidth: number, windowHeight: number){
		this.html = html;
		this.initialized = true;
		this.pagePositions = [0];
		this.windowWidth = windowWidth;
      this.windowHeight = windowHeight;
	}

	IsInitialized() : boolean{
		return this.initialized;
	}

	GetHtml() : HTMLHtmlElement{
		return this.html.cloneNode(true) as HTMLHtmlElement;
	}
}

enum CurrentViewer{
	First = 1,
	Second = 2,
	Third = 3
}

enum ViewerPosition{
	Current,
	Next,
	Previous
}

enum SwipeDirection{
	Horizontal,
	Vertical
}

enum NavigationDirection{
   Forward,
   Back,
   None
}