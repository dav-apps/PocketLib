declare var zip: any;

export class EpubBook{
   title: string;
   author: string;
   language: string;
	cover: EpubManifestItem;
	coverSrc: string;
	chapters: EpubChapter[] = [];
	entries: any[] = [];
   manifestItems: EpubManifestItem[] = [];

   async ReadEpubFile(zipFile: File){
		zip.workerScriptsPath = "/assets/libraries/";
		
		this.chapters = [];
		this.entries = [];
		this.manifestItems = [];
      
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
		let opfFilePath = await GetOpfFilePath(containerEntry);
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
		let opfContent = await GetZipEntryTextContent(opfFileEntry);

		// Read the OPF file content
		let parser = new DOMParser();
		let opfDoc = parser.parseFromString(opfContent, "text/xml");

		// Get the manifest items
		let manifestTag = opfDoc.getElementsByTagName("manifest")[0];
		let manifestItemTags = manifestTag.getElementsByTagName("item");

		for(let i = 0; i < manifestItemTags.length; i++){
			let manifestItemTag = manifestItemTags[i];
			this.manifestItems.push(new EpubManifestItem(manifestItemTag.getAttribute("id"), opfFileDirectory + manifestItemTag.getAttribute("href"), manifestItemTag.getAttribute("media-type")));
      }
      
      // Get the metadata content
      let metadataTag = opfDoc.getElementsByTagName("metadata")[0];
      let titleItem = metadataTag.getElementsByTagName("dc:title").item(0);
      if(titleItem) this.title = titleItem.innerHTML;
      let authorItem = metadataTag.getElementsByTagName("dc:creator").item(0);
      if(authorItem) this.author = authorItem.innerHTML;
      let languageItem = metadataTag.getElementsByTagName("dc:language").item(0);
      if(languageItem) this.language = languageItem.innerHTML;

      // Find the cover image tag
      let metaTags = metadataTag.getElementsByTagName("meta");
      for(let i = 0; i < metaTags.length; i++){
         let metaTagName = metaTags.item(i).getAttribute("name");
         if(metaTagName == "cover"){
            // Get the content attribute
            let metaTagContent = metaTags.item(i).getAttribute("content");

            // Find the manifest item with id = metaTagContent
            let index = this.manifestItems.findIndex(item => item.id == metaTagContent);
            if(index !== -1){
					this.cover = this.manifestItems[index];
					
					// Get the content of the cover file
					index = this.entries.findIndex(entry => entry.filename == this.cover.href);
					
					if(index !== -1){
						let coverBlob = await GetZipEntryBlobContent(this.entries[index]);
						let coverByteContent = await GetBlobContent(coverBlob);
						let base64ByteContent = btoa(coverByteContent);

						// Get the mime type
						let mimeType = this.cover.mediaType;
						this.coverSrc = `data:${mimeType};base64,${base64ByteContent}`;
					}
            }
         }
      }

		// Get the spine content
		let spineTag = opfDoc.getElementsByTagName("spine")[0];
		this.chapters = [];

		let spineItemTags = spineTag.getElementsByTagName("itemref");
		for(let i = 0; i < spineItemTags.length; i++){
			let idref = spineItemTags[i].getAttribute("idref");

			// Get the item with the id from the manifest items
			let index = this.manifestItems.findIndex(item => item.id == idref);
			if(index !== -1){
				let itemPath = this.manifestItems[index].href;

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
      
		styleElement.innerHTML = await this.ReplaceFontFileUrlsWithContent(css);
		return styleElement.outerHTML;
   }
	
	private async GetStyleTagContent(linkTag: HTMLLinkElement) : Promise<string>{
		let type = linkTag.getAttribute("type");
	
		if(type == "text/css"){
			// Get the CSS file
			let href = linkTag.getAttribute("href");
			
			// Find the correct path
			let stylePath = MergePaths(this.currentPath, href);
			
			// Get the content of the file
			let index = this.book.entries.findIndex(entry => entry.filename == stylePath);
			return index !== -1 ? await GetZipEntryTextContent(this.book.entries[index]) : "";
		}else{
			return "";
		}
	}

	private async ReplaceFontFileUrlsWithContent(css: string) : Promise<string>{
		// Replace the font file references with the content of them
		let fontUrl = GetFirstUrlParameterFromCssString(css);

		while(fontUrl != null){
			// Get the correct url of the font file
         let fontFilePath = MergePaths(this.currentPath, fontUrl);
         let newUrl = "";

			// Get the content of the file
			let index = this.book.entries.findIndex(entry => entry.filename == fontFilePath);
			if(index !== -1){
				let fontFileBlob = await GetZipEntryBlobContent(this.book.entries[index]);
				let fontFileContent = await GetBlobContent(fontFileBlob);
				let base64FontFileContent = btoa(fontFileContent);

				// Get the mime type from the manifest items
            index = this.book.manifestItems.findIndex(item => item.href == fontFilePath)
            let mimeType = index !== -1 ? this.book.manifestItems[index].mediaType : "application/x-font-ttf";

            newUrl = `data:${mimeType};base64,${base64FontFileContent}`;
			}

			// Replace the url with the raw data
			css = css.replace(fontUrl, newUrl)

			// Get the next url
			fontUrl = GetFirstUrlParameterFromCssString(css);
		}
		return css;
	}
	
	private async GetBodyHtml(chapterBody: HTMLBodyElement) : Promise<string>{
		// Inject the images directly into the html
		// Get the image tags
		let imageTags = chapterBody.getElementsByTagName("img");
	
		for(let i = 0; i < imageTags.length; i++){
			let imageTag = imageTags[i];
			let src = imageTag.getAttribute("src");
	
			// Get the image from the zip package
			let imagePath = MergePaths(this.currentPath, src);
	
			// Get the image from the zip file entries
			let index = this.book.entries.findIndex(entry => entry.filename == imagePath);
			if(index !== -1){
				// Get the image content
				let imageContent = await GetZipEntryBlobContent(this.book.entries[index]);
				let byteContent = await GetBlobContent(imageContent);
				let base64BytesContent = btoa(byteContent);
	
				// Get the mime type from the manifest items
				index = this.book.manifestItems.findIndex(item => item.href == imagePath);
				let mimeType = index !== -1 ? this.book.manifestItems[index].mediaType : "image/jpg";
	
				let newSrc = `data:${mimeType};base64,${base64BytesContent}`;
	
				// Creata the new image tag with the new src
				let newImageTag = document.createElement("img");
				newImageTag.setAttribute("src", newSrc);
	
				// Replace the old image tag with the new one
				imageTag.parentNode.replaceChild(newImageTag, imageTag)
			}
		}
	
		return chapterBody.outerHTML;
	}
}

export class EpubManifestItem{
	constructor(
		public id: string,
		public href: string,
		public mediaType: string
	){}
}

async function GetOpfFilePath(containerEntry: any) : Promise<string>{
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

function GetFileDirectory(filePath: string){
	return filePath.split('/').slice(0, -1).join('/') + '/';
}

function GetParentDirectory(directoryPath: string){
	return directoryPath.split('/').slice(0, -2).join('/') + '/'
}

async function GetZipEntryTextContent(entry: any) : Promise<string>{
	var contentPromise: Promise<string> = new Promise((resolve) => {
		entry.getData(new zip.TextWriter(), resolve);
	});
	return await contentPromise;
}

async function GetZipEntryBlobContent(entry: any) : Promise<Blob>{
	var contentPromise: Promise<Blob> = new Promise((resolve) => {
		entry.getData(new zip.BlobWriter(), resolve);
	});
	return await contentPromise;
}

async function GetBlobContent(blob: Blob) : Promise<string>{
	let byteContentPromise: Promise<ProgressEvent> = new Promise((resolve) => {
		let fileReader = new FileReader();
		fileReader.onloadend = resolve;
		fileReader.readAsBinaryString(blob);
	});
	let byteContent = await byteContentPromise;
	return byteContent.currentTarget["result"];
}

function MergePaths(currentPath: string, source: string){
	let path = currentPath;
	while(source.includes("../")){
		// For each ../ go one directory up in the path
		source = source.replace('../', '');
		path = GetParentDirectory(path);
	}
	return path + source;
}

function GetFirstUrlParameterFromCssString(css: string) : string{
   let startPosition = 0;
   let index = -1;

   // Get the first url property without raw data
   while(true){
      index = css.indexOf("url(", startPosition);

      // Return null if there is no url
      if(index == -1){
         return null;
      }

      // Check if the url already contains the raw data
      // If there is something like url(data: there is raw data
      if(css.slice(index + 4, index + 9) == "data:"){
         startPosition = index + 1;
      }else{
         break;
      }
   }

   let currentChar = css[index];
   let isInParenthesis = false;
   let startIndex = index;
   let endIndex = index;

   while(currentChar != ')'){
      if(!isInParenthesis && currentChar == "("){
         isInParenthesis = true;
         startIndex = index + 1;
         continue;
      }

      index++;
      currentChar = css[index];

      if(isInParenthesis && currentChar != ')'){
         // Get the text in the parenthesis
         endIndex = index + 1;
      }
   }

   return css.slice(startIndex, endIndex)
}