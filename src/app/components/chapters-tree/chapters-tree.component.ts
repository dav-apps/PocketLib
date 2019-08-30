import { Component, Output, EventEmitter } from '@angular/core';
import { MatTreeNestedDataSource } from '@angular/material/tree';
import { NestedTreeControl } from '@angular/cdk/tree';
import { BehaviorSubject } from 'rxjs';
import { EpubTocItem } from 'src/app/models/EpubBook';

@Component({
	selector: 'pocketlib-chapters-tree',
	templateUrl: './chapters-tree.component.html'
})
export class ChaptersTreeComponent{
	@Output() linkClick = new EventEmitter();
   dataSource: MatTreeNestedDataSource<ChapterNode>;
   treeControl: NestedTreeControl<ChapterNode>;
   dataChange: BehaviorSubject<ChapterNode[]> = new BehaviorSubject<ChapterNode[]>([]);
   chapters: ChapterNode[] = [];
	
	constructor(){
		this.dataSource = new MatTreeNestedDataSource();
		this.treeControl = new NestedTreeControl<ChapterNode>((node: ChapterNode) => node.chapters);
		this.dataChange.subscribe(data => this.dataSource.data = data);
	}

	hasNestedChild = (i: number, node: ChapterNode) => { return node.chapters.length > 0 }
	
	Init(toc: EpubTocItem[]){
		// Convert the EpubTocItems to ChapterNodes
		this.chapters = this.ConvertEpubTocItemsToChapterNodes(toc);
		this.dataChange.next(this.chapters)
	}

	ConvertEpubTocItemsToChapterNodes(toc: EpubTocItem[]) : ChapterNode[]{
		let chapters: ChapterNode[] = [];

		for(let tocItem of toc){
			let chapterNode: ChapterNode = {
				title: tocItem.title,
				href: tocItem.href,
				chapters: this.ConvertEpubTocItemsToChapterNodes(tocItem.items)
			}
			chapters.push(chapterNode);
		}

		return chapters;
	}

	LinkClicked(node: ChapterNode){
		this.linkClick.emit(node.href);
		return false;
	}
}

interface ChapterNode{
   title: string;
   href: string;
   chapters: ChapterNode[];
}