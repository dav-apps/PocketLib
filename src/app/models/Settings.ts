import { TableObject, Property, GetTableObject, GetAllTableObjects } from 'dav-npm';
import { environment } from "src/environments/environment";

export class Settings{
	public uuid: string;
	public currentBook: string;	// The uuid of the current book

	constructor(
		currentBook: string = ""
	){
		this.currentBook = currentBook;
	}
	
	public async SetCurrentBook(currentBook: string){
		this.currentBook = currentBook;
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
			{ name: environment.settingsTableCurrentBookKey, value: this.currentBook }
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

	// currentBook
	let currentBook: string = tableObject.GetPropertyValue(environment.settingsTableCurrentBookKey);

	let settings = new Settings(currentBook);
	settings.uuid = tableObject.Uuid;
	return settings;
}