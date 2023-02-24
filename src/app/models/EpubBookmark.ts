import { TableObject, GetTableObject, Property } from "dav-js"
import { environment } from "src/environments/environment"
import { keys } from "src/constants/keys"

export class EpubBookmark {
	public uuid: string
	public book: string // The uuid of the parent EpubBook
	public name: string
	public chapter: number // The chapter of the bookmark
	public progress: number // The progress within the chapter

	constructor(
		book: string,
		name: string = "",
		chapter: number = 0,
		progress: number = 0
	) {
		this.book = book
		this.name = name
		this.chapter = chapter
		this.progress = progress
	}

	public static async Create(
		book: string,
		name: string,
		chapter: number,
		progress: number
	): Promise<EpubBookmark> {
		let bookmark = new EpubBookmark(book, name, chapter, progress)
		await bookmark.Save()
		return bookmark
	}

	private async Save() {
		let tableObject = await GetTableObject(this.uuid)

		if (!tableObject) {
			// Create the table object
			tableObject = new TableObject()
			tableObject.TableId = environment.epubBookmarkTableId
			this.uuid = tableObject.Uuid
		}

		let properties: Property[] = [
			{ name: keys.epubBookmarkTableBookKey, value: this.book },
			{ name: keys.epubBookmarkTableNameKey, value: this.name },
			{ name: keys.epubBookmarkTableChapterKey, value: this.chapter },
			{ name: keys.epubBookmarkTableProgressKey, value: this.progress }
		]

		await tableObject.SetPropertyValues(properties)
	}

	public async Delete() {
		let tableObject = await GetTableObject(this.uuid)
		if (!tableObject) return

		await tableObject.Delete()
	}
}

export async function GetEpubBookmark(uuid: string): Promise<EpubBookmark> {
	let tableObject = await GetTableObject(uuid)
	return ConvertTableObjectToEpubBookmark(tableObject)
}

function ConvertTableObjectToEpubBookmark(tableObject: TableObject) {
	if (!tableObject || tableObject.TableId != environment.epubBookmarkTableId)
		return null

	// book
	let book = tableObject.GetPropertyValue(
		keys.epubBookmarkTableBookKey
	) as string

	// name
	let name = tableObject.GetPropertyValue(
		keys.epubBookmarkTableNameKey
	) as string

	// chapter
	let chapter = tableObject.GetPropertyValue(
		keys.epubBookmarkTableChapterKey
	) as number
	if (chapter == null) chapter = 0

	// progress
	let progress = tableObject.GetPropertyValue(
		keys.epubBookmarkTableProgressKey
	) as number
	if (progress == null) progress = 0

	let bookmark = new EpubBookmark(book, name, chapter, progress)
	bookmark.uuid = tableObject.Uuid
	return bookmark
}
