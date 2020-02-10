import { Component, Input, ViewChild, TemplateRef } from '@angular/core';
import { Color } from '../../colors/color';
import { ColorsService } from '../../colors/colors.service';
import { Design } from '../../designs/design';
import { DesignsService } from '../../designs/designs.service';
import { DesignsEvent } from '../../designs/designs-event';
import { DialogService, DialogRef } from '../../ui/dialog.service';
import { Element } from '../../element';
import { ElementComponent } from '../element.component';
import { FontPickerService } from '../../ui/font-picker.service';
import { GlobalService } from '../../services/global.service';
import { NameAndNumber } from './name-and-number';
import { NamesAndNumbersElement } from './names-and-numbers-element';
import { Size } from '../../designs/size';
import { SizesComponent } from '../../pricing/sizes.component';
import { Subscription } from 'rxjs/Subscription';
import { SvgService } from '../../services/svg.service';

@Component({
  selector: 'app-names-and-numbers',
  styleUrls: ['./names-and-numbers.component.scss'],
  templateUrl: './names-and-numbers.component.html',
})
export class NamesAndNumbersComponent extends ElementComponent {
  private designEventsSubscription: Subscription;
  private namesAndNumbers: NameAndNumber[] = [];
  @Input() public enabled = false;
  @ViewChild('editor') editDialog: TemplateRef<any>;
  @ViewChild(SizesComponent) sizesComponent: SizesComponent;
  private dialogRef: DialogRef;
  private availableColors: Color[];
  maxLengthName = 12;
  maxLengthNumber = 3;

  constructor(
    protected dialogService: DialogService,
    protected designsService: DesignsService,
    protected fontService: FontPickerService,
    protected svgService: SvgService,
    protected colorsService: ColorsService,
    protected globalService: GlobalService
  ) {
    super(designsService, dialogService, svgService);
  }

  protected additionalOnInit() {

    this.colorsService.getNamesAndNumbersColors().subscribe(colors => this.availableColors = colors);

    this.designEventsSubscription = this.designsService.events.subscribe((designEvent: DesignsEvent) => {
      switch (designEvent.type) {
        case 'LOAD_DESIGN':
          // When loading a design, we might need to create a N&N Element that doesn't yet exist
          this.createOrUpdateElement({'setText': true});
          break;

        case 'UPDATE_DESIGN':
          this.updateElement();
          break;
      }
    });

  }

  protected onChangeDesignSide() {
    // This gives us a chance to reflect the qtys in the names/numbers editor before showing it
    this.updateElement();
  }

  onChangeEnabled(enabled: boolean) {
    if (enabled) {
      this.currentElement = this.findOrCreateCurrentElement();
      this.updateNamesAndNumbersFromDesign(this.currentDesign);
      this.updateNamesAndNumbers();
    } else {
      if (this.currentElement) {
        this.designsService.removeElement(this.currentDesign.currentArea, this.currentElement);
        this.namesAndNumbers = [];
        this.updateNamesAndNumbers();
      }
    }
  }

  openQuantities(event: Event) {
    this.sizesComponent.open();
    this.dialogService.close(this.dialogRef);
    event.preventDefault();
  }

  updateName(index: number, event: any) {
    const name: string = event.target.value.toUpperCase();
    this.namesAndNumbers[index].name = name;
    this.currentElement.nameText = name;
    this.currentElement.render().subscribe();
    this.updateNamesAndNumbers();
  }

  updateNumber(index: number, event: any) {
    const number: string = event.target.value.toUpperCase();
    this.namesAndNumbers[index].number = number;
    this.currentElement.numberText = number;
    this.currentElement.render().subscribe();
    this.updateNamesAndNumbers();
  }

  updateNameAndNumber(index: number) {
    const nameAndNumber = this.namesAndNumbers[index];
    this.currentElement.nameText = nameAndNumber.name;
    this.currentElement.numberText = nameAndNumber.number;
    this.currentElement.render().subscribe();
    this.updateNamesAndNumbers();
  }

  updateNamesAndNumbers() {
    this.designsService.updateNamesAndNumbers(this.currentDesign, this.namesAndNumbers);
  }

  hasData(): boolean {
    return this.currentDesign.namesAndNumbers.length > 0;
  }

  private updateNamesAndNumbersFromDesign(design: Design) {
    this.namesAndNumbers = design.namesAndNumbers.slice();

    design.sizes.forEach((size: Size) => {
      const desiredQuantity: number = size.quantity;
      const currentQuantity: number = this.namesAndNumbers.filter((n) => {
        return n.size === size.size;
      }).length;

      if (desiredQuantity > currentQuantity) {
        for (let i = 0; i < (desiredQuantity - currentQuantity); i++) {
          this.namesAndNumbers.push(new NameAndNumber(size.size));
        }
      } else if (desiredQuantity < currentQuantity) {

        let removeCount: number = currentQuantity - desiredQuantity;
        const indexesToRemove: number[] = [];

        // iterate through all names/numbers backwars
        const self = this;
        for (let i = this.namesAndNumbers.length - 1; removeCount > 0; i--) {
          if (self.namesAndNumbers[i].size === size.size) {
            indexesToRemove.push(i);
            removeCount--;
          }
        }

        indexesToRemove.forEach((i) => this.namesAndNumbers.splice(i, 1));
      }
    });
  }

  switchToBack() {
    if (this.currentDesign.activeSides.length) {
      if (this.globalService.preview) {
        this.edit(this.currentElement);
        var self = this;
        window.setTimeout(function(){
          self.dialogService.open(self.editDialog, { name: 'names-and-numbers', block: 1, groups: ['edit-element'] });
        }, 700);
      }

      const design = this.currentDesign;
      const back = design.activeSides[1];
      if (back !== design.currentSide) {
        this.designsService.changeSide(design, back);
      }
      this.onChangeEnabled(true);
    }
  }

  edit(element: Element) {
    this.currentElement = element;
    this.dialogRef = this.dialogService.open(this.editDialog, { name: 'names-and-numbers', block: 1, groups: ['edit-element'] });
  }

  doneEditing() {
    if (this.dialogRef) {
      this.dialogService.close(this.dialogRef);
    }
    super.doneEditing();
  }

  protected beforeRemove() {
    this.namesAndNumbers = [];
    this.updateNamesAndNumbers();
    if (this.dialogRef) {
      this.dialogService.close(this.dialogRef);
    }
  }

  protected modelClass():  string {
    return 'NamesAndNumbersElement';
  }

  private findOrCreateCurrentElement(): NamesAndNumbersElement {
    const element = this.findCurrentElement();
    if (element) {
      return element;
    }

    const area = this.currentDesign.currentArea;
    this.currentElement = new NamesAndNumbersElement(area);

    if (!this.currentElement.nameFill) {
      this.currentElement.nameFill = this.availableColors[0];
    }
    if (!this.currentElement.numberFill) {
      this.currentElement.numberFill = this.availableColors[0];
    }

    this.fontService.getFont('Anton').subscribe((font) => {
      this.currentElement.nameFont = font;
      this.currentElement.numberFont = font;
      this.currentElement.render().subscribe(() => {
        this.designsService.addElement(area, this.currentElement);
      });
    });


    return this.currentElement;
  }

  private findCurrentElement(): NamesAndNumbersElement {
    if (this.currentElement) {
      return this.currentElement;
    }

    const element = this.currentDesign.elements.find((e) => e.className === 'NamesAndNumbersElement' ) as NamesAndNumbersElement;
    if (element) {
      return element;
    }

    return null;
  }

  private createOrUpdateElement(options = {}): void {
    if (this.hasData()) {
      this.currentElement = this.findOrCreateCurrentElement();
      this.updateNamesAndNumbersFromDesign(this.currentDesign);

      if (options['setText']) {
        const firstNameAndNumber = this.namesAndNumbers[0];
        if (firstNameAndNumber) {
          this.currentElement.nameText = firstNameAndNumber.name;
          this.currentElement.numberText = firstNameAndNumber.number;
        }
      }
    }
  }

  private updateElement(): void {
    if (this.currentElement) {
      this.updateNamesAndNumbersFromDesign(this.currentDesign);
    }
  }

  protected additionalOnDestroy() {
    this.designEventsSubscription.unsubscribe();
  }
}
