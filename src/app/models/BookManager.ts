import { TableObject, GetTableObject, GetAllTableObjects } from 'dav-npm';
import { environment } from 'src/environments/environment';
import { keys } from 'src/constants/keys';
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
	let fileUuid = tableObject.GetPropertyValue(keys.bookTableFileKey) as string
	if(!fileUuid) return null

	let fileTableObject = await GetTableObject(fileUuid)
	return (fileTableObject && fileTableObject.File) ? fileTableObject : null
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
	if(bookTableObject.TableId != environment.bookTableId || bookFileTableObject.TableId != environment.bookFileTableId) return null
	if(!bookFileTableObject.IsFile || !bookFileTableObject.File) return null

	// Get the file
	let file = bookFileTableObject.File

	// Get the storeBook
	let storeBook = bookTableObject.GetPropertyValue(keys.bookTableStoreBookKey) as string

	// Get the chapter
	let chapter = bookTableObject.GetPropertyValue(keys.epubBookTableChapterKey) as number
	if(chapter == null) chapter = 0

	// Get the progress
	let progress = bookTableObject.GetPropertyValue(keys.epubBookTableProgressKey) as number
	if(progress == null) progress = 0

	// Get the totalProgress
	let totalProgress = bookTableObject.GetPropertyValue(keys.epubBookTableTotalProgressKey) as number
	if (totalProgress == null) totalProgress = 0
	
	// Get the chapterPercentages
	let chapterPercentages: number[] = []
	let chapterPercentagesString = bookTableObject.GetPropertyValue(keys.epubBookTableChapterPercentagesKey) as string
	if (chapterPercentagesString) {
		for (let chapterPercentage of chapterPercentagesString.split(',')) {
			chapterPercentages.push(+chapterPercentage)
		}
	}

	// Get the bookmarks
	let bookmarks: EpubBookmark[] = []
	let bookmarksString = bookTableObject.GetPropertyValue(keys.epubBookTableBookmarksKey) as string
	if(bookmarksString){
		for(let uuid of bookmarksString.split(',')){
			let bookmark = await GetEpubBookmark(uuid)
			if(bookmark) bookmarks.push(bookmark)
		}
	}

	let book = new EpubBook(file, storeBook, chapter, progress, totalProgress, chapterPercentages, bookmarks)
	book.uuid = bookTableObject.Uuid
	return book
}

export function ConvertTableObjectsToPdfBook(bookTableObject: TableObject, bookFileTableObject: TableObject) : PdfBook{
	if(bookTableObject.TableId != environment.bookTableId || bookFileTableObject.TableId != environment.bookFileTableId) return null
	if(!bookFileTableObject.IsFile || !bookFileTableObject.File) return null

	// Get the file
	let file = bookFileTableObject.File

	// Get the storeBook
	let storeBook = bookTableObject.GetPropertyValue(keys.bookTableStoreBookKey) as string

	// Get the title
	let title = bookTableObject.GetPropertyValue(keys.pdfBookTableTitleKey) as string

	// Get the page
	let page = bookTableObject.GetPropertyValue(keys.pdfBookTablePageKey) as number
	if(page == null) page = 1
	
	// Get the total progress
	let totalProgress = bookTableObject.GetPropertyValue(keys.pdfBookTableTotalProgressKey) as number
	if(totalProgress == null) totalProgress = 0
   
   // Get the bookmarks
   let bookmarks: number[] = []
	let bookmarksString = bookTableObject.GetPropertyValue(keys.pdfBookTableBookmarksKey) as string
	if(bookmarksString){
		for(let bookmark of bookmarksString.split(',')){
			let page = +bookmark
			if(page > 0) bookmarks.push(page)
		}
   }
   
   // Get the zoom
	let zoom = bookTableObject.GetPropertyValue(keys.pdfBookTableZoomKey) as number
	if(zoom == null) zoom = 1

	let book = new PdfBook(file, storeBook, title, page, totalProgress, bookmarks, zoom)
	book.uuid = bookTableObject.Uuid
	return book
}