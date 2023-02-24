import { Property } from "dav-js"
import { keys } from "src/constants/keys"
import { Book } from "./Book"
import { EpubBookmark } from "./EpubBookmark"
import { EpubReader } from "./EpubReader"

const epubExt = "epub"

export class EpubBook extends Book {
	public chapter: number
	public progress: number
	public totalProgress: number
	public chapterPercentages: number[]
	public bookmarks: EpubBookmark[]

	// Properties which are read from the epub file
	public title: string
	public author: string
	public cover: string

	constructor(
		file: Blob,
		storeBook: string,
		belongsToUser: boolean,
		purchase: string,
		chapter: number = 0,
		progress: number = 0,
		totalProgress: number = 0,
		chapterPercentages: number[] = [],
		bookmarks: EpubBookmark[] = []
	) {
		super(file, storeBook, belongsToUser, purchase)
		this.chapter = chapter
		this.progress = progress
		this.totalProgress = totalProgress
		this.chapterPercentages = chapterPercentages
		this.bookmarks = bookmarks
	}

	public static async Create(file: File): Promise<string> {
		// Convert the file to a blob
		let fileBlob = new Blob([file], { type: file.type })

		// Check if the file is a valid epub file
		let epubReader = new EpubReader()
		if (!(await epubReader.Init(fileBlob))) return null

		// Create and save the epub book
		let book = new EpubBook(fileBlob, null, true, null)
		await book.Save()
		return book.uuid
	}

	public async SetPosition(chapter: number, progress: number) {
		this.chapter = chapter
		this.progress = progress
		await this.Save()
	}

	public async SetTotalProgress(totalProgress: number) {
		this.totalProgress = totalProgress
		await this.Save()
	}

	public async SetChapterPercentages(chapterPercentages: number[]) {
		if (this.chapterPercentages.length > 0) return
		this.chapterPercentages = chapterPercentages
		await this.Save()
	}

	public async AddBookmark(
		name: string,
		chapter: number,
		progress: number
	): Promise<string> {
		let bookmark = await EpubBookmark.Create(
			this.uuid,
			name,
			chapter,
			progress
		)
		this.bookmarks.push(bookmark)
		await this.Save()
		return bookmark.uuid
	}

	public async RemoveBookmark(uuid: string) {
		let i = this.bookmarks.findIndex(bookmark => bookmark.uuid == uuid)
		if (i == -1) return

		// Delete the bookmark
		this.bookmarks[i].Delete()

		// Remove the bookmark from the bookmarks
		this.bookmarks.splice(i, 1)

		// Save the new bookmarks array
		await this.Save()
	}

	protected async Save() {
		this.SortBookmarks()

		let bookmarkUuids: string[] = []
		this.bookmarks.forEach(bookmark => bookmarkUuids.push(bookmark.uuid))

		let properties: Property[] = [
			{ name: keys.epubBookTableChapterKey, value: this.chapter },
			{ name: keys.epubBookTableProgressKey, value: this.progress },
			{
				name: keys.epubBookTableTotalProgressKey,
				value: this.totalProgress
			},
			{
				name: keys.epubBookTableChapterPercentagesKey,
				value: this.chapterPercentages.join(","),
				options: { local: true }
			},
			{
				name: keys.epubBookTableBookmarksKey,
				value: bookmarkUuids.join(",")
			}
		]

		await super.Save(epubExt, properties)
	}

	public async Delete() {
		// Delete each bookmark
		for (let bookmark of this.bookmarks) {
			await bookmark.Delete()
		}

		await super.Delete()
	}

	private SortBookmarks() {
		this.bookmarks.sort((a: EpubBookmark, b: EpubBookmark) => {
			if (a.chapter > b.chapter) {
				return 1
			} else if (a.chapter < b.chapter) {
				return -1
			} else if (a.progress > b.progress) {
				return 1
			} else if (a.progress < b.progress) {
				return -1
			} else {
				return 0
			}
		})
	}
}
