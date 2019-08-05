import { Component, HostListener, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { DataService } from 'src/app/services/data-service';
import { EpubBook } from 'src/app/models/EpubBook';
declare var $: any;

const secondPageMinWidth = 1050;		// Show two pages on the window if the window width is greater than this
const progressFactor = 100000;		// The factor with which the progress is saved

@Component({
	selector: 'pocketlib-book-content',
	templateUrl: './book-content.component.html',
	styleUrls: [
      './book-content.component.scss'
   ]
})
export class BookContentComponent{
	book = new EpubBook();
	chapters: BookChapter[] = [];
	initialized: boolean = false;

	viewerLeft: HTMLIFrameElement;
   viewerRight: HTMLIFrameElement;
   viewerLeft2: HTMLIFrameElement;
   viewerRight2: HTMLIFrameElement;
	bottomCurtainLeft: HTMLDivElement;
	bottomCurtainRight: HTMLDivElement;
	width: number = 500;
	height: number = 500;			// The height of the entire page
	contentHeight: number = 500;	// The height of the iframe (height - 7 - paddingTop)
   paddingX: number = 0;
	paddingTop: number = 60;
	paddingBottom: number = 60;
	viewerLeftWidth: number = 500;
	viewerRightWidth: number = 500;
	viewerLeftHeight: number = 300;
	viewerRightHeight: number = 300;
	viewerPositionLeft: number = 0;
	viewer2PositionLeft: number = 0;
	viewerZIndex: number = 1;	// Either 1 or -1
	viewer2ZIndex: number = -1;

	currentChapter: number = 0;
   currentPage: number = 0;
   
   firstPage: boolean = false;
	lastPage: boolean = false;
	currentViewer: CurrentViewer = CurrentViewer.First;	// Shows, which viewer is currently visible

	//#region Variables for finding the chapter page positions
	pageHeight: number = 500;
	pagePositions: number[] = [];
	//#endregion

	//#region Variables for ShowPage
	renderedChapter: number = 0;		// The currently rendered chapter, for determining if the chapter html should be rendered
   //#endregion

	navigationHistory: {chapter: number, page: number}[] = [];

	constructor(
		private dataService: DataService,
		private router: Router,
		private ngZone: NgZone
	){
		this.dataService.navbarVisible = false;
	}

	async ngOnInit(){
		// Initialize the html element variables
		this.viewerLeft = document.getElementById("viewer-left") as HTMLIFrameElement;
      this.viewerRight = document.getElementById("viewer-right") as HTMLIFrameElement;
      this.viewerLeft2 = document.getElementById("viewer-left2") as HTMLIFrameElement;
      this.viewerRight2 = document.getElementById("viewer-right2") as HTMLIFrameElement;
		this.bottomCurtainLeft = document.getElementById("bottom-curtain-left") as HTMLDivElement;
		this.bottomCurtainRight = document.getElementById("bottom-curtain-right") as HTMLDivElement;
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
			let chapter = this.dataService.currentBook.chapter;
			let progress = this.dataService.currentBook.progress;
			this.currentChapter = chapter;
			this.currentViewer = CurrentViewer.First;
			
			this.initialized = true;
			await this.ShowPage(null, null, progress, false);
		}

		// Bind the keydown and wheel events
		$(document).unbind().keydown((e) => this.onKeyDown(e.keyCode));
		$(document).bind('mousewheel', (e) => this.onMouseWheel(e.originalEvent.wheelDelta));
   }
   
   ngOnDestroy(){
      $(document).unbind();
   }

	@HostListener('window:resize')
	onResize(){
		this.setSize();
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

	async setSize(){
		this.width = window.innerWidth;
		this.height = window.innerHeight;
		this.contentHeight = this.height - this.paddingTop;
		this.pageHeight = this.contentHeight - this.paddingBottom;
		this.paddingX = Math.round(this.width * 0.1);
      
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
			await this.ShowPage();
		}
	}

	async PrevPage(){
		let lastPage = false;

		if((this.width > secondPageMinWidth && this.currentPage <= 1)
			|| (this.width <= secondPageMinWidth && this.currentPage <= 0)){
			// Show the previous chapter
			if(this.currentChapter <= 0) return;
			this.currentChapter--;
			lastPage = true;
			let chapter = this.chapters[this.currentChapter];
			
			if(this.width > secondPageMinWidth && chapter.pagePositions.length >= 2){
				this.currentPage = chapter.pagePositions.length - 2;
			}else{
				this.currentPage = chapter.pagePositions.length - 1;
			}
		}else if(this.width > secondPageMinWidth){
			// Go to the second previous page
			this.currentPage -= 2;
		}else{
			// Show the previous page
			this.currentPage--;
		}

		await this.ShowPage(lastPage);
	}

	async NextPage(){
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

		await this.ShowPage();
	}

	async ShowPage(lastPage: boolean = false, elementId: string = null, progress: number = -1, slidePage: boolean = true){
		let chapter = this.chapters[this.currentChapter];
		if(!chapter) return;

		let chapterHtml: HTMLHtmlElement;
		if(chapter.IsInitialized()){
			chapterHtml = chapter.GetHtml();
		}else{
			chapterHtml = await this.book.chapters[this.currentChapter].GetChapterHtml();
		}

		let chapterBody = chapterHtml.getElementsByTagName("body")[0] as HTMLBodyElement;
		chapterBody.setAttribute("style", `padding: 0px ${this.paddingX}px; margin: 0px 0px 3000px 0px; color: ${this.dataService.darkTheme ? 'white !important' : 'black !important'};`);

		// Adapt the image sizes to the page size
		let imageTags = chapterHtml.getElementsByTagName("img");
		let pageWidth = this.width > secondPageMinWidth ? this.width / 2 : this.width;
		pageWidth = pageWidth - 2 * this.paddingX;

		for(let i = 0; i < imageTags.length; i++){
			Utils.AdaptImageTagDimensions(imageTags.item(i), this.contentHeight, pageWidth);
		}
		
		await chapter.Init(chapterHtml, window.innerWidth, window.innerHeight);

		// If first viewer is visible, render the html on the second viewer and move the second viewer above the first one
		await this.RenderHtml(chapter.GetHtml().outerHTML, this.currentViewer == CurrentViewer.First ? this.viewerLeft2 : this.viewerLeft);
		
		this.CreateCurrentChapterPages();
		for(let position of this.pagePositions){
			chapter.pagePositions.push(position);
		}

		if(this.width > secondPageMinWidth && this.currentPage < chapter.pagePositions.length - 1){
			// Render the chapter on the second page
			await this.RenderHtml(chapter.GetHtml().outerHTML, this.currentViewer == CurrentViewer.First ? this.viewerRight2 : this.viewerRight);
		}else if(this.width > secondPageMinWidth){
			// Clear the second page
			this.viewerRight.srcdoc = "";
		}

		if(lastPage && this.width > secondPageMinWidth){
			// If the chapter pages length is odd, show the last page on the left page
			if(chapter.pagePositions.length % 2 == 0){
				this.currentPage = chapter.pagePositions.length - 2;
			}else{
				this.currentPage = chapter.pagePositions.length - 1;
			}
		}else if(lastPage && this.width <= secondPageMinWidth){
			this.currentPage = chapter.pagePositions.length - 1;
		}else if(elementId){
			// Find the position of the tag
			let position = Utils.FindPositionById(this.viewerLeft.contentWindow.document.getElementsByTagName("body")[0] as HTMLBodyElement, elementId);

			if(position != -1){
				// Find the page of the position
				let page = Utils.FindPageForPosition(position, chapter.pagePositions);
				if(page != -1){
					// If it shows two pages and the tag is on the second page, set the current page to the previous page
					if(this.width > secondPageMinWidth && page % 2 == 1) page -= 1;
					this.currentPage = page;
				}
			}
		}else if(progress >= 0){
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
		}

		// Correct currentPage to the last page if it is too high
		if(this.currentPage > chapter.pagePositions.length - 1){
			this.currentPage = chapter.pagePositions.length - 1;
		}

		// Load the current page
		let viewerLeft = this.currentViewer == CurrentViewer.First ? this.viewerLeft2 : this.viewerLeft;
		viewerLeft.contentWindow.scrollTo(0, chapter.pagePositions[this.currentPage]);
		if(this.width > secondPageMinWidth && chapter.pagePositions[this.currentPage + 1]){
			let viewerRight = this.currentViewer == CurrentViewer.First ? this.viewerRight2 : this.viewerRight;
			viewerRight.contentWindow.scrollTo(0, chapter.pagePositions[this.currentPage + 1]);
		}

		// Update the height of the iframes
		// height of iframe = difference between the position of the next page and the position of the current page
      let newViewerLeftHeight = (chapter.pagePositions[this.currentPage + 1] - chapter.pagePositions[this.currentPage]);
      this.viewerLeftHeight = (newViewerLeftHeight < 0 || isNaN(newViewerLeftHeight)) ? this.contentHeight - 8 : newViewerLeftHeight;

		if(this.width > secondPageMinWidth){
			if(this.currentPage == chapter.pagePositions.length - 1){
				// The last page is shown on the left page
				// Hide the right page
				this.viewerRightHeight = 0;
			}else if(this.currentPage == chapter.pagePositions.length - 2){
				// Ths last page is shown on the right page
				// Show the entire right page
				this.viewerRightHeight = this.contentHeight - 8;
			}else{
				let newViewerRightHeight = (chapter.pagePositions[this.currentPage + 2] - chapter.pagePositions[this.currentPage + 1]);
				this.viewerRightHeight = (newViewerRightHeight < 0 || isNaN(newViewerRightHeight)) ? this.contentHeight - 8 : newViewerRightHeight;
			}
		}

		this.setFirstLastPage();

		// Adapt the links of the left viewer
		let leftViewer = this.currentViewer == CurrentViewer.First ? this.viewerLeft2 : this.viewerLeft;
		let linkTags = leftViewer.contentWindow.document.getElementsByTagName("a");
		for(let i = 0; i < linkTags.length; i++){
			Utils.AdaptLinkTag(linkTags.item(i), (href: string) => this.ngZone.run(() => this.NavigateToLink(href)));
		}

		// Adapt the links of the right viewer
		let rightViewer = this.currentViewer == CurrentViewer.First ? this.viewerRight2 : this.viewerRight;
		linkTags = rightViewer.contentWindow.document.getElementsByTagName("a");
		for(let i = 0; i < linkTags.length; i++){
			Utils.AdaptLinkTag(linkTags.item(i), (href: string) => this.ngZone.run(() => this.NavigateToLink(href)));
		}

		// Bind the keydown and wheel events to the viewer documents
		$(leftViewer.contentDocument).keydown((e) => this.onKeyDown(e.keyCode));
		$(rightViewer.contentDocument).keydown((e) => this.onKeyDown(e.keyCode));
		$(leftViewer.contentDocument).bind('mousewheel', (e) => this.onMouseWheel(e.originalEvent.wheelDelta));
		$(rightViewer.contentDocument).bind('mousewheel', (e) => this.onMouseWheel(e.originalEvent.wheelDelta));

		// Calculate the new progress
		let currentPagePosition = chapter.pagePositions[this.currentPage];
		let lastPagePosition = chapter.pagePositions[chapter.pagePositions.length - 1];
      let newProgress = currentPagePosition / lastPagePosition;
      if(isNaN(newProgress)){
         newProgress = 0;
		}else{
			newProgress = Math.ceil(newProgress * progressFactor);
		}

      // Save the new progress
		await this.dataService.currentBook.SetPosition(this.currentChapter, newProgress);

		if(false){
			// Slide the hidden page into the view

		}else{
			// Just show the hidden viewer
			this.viewerPositionLeft = 0;
			this.viewer2PositionLeft = 0;

			// Move the hidden viewer to the top
			if(this.currentViewer == CurrentViewer.First){
				this.viewerZIndex = -1;
				this.viewer2ZIndex = 1;
				this.currentViewer = CurrentViewer.Second;
			}else{
				this.viewerZIndex = 1;
				this.viewer2ZIndex = -1;
				this.currentViewer = CurrentViewer.First;
			}
		}
	}

	RenderHtml(html: string, viewer: HTMLIFrameElement) : Promise<any>{
		let viewerLoadPromise: Promise<any> = new Promise(resolve => viewer.onload = resolve);
		viewer.srcdoc = html;
		return viewerLoadPromise;
	}

	setFirstLastPage(){
		this.firstPage = this.currentChapter == 0 && this.currentPage == 0;
		this.lastPage = 
			(this.currentChapter == this.chapters.length - 1)
			&& (this.currentPage >= this.chapters[this.chapters.length - 1].pagePositions.length - (this.width > secondPageMinWidth ? 2 : 1));
	}

	CreateCurrentChapterPages(){
		Utils.positions = [];
		let viewer = this.currentViewer == CurrentViewer.First ? this.viewerLeft2 : this.viewerLeft;
		Utils.FindPositions(viewer.contentDocument.getElementsByTagName("body")[0] as HTMLBodyElement);
		this.pagePositions = Utils.FindOptimalPagePositions(Utils.positions, this.pageHeight);
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
			await this.ShowPage(false, elementId);
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
				let yPos = childPosition.height + childPosition.top;

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
	Second = 2
}