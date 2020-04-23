import { Property } from 'dav-npm';
import { keys } from 'src/environments/keys';
import { Book } from './Book';

const pdfExt = "pdf";

export class PdfBook extends Book{
	public title: string;
   public page: number;
   public bookmarks: number[];
   public zoom: number;

	constructor(
		file: Blob,
		storeBook: string = null,
		title: string = "",
      page: number = 1,
		bookmarks: number[] = [],
		zoom: number = 1
	){
		super(file, storeBook);
		this.title = title;
      this.page = page;
		this.bookmarks = bookmarks;
		this.zoom = zoom;
	}

	public static async Create(file: File, title: string) : Promise<string>{
		// Convert the file to a blob
		let book = new PdfBook(new Blob([file], {type: file.type}), null, title);
		await book.Save();
		return book.uuid;
   }
   
   public async SetTitle(title: string){
      this.title = title;
      await this.Save();
   }

	public async SetPage(page: number){
		this.page = page;
		await this.Save();
	}

	public async AddBookmark(page: number){
		// Check if the bookmark already exists
		if(!this.bookmarks.includes(page)){
			// Add the page to the bookmarks array
			this.bookmarks.push(page);
		}

		// Sort the bookmarks array
		this.bookmarks.sort((a: number, b: number) => {
			if(a > b) return 1;
			else if(a < b) return -1;
			else return 0;
		});

		// Save the updated bookmarks array
		await this.Save();
   }

	public async RemoveBookmark(page: number){
		// Find the page in the bookmarks array
		let i = this.bookmarks.findIndex(p => p == page);

		if(i != -1){
			this.bookmarks.splice(i, 1);
			await this.Save();
		}
   }
   
   public async RemoveBookmarks(...pages: number[]){
		// Find the pages in the bookmarks array
		let bookmarkRemoved: boolean = false;
		for(let page of pages){
			let i = this.bookmarks.findIndex(p => p == page);

			if(i != -1){
				this.bookmarks.splice(i, 1);
				bookmarkRemoved = true;
			}
		}

		if(bookmarkRemoved) await this.Save();
	}
	
	public async SetZoom(zoom: number){
		this.zoom = zoom;
		await this.Save();
	}

	protected async Save(){
		let properties: Property[] = [
			{ name: keys.pdfBookTableTitleKey, value: this.title },
			{ name: keys.pdfBookTablePageKey, value: this.page.toString() },
			{ name: keys.pdfBookTableBookmarksKey, value: this.bookmarks.join(',') },
			{ name: keys.pdfBookTableZoomKey, value: this.zoom.toString() }
      ]

		await super.Save(pdfExt, properties);
	}
}