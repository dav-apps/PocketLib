import * as JSZip from 'jszip';

export class EpubBook{
   title: string;
   author: string;
   language: string;
	cover: EpubManifestItem;
	coverSrc: string;
	chapters: EpubChapter[] = [];
	entries: { [key: string]: JSZip.JSZipObject }
	manifestItems: EpubManifestItem[] = [];
	toc: EpubTocItem[] = [];

   async ReadEpubFile(zipFile: Blob){
		this.chapters = [];
		this.entries = {};
		this.manifestItems = [];

		// Load the entries of the zip file
		this.entries = (await JSZip.loadAsync(zipFile)).files;

		// Get the container file
		let containerEntry = this.entries["META-INF/container.xml"];
		if(!containerEntry){
			// The epub file is invalid
			// TODO Show some error
			return;
		}
   
		// Get the content of the container file
		let opfFilePath = await GetOpfFilePath(containerEntry);
      let opfFileDirectory = GetFileDirectory(opfFilePath);
		
		// Get the opf file
		let opfFileEntry = this.entries[opfFilePath];
		if(!opfFileEntry){
			// The epub file is invalid
			// TODO Show some error
			return;
		}

		// Get the content of the opf file
		let opfContent = await opfFileEntry.async("text");

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
					let coverEntry = this.entries[this.cover.href];
					let coverContent = await coverEntry.async("base64");

					// Get the mime type
					let mimeType = this.cover.mediaType;
					this.coverSrc = `data:${mimeType};base64,${coverContent}`;
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

				// Find the entry with the filename
				var key = Object.keys(this.entries).find(entry => entry.includes(itemPath));
				if(!key) continue;

				// Read the content of the entry
				let entryContent = await this.entries[key].async("text");
				this.chapters.push(new EpubChapter(this, idref, itemPath, entryContent));
			}
		}

		// Get the toc file
		let tocFilePath = "toc.ncx";
		let tocDirectory = "";
		
		if(opfFilePath.includes('/')){
			tocDirectory = opfFilePath.slice(0, opfFilePath.lastIndexOf('/')) + "/";
			tocFilePath = tocDirectory + "toc.ncx";
		}

		let tocEntry = this.entries[tocFilePath];
		if(!tocEntry){
			// toc file does not exist
			return;
		}

		// Get the content of the toc file
		let tocContent = await tocEntry.async("text");

		let tocDoc = parser.parseFromString(tocContent, "text/xml");
		let navMap = tocDoc.getElementsByTagName("navMap")[0];
		this.toc = GetTocItems(navMap, tocDirectory);
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
			css += chapterStyleTags[i].innerHTML;
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
			let entry = this.book.entries[stylePath];
			return entry ? await entry.async("text") : "";
		}else{
			return "";
		}
	}

	private async ReplaceFontFileUrlsWithContent(css: string) : Promise<string>{
		// Replace the font file references with the content of them
		let completeFontUrl = GetFirstUrlParameterFromCssString(css);
		let fontUrl = completeFontUrl ? completeFontUrl.replace("\"", "").replace("\"", "").replace("'", "").replace("'", "") : null;

		while(completeFontUrl != null){
			// Get the correct url of the font file
         let fontFilePath = MergePaths(this.currentPath, fontUrl);
         let newUrl = "";

			let entry = this.book.entries[fontFilePath];
			if(entry){
				// Get the content of the file
				let fontFileContent = await entry.async("base64");

				// Get the mime type from the manifest items
            let index = this.book.manifestItems.findIndex(item => item.href == fontFilePath)
            let mimeType = index !== -1 ? this.book.manifestItems[index].mediaType : "application/x-font-ttf";

            newUrl = `data:${mimeType};base64,${fontFileContent}`;
			}

			// Replace the url with the raw data
			css = css.replace(completeFontUrl, newUrl);

			// Get the next url
			completeFontUrl = GetFirstUrlParameterFromCssString(css);
		}
		return css;
	}
	
	private async GetBodyHtml(chapterBody: HTMLBodyElement) : Promise<string>{
		// Inject the images directly into the html
		// Get the img tags with src attribute
		let imgTags = chapterBody.getElementsByTagName("img");
		
		for(let i = 0; i < imgTags.length; i++){
			let imageTag = imgTags[i];
			let src = imageTag.getAttribute("src");
         let newSrc = await this.GetRawImageSource(src);
	
			// Create the new image tag with the new src
         let newImageTag = document.createElement("img");
         
         let imageLoadPromise = new Promise(resolve => {
            newImageTag.onload = resolve
         });
         newImageTag.src = newSrc
         
			// Wait until the image loaded
			await imageLoadPromise;

			// Set the width and height attributes
			newImageTag.setAttribute("height", newImageTag.naturalHeight.toString());
			newImageTag.setAttribute("width", newImageTag.naturalWidth.toString());

			// Replace the old image tag with the new one
			imageTag.parentNode.replaceChild(newImageTag, imageTag)
		}

		// Get the images from svg tags and add them as img tags
		let svgTags = chapterBody.getElementsByTagName("svg");
		for(let i = 0; i < svgTags.length; i++){
			let svgTag = svgTags[i];
			
			// Get the image tags
			let imageTags = chapterBody.getElementsByTagName("image");
			let newImageTags = [];

			for(let j = 0; j < imageTags.length; j++){
				let imageTag = imageTags[i];
				let src = imageTag.getAttribute("xlink:href");
				let newSrc = await this.GetRawImageSource(src);

				// Get height & width
				let height = imageTag.getAttribute("height");
				let width = imageTag.getAttribute("width");

				// Create the new image tag with the new src
				let newImageTag = document.createElement("img");
				newImageTag.src = newSrc;
				newImageTag.setAttribute("height", height);
            newImageTag.setAttribute("width", width);
				newImageTags.push(newImageTag);
			}

			// Replace the svg tags with the content
			for(let newImageTag of newImageTags){
				svgTag.parentNode.replaceChild(newImageTag, svgTag);
			}
		}
	
		return chapterBody.outerHTML;
	}

	private async GetRawImageSource(src: string) : Promise<string>{
		// Get the image from the zip package
		let imagePath = MergePaths(this.currentPath, src);
	
		// Get the image from the zip file entries
		let entry = this.book.entries[imagePath];
		if(entry){
			// Get the image content
			let imageContent = await entry.async("base64");
			
			// Get the mime type from the manifest items
			let index = this.book.manifestItems.findIndex(item => item.href == imagePath);
			let mimeType = index !== -1 ? this.book.manifestItems[index].mediaType : "image/jpg";
	
			return `data:${mimeType};base64,${imageContent}`;
		}
		return "";
	}
}

export class EpubManifestItem{
	constructor(
		public id: string,
		public href: string,
		public mediaType: string
	){}
}

export class EpubTocItem{
	constructor(
		public id: string,
		public title: string,
		public href: string,
		public items: EpubTocItem[]
	){}
}

async function GetOpfFilePath(containerEntry: JSZip.JSZipObject) : Promise<string>{
	let containerContent = await containerEntry.async("text");

	let parser = new DOMParser();
	let containerDoc = parser.parseFromString(containerContent, "text/xml");
	let container = containerDoc.getElementsByTagName("container")[0];
	let rootFiles = container.getElementsByTagName("rootfiles")[0]
	let rootFile = rootFiles.getElementsByTagName("rootfile")[0];
	return rootFile.getAttribute("full-path");
}

function GetFileDirectory(filePath: string){
   let directory = filePath.split('/').slice(0, -1).join('/');
   if(directory.length > 0){
      directory += '/';
   }
	return directory;
}

function GetParentDirectory(directoryPath: string){
	// If the path is not root, remove the deepest directory (the last two parts of the directory parts array)
	let directoryParts = directoryPath.split('/');

	let removedNumberOfElements = 1;
	if(directoryParts.length > 2){
		removedNumberOfElements = 2;
	}
	directoryParts = directoryParts.slice(0, -removedNumberOfElements);

	return directoryParts.join('/') + '/';
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

	return css.slice(startIndex, endIndex);
}

function GetTocItems(parentElement: Element, tocDirectory: string) : EpubTocItem[]{
	let navpoints = parentElement.getElementsByTagName("navPoint");
	let tocItems: EpubTocItem[] = [];
	
	for(let i = 0; i < navpoints.length; i++){
		let item = navpoints.item(i);
		if(item.parentElement == parentElement){
			tocItems.push(GetTocItem(item, tocDirectory));
		}
	}

	return tocItems;
}

function GetTocItem(navpoint: Element, tocDirectory: string) : EpubTocItem{
	// Get the id
	let id = navpoint.getAttribute('id');

	// Get the title
	let navlabel = navpoint.getElementsByTagName("navLabel")[0];
	let text = navlabel.getElementsByTagName("text")[0];
	let title = text.innerHTML;

	// Get the href
	let content = navpoint.getElementsByTagName("content")[0];
	let href = MergePaths(tocDirectory, content.getAttribute("src"))

	// Get nested items
	let items = GetTocItems(navpoint, tocDirectory);

	return new EpubTocItem(id, title, href, items);
}