import { Component, EventEmitter, OnChanges, OnInit, SimpleChanges, TemplateRef, ViewChild,
  Input, Output } from '@angular/core';
import { DialogService, DialogRef } from './dialog.service';
import { Color } from '../colors/color';
import * as _ from 'lodash';

@Component({
  selector: 'app-color-picker',
  styleUrls: ['./color-picker.component.scss'],
  templateUrl: './color-picker.component.html',
})
export class ColorPickerComponent implements OnChanges, OnInit {
  @Input() selectedColor: Color;
  @Input() selectedColors: Color[] = [];
  @Input() availableColors: Color[];
  @Input() multiple = false;
  @Input() minimumColors = 1;
  @Input() maximumColors = 999;
  @Input() allowGarmentColor = true;
  @ViewChild('colorsEditor') colorsEditor: TemplateRef<any>;

  @Output() selectColor: EventEmitter<Color> = new EventEmitter();
  @Output() selectColors: EventEmitter<Color[]> = new EventEmitter();

  private _selectedColors: Color[];
  private dialogRef: DialogRef;
  garmentColor: Color;

  constructor(private dialogService: DialogService) {}

  ngOnInit() {
    this._selectedColors = this.selectedColors.slice();
    if (this.selectedColor) {
      this._selectedColors.push(this.selectedColor);
    }
    this.garmentColor = Color.garmentColor();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.selectedColor) {
      this._selectedColors = [changes.selectedColor.currentValue];
    }
  }

  openColorsEditor(e: Event) {
    this.dialogRef = this.dialogService.open(this.colorsEditor, { name: 'colors', class: 'sm' });
    e.stopPropagation();
  }

  onSelectedColor(color: Color, event: Event) {
    if (this.multiple) {
      if (this.isActive(color)) {
        _.remove(this._selectedColors, { id: color.id });
      } else {
        this._selectedColors.push(color);
      }
    } else {
      this._selectedColors = [color];
    }
    event.stopPropagation();
  }

  onDone(e: Event) {
    if (this.multiple) {
      this.selectedColors = this._selectedColors.slice();
      this.selectColors.emit(this._selectedColors);
    } else {
      this.selectedColor = this._selectedColors[0];
      this.selectColor.emit(this._selectedColors[0]);
    }
    this.dialogService.close(this.dialogRef);
    e.stopPropagation();
  }

  isActive(color: Color): boolean {
    if (this.multiple) {
      return !!(this._selectedColors.find(function(c) {
        return c.id === color.id;
      }));
    } else {
      if (!this._selectedColors.length) {
        return false;
      }
      return !!(this._selectedColors[0].id === color.id);
    }
  }

  _selectedColorsDisplay(): string {
    return this._selectedColors.map((c) => c.name ).join(', ');
  }

  tooManyColors(): boolean {
    return (this.multiple && (this._selectedColors.length > this.maximumColors));
  }

  notEnoughColors(): boolean {
    return (this.multiple && (this._selectedColors.length < this.minimumColors));
  }

  validColorCount(): boolean {
    return (!this.tooManyColors() && !this.notEnoughColors());
  }

  pluralizedColor(count: number): string {
    if (count === 1) {
      return 'color';
    }
    return 'colors';
  }
}
