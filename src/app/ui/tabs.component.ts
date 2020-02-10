import { Component, EventEmitter, Output } from '@angular/core';
import { TabComponent } from './tab.component';

import { DesignComponent } from '../designs/design.component';

@Component({
  selector: 'app-tabs',
  styles: [`
    .toolbar-item {
      flex-grow: 1;
      cursor: pointer;
    }
  `],
  template: `
    <div>
      <span class="toolbar-item" *ngFor="let tab of tabs" (click)="selectTab(tab)" [ngClass]="tab.active ? 'active' : ''">
        <div>{{tab.tabIcon}}</div>
        <br>
        {{tab.tabTitle}}
      </span>
    </div>
  `,
  entryComponents: [
    DesignComponent,
  ]
})
export class TabsComponent {
  tabs: TabComponent[] = [];
  @Output() selectedTab = new EventEmitter<TabComponent>();

  constructor() {}

  addTab(tab: TabComponent) {
    if (this.tabs.length === 0) {
      tab.active = true;
    }
    this.tabs.push(tab);
  }

  selectTab(tab: TabComponent) {
    this.tabs.forEach((t) => {
      t.active = false;
    });
    tab.active = true;
    this.selectedTab.emit(tab);

    switch (tab.dialogComponent) {
      case 'DesignComponent': {
        // const dialogRef = this.dialog.open(DesignComponent);
        break;
      }
    }
  }
}
