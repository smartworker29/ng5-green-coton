import { Input, OnInit, OnDestroy } from '@angular/core';
import { Design } from '../designs/design';
import { DesignsService } from '../designs/designs.service';
import { DialogService } from '../ui/dialog.service';
import { Element } from '../element';
import { Subject } from 'rxjs/Subject';
import { Subscription } from 'rxjs/Subscription';
import { SvgService } from '../services/svg.service';
import 'rxjs/add/operator/debounceTime';

export class ElementComponent implements OnInit, OnDestroy {
  protected draw: any;
  protected currentDesign: Design;
  protected _effects: any = {};
  private subscription: Subscription;
  @Input() currentElement: any;
  modelChanged: Subject<[string, any]> = new Subject<[string, any]>();

  constructor(protected designsService: DesignsService, protected dialogService: DialogService, protected svgService: SvgService) {
    this.draw = this.svgService.draw();
    this.modelChanged
        .debounceTime(100)
        .subscribe((changeData) => {
          this.updateAndRender(changeData[0], changeData[1]);
        });
  }

  ngOnInit() {
    this.designsService.selectedDesign.subscribe((v) => this.currentDesign = v);

    this.subscription = this.designsService.events.subscribe(data => {
      switch (data.type) {
        case 'SELECT_ELEMENT':
          this.doneEditing();
          break;

        case 'EDIT_ELEMENT':
          if (data.payload.className === this.modelClass()) {
            this.edit(data.payload);
          }
          break;

        case 'REMOVE_ELEMENT':
          if (data.payload.className === this.modelClass()) {
            this.onRemove(data.payload);
          }
          break;

        case 'CHANGE_DESIGN_SIDE':
          this.closeEditElementDialogs();
          this.onChangeDesignSide();
          break;

        case 'LOAD_DESIGN':
          this.closeEditElementDialogs();
          this.currentDesign = data.payload;
          this.currentElement = null;
          break;
      }
    });

    this.additionalOnInit();
  }

  protected onChangeDesignSide() {
    if (this.currentElement) {
      this.currentElement.unselect();
      this.currentElement = null;
    }
  }

  protected closeEditElementDialogs() {
    this.dialogService.closeGroup('edit-element');
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
    this.additionalOnDestroy();
  }

  edit(element: Element) {
    this.currentElement = element;
  }

  doneEditing() {
    this.currentElement = null;
  }

  duplicate() {
    const newElement = this.currentElement.duplicate();
    newElement.render().subscribe(() => {
      this.designsService.addElement(this.currentDesign.currentArea, newElement);
    });
  }

  onChanges(property: string, value: any) {
    this.modelChanged.next([property, value]);
  }

  updateAndRender(property: string, value: any) {
    if(!this.currentElement) return;
    this.currentElement[property] = value;
    this.currentElement.render().subscribe(() => {
      this.designsService.updateElement(this.currentDesign.currentArea, this.currentElement);
    });
  }

  remove() {
    if (confirm('Are you sure you want to delete this?')) {
      this.beforeRemove();
      this.designsService.removeElement(this.currentDesign.currentArea, this.currentElement);
    }
  }

  protected beforeRemove() {}

  protected onRemove(element: Element) {
    this.beforeRemove();
    element.remove();
    this.currentElement = null;
  }

  close() {
    this.currentElement.unselect();
    this.currentElement = null;
  }

  protected modelClass(): string {
    return 'Element';
  }

  protected additionalOnInit() {}
  protected additionalOnDestroy() {}
}
