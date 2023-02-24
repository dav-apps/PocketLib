import {
	TableObject,
	Property,
	GetTableObject,
	GetAllTableObjects
} from "dav-js"
import { environment } from "src/environments/environment"
import { keys } from "src/constants/keys"

export class Settings {
	public uuid: string
	public book: string // The uuid of the current book
	public chapter: number // The chapter of the current book
	public progress: number // The progress or the page of the current book

	constructor(book: string = "", chapter: number = 0, progress: number = 0) {
		this.book = book
		this.chapter = chapter
		this.progress = progress
	}

	public async SetBook(book: string, chapter?: number, progress?: number) {
		this.book = book
		if (chapter != null) this.chapter = chapter
		if (progress != null) this.progress = progress
		await this.Save()
	}

	private async Save() {
		let tableObject = await GetTableObject(
			this.uuid,
			environment.settingsTableId
		)

		if (tableObject == null) {
			// Create the table object
			tableObject = new TableObject()
			tableObject.TableId = environment.settingsTableId
			this.uuid = tableObject.Uuid
		}

		let properties: Property[] = [
			{ name: keys.settingsTableBookKey, value: this.book },
			{ name: keys.settingsTableChapterKey, value: this.chapter },
			{ name: keys.settingsTableProgressKey, value: this.progress }
		]

		await tableObject.SetPropertyValues(properties)
	}

	public async Delete() {
		let tableObject = await GetTableObject(
			this.uuid,
			environment.settingsTableId
		)
		if (tableObject == null) return

		await tableObject.Delete()
	}
}

export async function GetSettings(): Promise<Settings> {
	// Check if there is already a Settings object
	let allSettings = await GetAllSettings()

	if (allSettings.length == 0) {
		// Create a new settings
		return new Settings()
	} else {
		// Return the first settings and delete all other settings
		while (allSettings.length > 1) {
			await allSettings.pop().Delete()
		}

		return allSettings[0]
	}
}

async function GetAllSettings(): Promise<Settings[]> {
	let tableObjects = await GetAllTableObjects(
		environment.settingsTableId,
		false
	)
	let settings: Settings[] = []

	for (let tableObject of tableObjects) {
		let s = ConvertTableObjectToSettings(tableObject)
		if (s != null) settings.push(s)
	}

	return settings
}

function ConvertTableObjectToSettings(tableObject: TableObject): Settings {
	if (
		tableObject == null ||
		tableObject.TableId != environment.settingsTableId
	) {
		return null
	}

	// book
	let book = tableObject.GetPropertyValue(keys.settingsTableBookKey) as string

	// chapter
	let chapter = tableObject.GetPropertyValue(
		keys.settingsTableChapterKey
	) as number
	if (chapter == null) chapter = 0

	// progress
	let progress = tableObject.GetPropertyValue(
		keys.settingsTableProgressKey
	) as number
	if (progress == null) progress = 0

	let settings = new Settings(book, chapter, progress)
	settings.uuid = tableObject.Uuid
	return settings
}
