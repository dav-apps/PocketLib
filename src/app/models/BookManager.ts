import { TableObject, GetTableObject, GetAllTableObjects } from 'dav-npm';
import { environment } from 'src/environments/environment';
import { Book } from './Book';
import { EpubBook } from './EpubBook';
import { PdfBook } from './PdfBook';
import { EpubReader } from './EpubReader';
import { EpubBookmark, GetEpubBookmark } from './EpubBookmark';

const epubType = "application/epub+zip";
const pdfType = "application/pdf";

export async function GetBook(uuid: string) : Promise<Book>{
	let tableObject = await GetTableObject(uuid);
	if(!tableObject) return null;

	return await GetBookByTableObject(tableObject);
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

async function GetBookByTableObject(tableObject: TableObject) : Promise<Book>{
	// Get the book file
	let fileTableObject = await GetBookFileOfBookTableObject(tableObject);
	if(!fileTableObject) return null;

	// Check the type of the file
	if(fileTableObject.File.type == epubType){
		let book = await ConvertTableObjectsToEpubBook(tableObject, fileTableObject);
		await LoadEpubBookDetails(book);
		return book;
	}else if(fileTableObject.File.type == pdfType){
		return ConvertTableObjectsToPdfBook(tableObject, fileTableObject);
	}
}

async function GetBookFileOfBookTableObject(tableObject: TableObject) : Promise<TableObject>{
	let fileUuid = tableObject.GetPropertyValue(environment.bookTableFileUuidKey);
	if(!fileUuid) return null;

	let fileTableObject = await GetTableObject(fileUuid);
	return (fileTableObject && fileTableObject.File) ? fileTableObject : null;
}

async function LoadEpubBookDetails(book: EpubBook){
	if(book.file.type != epubType) return;

	let epubReader = new EpubReader();
	await epubReader.ReadEpubFile(book.file);

	book.title = epubReader.title;
	book.author = epubReader.author;
	book.cover = epubReader.coverSrc;
}

export async function ConvertTableObjectsToEpubBook(bookTableObject: TableObject, bookFileTableObject: TableObject) : Promise<EpubBook>{
	if(bookTableObject.TableId != environment.bookTableId || bookFileTableObject.TableId != environment.bookFileTableId) return null;
	if(!bookFileTableObject.IsFile || !bookFileTableObject.File) return null;

	// Get the file
	let file = bookFileTableObject.File;

	// Get the chapter
	let chapter: number = 0;
	let chapterString = bookTableObject.GetPropertyValue(environment.epubBookTableChapterKey);
	if(chapterString){
		chapter = Number.parseInt(chapterString);
	}

	// Get the progress
	let progress: number = 0;
	let progressString = bookTableObject.GetPropertyValue(environment.epubBookTableProgressKey);
	if(progressString){
		progress = Number.parseInt(progressString);
	}

	// Get the bookmarks
	let bookmarks: EpubBookmark[] = [];
	let bookmarksString = bookTableObject.GetPropertyValue(environment.epubBookTableBookmarksKey);
	if(bookmarksString){
		for(let uuid of bookmarksString.split(',')){
			let bookmark = await GetEpubBookmark(uuid);
			if(bookmark) bookmarks.push(bookmark);
		}
	}

	let book = new EpubBook(file, chapter, progress, bookmarks);
	book.uuid = bookTableObject.Uuid;
	return book;
}

export function ConvertTableObjectsToPdfBook(bookTableObject: TableObject, bookFileTableObject: TableObject) : PdfBook{
	if(bookTableObject.TableId != environment.bookTableId || bookFileTableObject.TableId != environment.bookFileTableId) return null;
	if(!bookFileTableObject.IsFile || !bookFileTableObject.File) return null;

	// Get the file
	let file = bookFileTableObject.File;

	// Get the title
	let title = bookTableObject.GetPropertyValue(environment.pdfBookTableTitleKey);

	// Get the page
	let page: number = 1;
	let pageString = bookTableObject.GetPropertyValue(environment.pdfBookTablePageKey);
	if(pageString){
		page = Number.parseInt(pageString);
   }
   
   // Get the bookmarks
   let bookmarks: number[] = [];
	let bookmarksString = bookTableObject.GetPropertyValue(environment.pdfBookTableBookmarksKey);
	if(bookmarksString){
		for(let bookmark of bookmarksString.split(',')){
			let page = +bookmark;
			if(page > 0) bookmarks.push(page);
		}
	}

	let book = new PdfBook(file, title, page, bookmarks);
	book.uuid = bookTableObject.Uuid;
	return book;
}