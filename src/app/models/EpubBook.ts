declare var zip: any;

export class EpubBook{
   title: string
   author: string
	chapters: EpubChapter[] = [];
	entries: any[] = [];

   async ReadEpubFile(zipFile: File){
      zip.workerScriptsPath = "/assets/libraries/";
      
      // Create a reader
      var readZipPromise: Promise<any> = new Promise((resolve) => {
         zip.createReader(new zip.BlobReader(zipFile), resolve);
      });
      var reader = await readZipPromise;
   
      // Get the entries with the reader
      var getEntriesPromise: Promise<any[]> = new Promise((resolve) => {
         reader.getEntries(resolve);
      });
		this.entries = await getEntriesPromise;

      // Get the container file
		let index = this.entries.findIndex(entry => entry.filename == "META-INF/container.xml");
		
		if(index == -1){
			// The epub file is not valid
			// TODO Show some error
			return;
		}

		var containerEntry = this.entries[index];
   
		// Get the content of the container
		let opfFilePath = await this.GetOpfFilePath(containerEntry);
		let opfFileDirectory = GetFileDirectory(opfFilePath);
		
		// Get the opf file from the entries
		index = this.entries.findIndex(entry => entry.filename == opfFilePath);
		
		if(index == -1){
			// The epub file is not valid
			// TODO Show some error
			return;
		}

		let opfFileEntry = this.entries[index];

		// Get the content of the container
		let opfContent = await GetZipEntryContent(opfFileEntry);

		// Read the OPF file content
		let parser = new DOMParser();
		let opfDoc = parser.parseFromString(opfContent, "text/xml");

		/*
		// Get the metadata content
		let metadataTag = opfDoc.getElementsByTagName("metadata")[0];
		*/

		// Get the manifest items
		let manifestTag = opfDoc.getElementsByTagName("manifest")[0];
		let manifestItemTags = manifestTag.getElementsByTagName("item");

		let manifestItems: Map<string, string> = new Map();
		for(let i = 0; i < manifestItemTags.length; i++){
			manifestItems.set(manifestItemTags[i].getAttribute("id"), opfFileDirectory + manifestItemTags[i].getAttribute("href"));
		}

		// Get the spine content
		let spineTag = opfDoc.getElementsByTagName("spine")[0];
		this.chapters = [];

		let spineItemTags = spineTag.getElementsByTagName("itemref");
		for(let i = 0; i < spineItemTags.length; i++){
			let idref = spineItemTags[i].getAttribute("idref");

			// Get the item with the id from the manifest items
			let itemPath = manifestItems.get(idref);
			if(itemPath != null){
				// Get the entry with the filename
				index = this.entries.findIndex(entry => entry.filename.includes(itemPath));
				if(index == -1) continue;

				// Read the content of the entry
				let entryContentPromise: Promise<string> = new Promise((resolve) => {
					this.entries[index].getData(new zip.TextWriter(), resolve);
				});
				let entryContent = await entryContentPromise;

				this.chapters.push(new EpubChapter(this, idref, itemPath, entryContent));
			}
		}
	}
	
	private async GetOpfFilePath(containerEntry: any) : Promise<string>{
		var containerContentPromise: Promise<string> = new Promise((resolve) => {
			containerEntry.getData(new zip.TextWriter(), resolve);
		});
		let containerContent = await containerContentPromise;

		let parser = new DOMParser();
		let containerDoc = parser.parseFromString(containerContent, "text/xml");
		let container = containerDoc.getElementsByTagName("container")[0];
		let rootFiles = container.getElementsByTagName("rootfiles")[0]
		let rootFile = rootFiles.getElementsByTagName("rootfile")[0];
		return rootFile.getAttribute("full-path");
	}
}

export class EpubChapter{
   private currentPath: string;

   constructor(
		public book: EpubBook,
      public id: string,
		public filePath: string,
		public htmlContent: string
   ){
		// Get the current path from the file path
		this.currentPath = GetFileDirectory(this.filePath);
   }
   
   async GetChapterHtml() : Promise<HTMLHtmlElement>{
		let parser = new DOMParser();

		let newDocument = parser.parseFromString("<html><head></head><body></body></html>", "text/html");
		let newHtmlTag = newDocument.getElementsByTagName("html").item(0);
		let newHead = newDocument.getElementsByTagName("head").item(0);
		let newBody = newDocument.getElementsByTagName("body").item(0);
		
		let chapterDocument = parser.parseFromString(this.htmlContent, "text/html");
		let chapterHead = chapterDocument.getElementsByTagName("head")[0];
		let chapterBody = chapterDocument.getElementsByTagName("body")[0];

		let newHeadHtml = await this.GetHeadHtml(chapterHead);
		let newBodyHtml = await this.GetBodyHtml(chapterBody);

		newHead.innerHTML = newHeadHtml;
		newBody.innerHTML = newBodyHtml;
		return newHtmlTag;
	}

	private async GetBodyHtml(chapterBody: HTMLBodyElement) : Promise<string>{
		// Inject the images directly into the html
		// Get the image tags
		let imageTags = chapterBody.getElementsByTagName("img");

		for(let i = 0; i < imageTags.length; i++){
			let newImageTag = document.createElement("img");
			let imageTag = imageTags[i];
			
			let src = imageTag.getAttribute("src");

			// Get the image from the zip package
			let imagePath = this.currentPath;
			while(src.includes("../")){
				// For each ../ go one directory up in the path
				src = src.replace('../', '');
				imagePath = GetParentDirectory(imagePath);
			}
			imagePath = imagePath + src;

			// Get the image from the zip file entries
			let index = this.book.entries.findIndex(entry => entry.filename == imagePath);
			if(index !== -1){
				// Get the image content
				var contentPromise: Promise<Blob> = new Promise((resolve) => {
					this.book.entries[index].getData(new zip.BlobWriter(), resolve);
				});
				let imageContent = await contentPromise;

				let byteContentPromise: Promise<ProgressEvent> = new Promise((resolve) => {
					let fileReader = new FileReader();
					fileReader.readAsBinaryString(imageContent);
					fileReader.onloadend = resolve;
				});
				let byteContent = await byteContentPromise;
				let rawBytesContent = byteContent.currentTarget["result"];
				let base64BytesContent = btoa(rawBytesContent);
				let mimeType = "image/jpg";

				let newSrc = `data:${mimeType};base64,${base64BytesContent}`;

				newImageTag.setAttribute("src", newSrc);
				imageTag.parentNode.replaceChild(newImageTag, imageTag)
			}
		}

		return chapterBody.outerHTML;
	}

	private async GetHeadHtml(chapterHead: HTMLHeadElement) : Promise<string>{
		// Get the link tags of the chapter head
		let chapterLinkTags = chapterHead.getElementsByTagName("link");
		let styleElement = document.createElement("style");
		let css = "";

		for(let i = 0; i < chapterLinkTags.length; i++){
			css += await this.GetStyleTagContent(chapterLinkTags[i]);
		}

		// Get the style tags and add them without changes to the css
		let chapterStyleTags = chapterHead.getElementsByTagName("style");
		for(let i = 0; i < chapterStyleTags.length; i++){
			css += chapterStyleTags[i].outerHTML;
		}

		styleElement.innerHTML = css;
		return styleElement.outerHTML;
	}

	private async GetStyleTagContent(linkTag: HTMLLinkElement) : Promise<string>{
		let type = linkTag.getAttribute("type");

		if(type == "text/css"){
			// Get the CSS file
			let href = linkTag.getAttribute("href");
			
			// Find the correct path
			let stylePath = this.currentPath;
			while(href.includes('../')){
				// Remove the '../' and the last directory in the style path
				// For each ../ go one directory up in the style path
				href = href.replace('../', '');
				stylePath = GetParentDirectory(stylePath);
			}
			stylePath = stylePath + href;

			// Get the content of the file
			let index = this.book.entries.findIndex(entry => entry.filename == stylePath);
			return index !== -1 ? await GetZipEntryContent(this.book.entries[index]) : "";
		}else{
			return "";
		}
	}
}

function GetFileDirectory(filePath: string){
	return filePath.split('/').slice(0, -1).join('/') + '/';
}

function GetParentDirectory(directoryPath: string){
	return directoryPath.split('/').slice(0, -2).join('/') + '/'
}

async function GetZipEntryContent(entry: any) : Promise<string>{
	var contentPromise: Promise<string> = new Promise((resolve) => {
		entry.getData(new zip.TextWriter(), resolve);
	});
	return await contentPromise;
}