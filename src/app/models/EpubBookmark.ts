import { TableObject, GetTableObject, Property } from 'dav-npm';
import { environment } from 'src/environments/environment';

export class EpubBookmark{
	public uuid: string;
	public book: string;			// The uuid of the parent EpubBook
	public name: string;
	public chapter: number;		// The chapter of the bookmark
	public progress: number;	// The progress within the chapter

   constructor(
		book: string,
		name: string = "",
		chapter: number = 0,
		progress: number = 0
   ){
		this.book = book;
		this.name = name;
		this.chapter = chapter;
		this.progress = progress;
	}

	public static async Create(book: string, name: string, chapter: number, progress: number) : Promise<EpubBookmark>{
		let bookmark = new EpubBookmark(book, name, chapter, progress);
		await bookmark.Save();
		return bookmark;
	}

	private async Save(){
		let tableObject = await GetTableObject(this.uuid);

		if(!tableObject){
			// Create the table object
			tableObject = new TableObject();
         tableObject.TableId = environment.epubBookmarkTableId;
         this.uuid = tableObject.Uuid;
		}

		let properties: Property[] = [
			{ name: environment.epubBookmarkBookKey, value: this.book },
			{ name: environment.epubBookmarkNameKey, value: this.name },
			{ name: environment.epubBookmarkChapterKey, value: this.chapter.toString() },
			{ name: environment.epubBookmarkProgressKey, value: this.progress.toString() }
		]

		await tableObject.SetPropertyValues(properties);
	}
}

export async function GetEpubBookmark(uuid: string) : Promise<EpubBookmark>{
	let tableObject = await GetTableObject(uuid);
	return ConvertTableObjectToEpubBookmark(tableObject);
}

function ConvertTableObjectToEpubBookmark(tableObject: TableObject){
	if(!tableObject || tableObject.TableId != environment.epubBookmarkTableId) return null;

	// book
	let book = tableObject.GetPropertyValue(environment.epubBookmarkBookKey);

	// name
	let name = tableObject.GetPropertyValue(environment.epubBookmarkNameKey);

	// chapter
	let chapter: number = 0;
	let chapterString = tableObject.GetPropertyValue(environment.epubBookmarkChapterKey);
	if(chapterString){
		chapter = +chapterString;
	}

	// progress
	let progress: number = 0;
	let progressString = tableObject.GetPropertyValue(environment.epubBookmarkProgressKey);
	if(progressString){
		progress = +progressString;
	}

	let bookmark = new EpubBookmark(book, name, chapter, progress);
	bookmark.uuid = tableObject.Uuid;
	return bookmark;
}