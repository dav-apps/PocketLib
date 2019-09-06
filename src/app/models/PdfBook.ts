import { environment } from 'src/environments/environment';
import { Book, Property } from './Book';

const pdfExt = "pdf";

export class PdfBook extends Book{
	public title: string;
	public page: number;

	constructor(
		file: Blob,
		title: string = "",
		page: number = 1
	){
		super(file);
		this.title = title;
		this.page = page;
	}

	public static async Create(file: Blob, title: string) : Promise<string>{
		let book = new PdfBook(file, title);
		await book.Save();
		return book.uuid;
	}

	public async SetPage(page: number){
		this.page = page;
		await this.Save();
	}

	protected async Save(){
		let properties: Property[] = [
			{ name: environment.pdfBookTableTitleKey, value: this.title },
			{ name: environment.pdfBookTablePageKey, value: this.page.toString() }
		]

		await super.Save(pdfExt, properties);
	}
}