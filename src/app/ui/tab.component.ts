import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { DesignsService } from '../designs/designs.service';
import { Subscription } from 'rxjs/Subscription';
import { TabsComponent } from './tabs.component';

@Component({
  selector: 'app-tab',
  template: `
    <div [hidden]="!active">
      <ng-content></ng-content>
    </div>
  `
})
export class TabComponent implements OnInit, OnDestroy {
  @Input() tabTitle;
  @Input() tabIcon;
  @Input() elementType;
  @Input() dialogComponent: Component;
  subscription: Subscription;
  active = false;

  constructor(private tabs: TabsComponent, private designsService: DesignsService) {
    this.tabs.addTab(this);
  }

  ngOnInit() {
    this.subscription = this.designsService.events.asObservable().subscribe(data => {
      switch (data.type) {
        case 'EDIT_ELEMENT':
          if (data.payload.className === this.elementType) {
            this.tabs.selectTab(this);
          }
          break;
        case 'CHANGE_DESIGN_SIDE':
          this.tabs.tabs.forEach((tab) => tab.active = false);
          break;
      };
    });
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }
}
