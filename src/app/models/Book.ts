import { TableObject, GetTableObject, GetAllTableObjects } from 'dav-npm';
import { environment } from 'src/environments/environment';
import { EpubBook } from './EpubBook';

export class Book{
   public uuid: string;
	public title: string;
	public author: string;
	public cover: string;

   constructor(public file: Blob){}
	
	public static async Create(file: Blob) : Promise<string>{
		let book = new Book(file);
		await book.Save();
		return book.uuid;
	}

	private async Save(){
		let tableObject = await GetTableObject(this.uuid);
		let fileTableObject: TableObject = null;

		if(tableObject){
			// Check if the table object has a file table object
			let fileUuid = tableObject.GetPropertyValue(environment.bookTableFileUuidKey);

			if(fileUuid){
				fileTableObject = await GetTableObject(fileUuid);
			}
			
			// Update the existing table object
			// TODO Save future properties
		}else{
			// Create a new table object
			tableObject = new TableObject();
			tableObject.TableId = environment.bookTableId;
			this.uuid = tableObject.Uuid;
		}

		if(!fileTableObject){
			// Create a table object for the file
			fileTableObject = new TableObject();
			fileTableObject.TableId = environment.bookFileTableId;
			fileTableObject.IsFile = true;
			await fileTableObject.SetFile(this.file, "epub");

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

   // Get the file from the book file table object
   let book = new Book(bookFileTableObject.File);
   book.uuid = bookTableObject.Uuid;
	return book;
}

async function LoadBookDetails(book: Book) : Promise<Book>{
	let epubBook = new EpubBook();
	await epubBook.ReadEpubFile(book.file);

	book.title = epubBook.title;
	book.author = epubBook.author;
	book.cover = epubBook.coverSrc;

	return book;
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