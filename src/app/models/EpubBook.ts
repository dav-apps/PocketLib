import { Property } from 'dav-npm';
import { environment } from 'src/environments/environment';
import { Book } from './Book';
import { EpubBookmark } from './EpubBookmark';

const epubExt = "epub";

export class EpubBook extends Book{
	public chapter: number;
   public progress: number;
   public bookmarks: EpubBookmark[];

	// Properties which are read from the epub file
	public title: string;
	public author: string;
	public cover: string;

	constructor(
		file: Blob,
		chapter: number = 0,
      progress: number = 0,
      bookmarks: EpubBookmark[] = []
	){
		super(file);
		this.chapter = chapter;
      this.progress = progress;
      this.bookmarks = bookmarks;
	}

	public static async Create(file: Blob) : Promise<string>{
		let book = new EpubBook(file);
		await book.Save();
		return book.uuid;
	}

	public async SetPosition(chapter: number, progress: number){
		this.chapter = chapter;
		this.progress = progress;
		await this.Save();
   }
   
   public async AddBookmark(name: string, chapter: number, progress: number){
		let bookmark = await EpubBookmark.Create(this.uuid, name, chapter, progress);
		this.bookmarks.push(bookmark);
		await this.Save();
   }

	protected async Save(){
		let bookmarkUuids: string[] = [];
		this.bookmarks.forEach(bookmark => bookmarkUuids.push(bookmark.uuid));

		let properties: Property[] = [
			{ name: environment.epubBookTableChapterKey, value: this.chapter.toString() },
			{ name: environment.epubBookTableProgressKey, value: this.progress.toString() },
			{ name: environment.epubBookTableBookmarksKey, value: bookmarkUuids.join(',') }
		]

		await super.Save(epubExt, properties);
	}
}