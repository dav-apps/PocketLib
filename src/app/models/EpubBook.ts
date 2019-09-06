import { environment } from 'src/environments/environment';
import { Book, Property } from './Book';

const epubExt = "epub";

export class EpubBook extends Book{
	public chapter: number;
	public progress: number;

	// Properties which are read from the epub file
	public title: string;
	public author: string;
	public cover: string;

	constructor(
		file: Blob,
		chapter: number = 0,
		progress: number = 0
	){
		super(file);
		this.chapter = chapter;
		this.progress = progress;
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

	protected async Save(){
		let properties: Property[] = [
			{ name: environment.epubBookTableChapterKey, value: this.chapter.toString() },
			{ name: environment.epubBookTableProgressKey, value: this.progress.toString() }
		]

		await super.Save(epubExt, properties);
	}
}