import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import { Input, Output } from '@angular/core';
import { DialogService, DialogRef } from './dialog.service';
import { EventEmitter } from '@angular/core';
import { FontPickerService} from './font-picker.service';
import { Font } from './font.interfaces';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/take';
import * as _ from 'lodash';

@Component({
  selector: 'app-ui-font-picker',
  styles: [`
    .btn-open-font-picker {
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 100%;
    }
    .fonts-container {
      max-height: 400px;
      overflow-y: scroll;
      position: relative; /* so we can determine if children are visible */
    }
    .sample {
      font-size: 32px;
    }
  `],
  templateUrl: './font-picker.component.html',
})
export class FontPickerComponent implements OnInit {
  @Input() text: string;
  @Input() font: Font;
  @Input() fontFeatures: string;
  @Output() fontChange: EventEmitter<Font> = new EventEmitter();
  @ViewChild('dropdownMenu') dropdownMenu: ElementRef;
  @ViewChild('fontPicker') fontPicker: ElementRef;
  @ViewChild('fontsContainer') fontsContainer: ElementRef;
  fonts$: Observable<Font[]>;
  categories$: Observable<string[]>;
  selectedCategory: string;
  private dialogRef: DialogRef;

  // These are used to help optimize how many dropdown items we consider on scroll
  private _firstKnownVisibleIndex = 0;
  private _lastKnownVisibleIndex = 0;
  private _visibleItemsWindow = 30;

  constructor(private dialogService: DialogService, private fontsService: FontPickerService) { }

  ngOnInit() {
    this.loadAllFonts();
  }

  openFontPicker() {
    this.dialogRef = this.dialogService.open(this.fontPicker, { name: 'font-picker', size: 'lg' });
    // TODO: figure out how to trigger onScroll when open
    // TODO: also, scroll to currently selected font
  }

  onScroll(e: Event) {
    const target = e.target as HTMLElement;
    this.checkForFontsToLoad(target, target.scrollTop);
  }

  checkForFontsToLoad(parent: HTMLElement, scrollTop: number) {
    const children = parent.children;
    const start = Math.max(0, this._lastKnownVisibleIndex - this._visibleItemsWindow);
    const end = Math.min(children.length, this._lastKnownVisibleIndex + this._visibleItemsWindow);
    let first: number = null;
    let last: number = null;
    const fontsToLoad = [];
    for (let i = start; i < end; i++) {
      const item = children[i] as HTMLElement;
      if (this.isVisible(item, scrollTop)) {
        if (first === null) {
          first = i;
        }
        if (!item.classList.contains('font-loaded')) {
          const sample = item.querySelector('.sample') as HTMLElement;
          const fontFamily = sample.style.fontFamily.replace(/"/g, '');
          fontsToLoad.push(fontFamily);
          item.classList.add('font-loaded');
        }
      } else {
        if (first !== null) {
          last = i - 1;
          break;
        }
      }
    }

    if (last === null) {
      last = end;
    }

    this._firstKnownVisibleIndex = first;
    this._lastKnownVisibleIndex = last;

    if (fontsToLoad.length) {
      this.fontsService.loadFonts(fontsToLoad).subscribe();
    }
  }

  selectFont(font: Font, e: Event) {
    this.font = font;
    this.fontChange.emit(font as Font);
    this.dialogService.close(this.dialogRef);
    e.stopPropagation();
  }

  loadFonts(category: string) {
    this.selectedCategory = category;
    this.fonts$ = this.fonts$.map(fonts => fonts.filter(f => f.category === this.selectedCategory));
  }

  private loadAllFonts() {
    this.fonts$ = this.fontsService.getAvailableGoogleFonts(this.fontFeatures);
    this.fonts$.subscribe(fonts => this.fontsService.loadFonts(fonts.map(f => f.family)).subscribe());
    this.categories$ = this.fonts$.map(fonts => {
      return _.uniq(fonts.map(f => f.category));
    });
    this.categories$.subscribe(categories => {
      this.selectedCategory = this.font && this.font.category ? this.font.category : categories[0];
      this.loadFonts(this.selectedCategory);
    });
  }

  private isVisible(el, scrollTop): boolean {
    return el.offsetTop < (600 + scrollTop);
  }
}
