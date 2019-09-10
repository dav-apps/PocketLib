import { Component, HostListener, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { DataService } from 'src/app/services/data-service';
import { PdfBook } from 'src/app/models/PdfBook';
import { enUS } from 'src/locales/locales';
declare var $: any;

const currentViewerZIndex = -2;
const nextPageViewerZIndex = -3;
const previousPageViewerZIndex = -1;
const touchStart = "touchstart";
const touchMove = "touchmove";
const touchEnd = "touchend";
const defaultViewerTransitionTime = 0.5;
const defaultBottomToolbarTransitionTime = 0.2;
const bottomToolbarMarginBottomOpened = 0;
const bottomToolbarMarginBottomClosed = -40;

@Component({
	selector: 'pocketlib-pdf-content',
	templateUrl: './pdf-content.component.html',
	styleUrls: [
		"./pdf-content.component.scss"
	]
})
export class PdfContentComponent{
	locale = enUS.pdfContent;
	pdfContent: Uint8Array = null;
	currentBook: PdfBook;
	currentPage: number = 0;
	viewerPage: number;
	viewer2Page: number;
	viewer3Page: number;
	totalPages: number = 0;
	isLoaded: boolean = false;
	initialized: boolean = false;
	goingBack: boolean = false;
	showSecondPage: boolean = false;
	firstPage: boolean = false;	// If true, hides the previous button
	lastPage: boolean = false;		// If true, hides the next button

	viewerRatio: number = 0;
	viewerWidth: number = 500;
   width: number = 500;			// The width of the entire window
	height: number = 500;		// The height of the entire window
	
	currentViewer: CurrentViewer = CurrentViewer.First;	// Shows, which viewer is currently visible
	viewerPositionLeft: number = 0;		// How much the viewer is moved to the right
	viewer2PositionLeft: number = 0;
	viewer3PositionLeft: number = 0;
	viewerZIndex: number = 0;				// The z-index of the viewer; -1, -2 or -3
	viewer2ZIndex: number = 0;
	viewer3ZIndex: number = 0;
	viewerTransitionTime: number = defaultViewerTransitionTime;

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
	showBottomToolbar: boolean = false;		// Whether the bottom toolbar is visible
	bottomToolbarOpened: boolean = false;		// Whether the bottom toolbar is opened or closed
	bottomToolbarMarginBottom: number = -40;	// The margin bottom of the bottom toolbar
	bottomToolbarTransitionTime: number = defaultBottomToolbarTransitionTime;
	//#endregion

	//#region Variables for Booksmarks panel
	currentPageBookmarked: boolean = false;
	showBookmarksPanel: boolean = false;
	//#endregion

	constructor(
		private dataService: DataService,
		private router: Router,
		private ngZone: NgZone
	){
		this.locale = this.dataService.GetLocale().pdfContent;
	}

   async ngOnInit(){
		this.currentBook = this.dataService.currentBook as PdfBook;
		this.setSize();

		// Read the book blob as UInt8Array
		let readPromise: Promise<ProgressEvent> = new Promise(resolve => {
			let fileReader = new FileReader();
			fileReader.onload = resolve;
			fileReader.readAsArrayBuffer(this.dataService.currentBook.file);
		});
		this.pdfContent = (await readPromise).target["result"];

		// Customize pdf-viewer styles
		let containers = document.getElementsByClassName('ng2-pdf-viewer-container');
		for(let i = 0; i < containers.length; i++){
			containers.item(i).setAttribute("style", "overflow-x: hidden");
		}

		// Bind the keydown and wheel events
		$(document).unbind().keydown((e) => this.onKeyDown(e.keyCode));
		$(document).bind('mousewheel', (e) => this.onMouseWheel(e.originalEvent.wheelDelta));

		// Bind the touch events
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
   
   @HostListener('window:resize')
	onResize(){
		this.setSize();
	}
   
   async setSize(){
      this.width = window.innerWidth;
		this.height = window.innerHeight;
		this.setViewerSize();

		this.showBottomToolbar = this.width < 500;
		this.showSecondPage = this.viewerWidth * 2 < this.width;

		if(this.showSecondPage && this.currentPage > 0 && this.currentPage % 2 == 0) this.currentPage--;

		if(this.initialized){
			await this.ShowPage(false, false, this.currentPage);
		}
	}
	
	setViewerSize(){
		if(!this.initialized) return;

		// width = height * viewerRadio
		let newWidth = this.height * this.viewerRatio;
		if(newWidth > this.width){
			this.viewerWidth = this.width;
		}else{
			this.viewerWidth = newWidth - 10;
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
	 */
	async ShowPage(slideForward: boolean = false, slideBack: boolean = false, newPage: number){
		// slideForward && !slideBack ?
			// Move 1 -> 3, 3 -> 2 and 2 -> 1
			// viewer 2 is now the currently visible viewer
			// Update the page of viewer 3
		// !slideForward && slideBack ?
			// Move 1 -> 2, 2 -> 3 and 3 -> 1
			// viewer 3 is now the currently visible viewer
			// Update the page of viewer 2
		// !slideForward && !slideBack ?
			// Update the pages
			// Update the position and z-index of the viewers

		if(slideForward && !slideBack){
			// Move to the next viewer
			this.MoveViewersClockwise();

			// Update the pages
			this.UpdatePages(newPage);
		}else if(!slideForward && slideBack){
			// Move to the previous viewer
			this.MoveViewersCounterClockwise();

			// Update the pages
			this.UpdatePages(newPage);
		}else if(!slideForward && !slideBack){
			// Update the pages
			this.UpdatePages(newPage);

			// Update the positions of the viewers
			this.SetLeftOfCurrentViewer(0);
			this.SetLeftOfNextViewer(0);
			this.SetLeftOfPreviousViewer(-this.width);

			// Update the z-index of the viewers
			this.SetZIndexOfCurrentViewer(currentViewerZIndex);
			this.SetZIndexOfNextViewer(nextPageViewerZIndex);
			this.SetZIndexOfPreviousViewer(previousPageViewerZIndex);
      }
      
      // Save the new progress
		await this.currentBook.SetPage(this.currentPage);
		
		// Set currentPageBookmarked
		if(this.showSecondPage){
			this.currentPageBookmarked = this.currentBook.bookmarks.includes(this.currentPage) || this.currentBook.bookmarks.includes(this.currentPage + 1);
		}else{
			this.currentPageBookmarked = this.currentBook.bookmarks.includes(this.currentPage);
		}
	}

	MoveViewersClockwise(){
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
	}

	MoveViewersCounterClockwise(){
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
	}

	UpdatePages(newPage: number){
		this.currentPage = newPage;

		let pageDiff = this.showSecondPage ? 2 : 1;
		this.SetPageOfCurrentViewer(this.currentPage);
		this.SetPageOfNextViewer(this.currentPage + pageDiff);
		this.SetPageOfPreviousViewer(this.currentPage - pageDiff);

		// Update firstPage and lastPage
		this.firstPage = this.currentPage <= 1;
		this.lastPage = this.currentPage >= this.totalPages;
	}
   
   async PrevPage(){
		if(this.firstPage) return;

		this.goingBack = true;
		await this.ShowPage(false, true, this.currentPage - (this.showSecondPage ? 2 : 1));
   }

   async NextPage(){
		if(this.lastPage) return;

		this.goingBack = false;
		await this.ShowPage(true, false, this.currentPage + (this.showSecondPage ? 2 : 1));
	}

	GoBack(){
		this.router.navigate(["/"]);
	}

	PdfLoaded(data: any){
		this.totalPages = data.numPages;
	}
	
	PageRendered(e: CustomEvent){
		if(this.initialized) return;
		this.initialized = true;
		
		let pdfViewer = document.getElementById("viewer-left");
		let pdfViewerHeightString = getComputedStyle(pdfViewer).height;
		let pdfViewerWidthString = getComputedStyle(pdfViewer).width;

		let pdfViewerHeight = +pdfViewerHeightString.replace('px', '');
		let pdfViewerWidth = +pdfViewerWidthString.replace('px', '');

		this.viewerRatio = pdfViewerWidth / pdfViewerHeight;

		this.currentPage = this.currentBook.page;
		this.setSize();
		this.ShowPage(false, false, this.currentBook.page);
	}

	onKeyDown(keyCode: number){
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
		if(wheelDelta > 0){
			// Wheel up
			this.ngZone.run(() => this.PrevPage());
		}else{
			// Wheel down
			this.ngZone.run(() => this.NextPage());
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

	async AddOrRemoveBookmark(){
		let removeBookmark: boolean = false;

		if(this.showSecondPage){
			removeBookmark = this.currentBook.bookmarks.includes(this.currentPage) || this.currentBook.bookmarks.includes(this.currentPage + 1);
		}else{
			removeBookmark = this.currentBook.bookmarks.includes(this.currentPage);
		}
		
		if(removeBookmark && this.showSecondPage){
			await this.currentBook.RemoveBookmarks(this.currentPage, this.currentPage + 1);
		}else if(removeBookmark){
			await this.currentBook.RemoveBookmark(this.currentPage);
		}else{
			this.currentBook.AddBookmark(this.currentPage);
		}

		this.currentPageBookmarked = !removeBookmark;
   }
   
   NavigateToPage(page: number){
      this.showBookmarksPanel = false;
      this.ShowPage(false, false, page);

      return false;
   }

	SetPageOfCurrentViewer(page: number){
		switch(this.currentViewer){
			case CurrentViewer.First:
				this.viewerPage = page;
				break;
			case CurrentViewer.Second:
				this.viewer2Page = page;
				break;
			case CurrentViewer.Third:
				this.viewer3Page = page;
				break;
		}
	}

	SetPageOfNextViewer(page: number){
		switch(this.currentViewer){
			case CurrentViewer.First:
				this.viewer2Page = page;
				break;
			case CurrentViewer.Second:
				this.viewer3Page = page;
				break;
			case CurrentViewer.Third:
				this.viewerPage = page;
				break;
		}
	}

	SetPageOfPreviousViewer(page: number){
		switch(this.currentViewer){
			case CurrentViewer.First:
				this.viewer3Page = page;
				break;
			case CurrentViewer.Second:
				this.viewerPage = page;
				break;
			case CurrentViewer.Third:
				this.viewer2Page = page;
				break;
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
}

enum CurrentViewer{
	First = 1,
	Second = 2,
	Third = 3
}

enum SwipeDirection{
	Horizontal,
	Vertical
}