import { Component, HostListener } from '@angular/core';
import { DataService } from 'src/app/services/data-service';

@Component({
	selector: 'pocketlib-pdf-content',
	templateUrl: './pdf-content.component.html'
})
export class PdfContentComponent{
	pdfContent: Uint8Array = null;
	page: number = 0;
	totalPages: number = 0;
	isLoaded: boolean = false;
	initialized: boolean = false;
   width: number = 500;
   height: number = 500;
	viewerWidth: number = 500;
	viewerRatio: number = 0;

	constructor(
		private dataService: DataService
	){
		// Read the book blob as UInt8Array
		var fileReader = new FileReader();
		fileReader.onload = (event: ProgressEvent) => this.pdfContent = event.target["result"];
		fileReader.readAsArrayBuffer(this.dataService.currentBook.file);
   }

   ngOnInit(){
      this.setSize();
	}
   
   @HostListener('window:resize')
	onResize(){
		this.setSize();
   }
   
   setSize(){
      this.width = window.innerWidth;
		this.height = window.innerHeight;
		this.setViewerSize();
	}
	
	setViewerSize(){
		if(this.viewerRatio > 0){
			// width = height * viewerRadio
			let newWidth = this.height * this.viewerRatio;
			if(newWidth > this.width){
				this.viewerWidth = this.width;
			}else{
				this.viewerWidth = newWidth - 10;
			}
		}
	}
   
	PdfLoaded(data: any){
		this.totalPages = data.numPages;
	}
	
	PageRendered(e: CustomEvent){
		let pdfViewer = document.getElementById("pdf-viewer");
		let pdfViewerHeightString = getComputedStyle(pdfViewer).height;
		let pdfViewerWidthString = getComputedStyle(pdfViewer).width;

		let pdfViewerHeight = +pdfViewerHeightString.replace('px', '');
		let pdfViewerWidth = +pdfViewerWidthString.replace('px', '');

		this.viewerRatio = pdfViewerWidth / pdfViewerHeight;

		if(!this.initialized){
			this.setViewerSize();
			this.page = 1;
			this.initialized = true;
		}
	}
   
   Prev(){
      this.page--;
   }

   Next(){
      this.page++;
   }
}