import { TableObject, Property, GetTableObject, GetAllTableObjects } from 'dav-npm';
import { environment } from "src/environments/environment";

export class Settings{
	public uuid: string;
	public book: string;			// The uuid of the current book
	public chapter: number;		// The chapter of the current book
	public progress: number;	// The progress or the page of the current book

	constructor(
		book: string = "",
		chapter: number = 0,
		progress: number = 0
	){
		this.book = book;
		this.chapter = chapter;
		this.progress = progress;
	}
	
	public async SetBook(book: string, chapter?: number, progress?: number){
		this.book = book;
		if(chapter) this.chapter = chapter;
		if(progress) this.progress = progress;
		await this.Save();
	}

	public async SetPosition(chapter: number, progress: number){
		this.chapter = chapter;
		this.progress = progress;
		await this.Save();
	}

	public async SetProgress(progress: number){
		this.progress = progress;
		await this.Save();
	}

	private async Save(){
		let tableObject = await GetTableObject(this.uuid);

		if(!tableObject){
			// Create the table object
			tableObject = new TableObject();
			tableObject.TableId = environment.settingsTableId;
			this.uuid = tableObject.Uuid;
		}

		let properties: Property[] = [
			{ name: environment.settingsTableBookKey, value: this.book },
			{ name: environment.settingsTableChapterKey, value: this.chapter.toString() },
			{ name: environment.settingsTableProgressKey, value: this.progress.toString() }
		]

		await tableObject.SetPropertyValues(properties);
	}

	public async Delete(){
		let tableObject = await GetTableObject(this.uuid);
		if(!tableObject) return;

		await tableObject.Delete();
	}
}

export async function GetSettings() : Promise<Settings>{
	// Check if a setting already exists
	let allSettings = await GetAllSettings();

	if(allSettings.length == 0){
		// Create a new settings
		return new Settings();
	}else{
		// Delete all other settings
		while(allSettings.length > 1){
			await allSettings.pop().Delete();
		}

		// Return the remaining settings
		return allSettings[0];
	}
}

async function GetAllSettings() : Promise<Settings[]>{
	let tableObjects = await GetAllTableObjects(environment.settingsTableId, false);
	let settings: Settings[] = [];

	for(let tableObject of tableObjects){
		let s = ConvertTableObjectToSettings(tableObject);
		if(s) settings.push(s);
	}

	return settings;
}

function ConvertTableObjectToSettings(tableObject: TableObject) : Settings{
	if(!tableObject || tableObject.TableId != environment.settingsTableId) return null;

	// book
	let book: string = tableObject.GetPropertyValue(environment.settingsTableBookKey);

	// chapter
	let chapter: number = 0;
	let chapterString: string = tableObject.GetPropertyValue(environment.settingsTableChapterKey);
	if(chapterString){
		chapter = +chapterString;
	}

	// progress
	let progress: number = 0;
	let progressString: string = tableObject.GetPropertyValue(environment.settingsTableProgressKey);
	if(progressString){
		progress = +progressString;
	}

	let settings = new Settings(book, chapter, progress);
	settings.uuid = tableObject.Uuid;
	return settings;
}