import { TableObject, GetTableObject, GetAllTableObjects } from 'dav-npm';
import { environment } from 'src/environments/environment';
import { EpubReader } from './EpubReader';

const epubType = "application/epub+zip";
const pdfType = "application/pdf";

export class Book{
   public uuid: string;
	public title: string = "";
	public author: string;
   public cover: string;
   public chapter: number = 0;		// The current chapter (epub) or 0 (pdf)
   public progress: number = 1;		// The progress in the chapter in percent * progressFactor (epub) or page number (pdf)

   constructor(
		public file: Blob,
		title: string = "",
		chapter: number = 0,
		progress: number = 1
	){
		if(this.file.type == pdfType){
			this.title = title;
		}

		this.chapter = chapter;
		this.progress = progress;
	}
	
	public static async Create(file: Blob, title: string) : Promise<string>{
      let book = new Book(file, title);
		await book.Save();
		return book.uuid;
	}

	public async SetPosition(chapter: number, progress: number){
		this.chapter = chapter;
		this.progress = progress;
		await this.Save();
	}

	public async SetPage(page: number){
		this.chapter = 0;
		this.progress = page;
		await this.Save();
	}

	public async Delete(){
		let tableObject = await GetTableObject(this.uuid);
		if(!tableObject) return;

		let fileUuid = tableObject.GetPropertyValue(environment.bookTableFileUuidKey);
		let fileTableObject = await GetTableObject(fileUuid);

		// Delete the file table object
		if(fileTableObject){
			await fileTableObject.Delete();
		}

		// Delete the book table object
		await tableObject.Delete();
	}

	private async Save(){
		let tableObject = await GetTableObject(this.uuid);
		let fileTableObject: TableObject = null;

		let properties: {name: string, value: string}[] = [
			{ name: environment.bookTableTitleKey, value: this.title },
			{ name: environment.bookTableProgressKey, value: this.progress.toString() }
		];

		// Save the chapter only if it is not 0
		if(this.chapter != 0){
			properties.push({ name: environment.bookTableChapterKey, value: this.chapter.toString() });
		}

		if(tableObject){
			// Check if the table object has a file table object
			let fileUuid = tableObject.GetPropertyValue(environment.bookTableFileUuidKey);

			if(fileUuid){
				fileTableObject = await GetTableObject(fileUuid);
			}
			
			// Update the existing table object
			await tableObject.SetPropertyValues(properties);
		}else{
			// Create a new table object
			tableObject = new TableObject();
			tableObject.TableId = environment.bookTableId;
			this.uuid = tableObject.Uuid;

			// Set the properties of the new table object
			await tableObject.SetPropertyValues(properties);
		}

		if(!fileTableObject){
			// Create a table object for the file
			fileTableObject = new TableObject();
			fileTableObject.TableId = environment.bookFileTableId;
			fileTableObject.IsFile = true;

			let ext = this.file.type == pdfType ? "pdf" : "epub";
			await fileTableObject.SetFile(this.file, ext);

			// Save the uuid of the file table object in the table object
			await tableObject.SetPropertyValue(environment.bookTableFileUuidKey, fileTableObject.Uuid);
		}
	}
}

export async function GetAllBooks() : Promise<Book[]>{
	let tableObjects = await GetAllTableObjects(environment.bookTableId, false);
	let books: Book[] = [];

	for(let tableObject of tableObjects){
		let book = await GetBookByTableObject(tableObject);
		if(!book) continue;
		books.push(book);
	}

	return books;
}

export async function GetBook(uuid: string) : Promise<Book>{
	let tableObject = await GetTableObject(uuid);
	if(!tableObject) return null;

	let book = await GetBookByTableObject(tableObject);
	if(!book) return null;

	return book;
}

function ConvertTableObjectsToBook(bookTableObject: TableObject, bookFileTableObject: TableObject) : Book{
	if(bookTableObject.TableId != environment.bookTableId || bookFileTableObject.TableId != environment.bookFileTableId) return null;
	if(!bookFileTableObject.IsFile || !bookFileTableObject.File) return null;

	// Get the file of the book file table object
	let file = bookFileTableObject.File;

	// Get the title
	let title = bookTableObject.GetPropertyValue(environment.bookTableTitleKey);
	
	// Get the chapter
	let chapter: number = 0;
	let chapterString = bookTableObject.GetPropertyValue(environment.bookTableChapterKey);
	if(chapterString){
		chapter = Number.parseInt(chapterString);
	}

	// Get the progress
	let progress: number = 0;
	let progressString = bookTableObject.GetPropertyValue(environment.bookTableProgressKey);
	if(progressString){
		progress = Number.parseInt(progressString);
	}

   let book = new Book(file, title, chapter, progress);
	book.uuid = bookTableObject.Uuid;
	return book;
}

async function LoadBookDetails(book: Book){
	if(book.file.type != epubType) return;

	let epubReader = new EpubReader();
	await epubReader.ReadEpubFile(book.file);

	book.title = epubReader.title;
	book.author = epubReader.author;
	book.cover = epubReader.coverSrc;
}

async function GetBookByTableObject(tableObject: TableObject) : Promise<Book>{
	// Get the book file
	let fileTableObject = await GetBookFileOfBookTableObject(tableObject);
	if(!fileTableObject) return null;

	let book = ConvertTableObjectsToBook(tableObject, fileTableObject);
	LoadBookDetails(book);
	return book;
}

async function GetBookFileOfBookTableObject(tableObject: TableObject) : Promise<TableObject>{
	let fileUuid = tableObject.GetPropertyValue(environment.bookTableFileUuidKey);
	if(!fileUuid) return null;

	let fileTableObject = await GetTableObject(fileUuid);
	return (fileTableObject && fileTableObject.File) ? fileTableObject : null;
}