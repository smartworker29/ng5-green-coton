import { Component } from '@angular/core';

@Component({
  selector: 'app-ui-loading',
  template: `
    <i class="fa fa-spinner fa-pulse fa-3x fa-fw"></i>
  `,
})

export class LoadingComponent {
  constructor() { }
}
