import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';

@Component({
  selector: 'app-ui-precision-range',
  styleUrls: ['./precision-range.component.scss'],
  templateUrl: './precision-range.component.html',
})
export class PrecisionRangeComponent implements OnChanges {
  @Input() label: string;
  @Input() uom: string;
  @Input() min: number;
  @Input() max: number;
  @Input() step: number;
  @Input() precision = 3;
  @Input() value: number;
  @Input() conversionType: string;
  @Input() conversionFactor: number;
  @Output() onChange = new EventEmitter<number>();
  displayValue: number;
  size: number;

  ngOnChanges() {
    this.displayValue = this.convertForDisplay(this.value);
    this.updateInputSize();
  }

  increase(e: Event) {
    const newValue = this.value + this.step;
    this.valueChanged(Math.min(newValue, this.max));
    e.stopPropagation();
  }

  decrease(e: Event) {
    const newValue = this.value - this.step;
    this.valueChanged(Math.max(newValue, this.min));
    e.stopPropagation();
  }

  updateValue(value: number) {
    let newValue = this.convertValueForStorage(value);

    newValue = Math.min(newValue, this.max);
    newValue = Math.max(this.min, newValue);
    this.valueChanged(newValue);
  }

  private valueChanged(value: number) {
    this.value = value;
    this.displayValue = this.convertForDisplay(this.value);
    this.updateInputSize();
    this.onChange.emit(value);
  }

  selectAll(e: Event) {
    (e.target as HTMLInputElement).select();
  }

  private convertForDisplay(value: number) {
    switch (this.conversionType) {
      case 'pixelsPerInch':
        value = value / this.conversionFactor;
        break;
    }
    return this.roundToPrecision(value);
  }

  private convertValueForStorage(value: number) {
    switch (this.conversionType) {
      case 'pixelsPerInch':
        return value * this.conversionFactor;
      default:
        return value;
    }
  }

  private updateInputSize() {
    this.size = this.roundToPrecision(this.displayValue).toString().replace('.', '').length + 1;
  }

  private roundToPrecision(value: number): number {
    return parseFloat((Math.round(value * 100) / 100).toFixed(this.precision));
  }
}
