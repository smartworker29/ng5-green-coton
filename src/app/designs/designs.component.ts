import { AccountService } from '../services/account.service'
import { AccountEvent } from '../services/account-event'
import { Component, OnInit, OnDestroy } from '@angular/core';
import { ColorsService } from '../colors/colors.service';
import { Design } from './design';
import { DesignsService } from './designs.service';
import { DialogService, DialogRef } from '../ui/dialog.service';
import { ProductsService } from '../products/products.service';
import { Subscription } from 'rxjs/Subscription';
import { SvgService } from '../services/svg.service';

@Component({
  selector: 'app-designs',
  styleUrls: ['./designs.component.scss'],
  templateUrl: './designs.component.html',
})

export class DesignsComponent implements OnInit, OnDestroy {
  draw: any;
  error: string;
  public currentDesign: Design;
  public designs: Design[];
  private accountSubscription: Subscription;
  private designSubscription: Subscription;
  private designsSubscription: Subscription;
  private productsSubscription: Subscription;
  private dialogRef: DialogRef;

  constructor(
    private dialogService: DialogService,
    private svgService: SvgService,
    private designsService: DesignsService,
    private productsService: ProductsService,
    private colorsService: ColorsService,
    private accountService: AccountService,
  ) {
    this.draw = this.svgService.draw();
  }

  ngOnInit() {
    this.accountSubscription = this.accountService.events.subscribe((accountEvent: AccountEvent) => {
      switch (accountEvent.type) {
        case 'ACCOUNT_LOGIN': {
          this.designsService.loadDesigns().subscribe(
            (designs) => { this.designs = designs.sort((a, b) => {
                if (a.createdAt > b.createdAt) {
                  return -1;
                }

                if (a.createdAt < b.createdAt) {
                  return 1;
                }

                return 0;
            });
            },
            (error) => { console.error('error: %o', error); },
          );
        }
      }
    });

    this.designSubscription = this.designsService.selectedDesign.subscribe((design) => this.currentDesign = design);
    this.designsSubscription = this.designsService.designs.subscribe((designs) => { this.designs = designs });
    this.designsService.loadDesigns().subscribe(
      (designs) => { this.designs = designs.sort((a, b) => {
          if (a.createdAt > b.createdAt) {
            return -1;
          }

          if (a.createdAt < b.createdAt) {
            return 1;
          }

          return 0;
       });
      },
      (error) => { console.error('error: %o', error); },
    );
  }

  openDialog(content) {
    this.dialogService.closeAll();
    this.dialogRef = this.dialogService.open(content, { name: 'design-cart', size: 'lg' });
  }

  onEdit(design: Design, designName: any) {
    design.editing = true;
    const self = this;
    window.setTimeout(function() {
      const nameInput = self.nameInputFor(design);
      nameInput.focus();
      nameInput.setSelectionRange(0, nameInput.value.length);
    }, 100);
  }

  onLoad(design: Design, event: Event) {
    // TODO: prompt for saving current design if dirty
    if (design.compatible) {
      this.designsService.selectDesign(design.id);
    } else {
      window.location.href = design.legacyLoadUrl();
    }

    this.dialogService.close(this.dialogRef);
    event.preventDefault();
  }

  onRemove(design: Design, event: Event) {
    if (confirm('Are you sure you want to delete this design?')) {
      this.designsService.removeDesign(design);
    }
  }

  onSaveName(design: Design) {
    design.name = this.nameInputFor(design).value;
    design.editing = false;
    this.designsService.saveDesign(design).subscribe();
  }

  isLoggedIn() {
    if (this.accountService.account['id']) {
      return true;
    } else {
      return false;
    }
  }

  private nameInputFor(design: Design): any {
    return document.getElementById('name-' + design.id);
  }

  ngOnDestroy() {
    this.designsSubscription.unsubscribe();
    this.designSubscription.unsubscribe();
    if (this.productsSubscription) {
      this.productsSubscription.unsubscribe();
    }
  }
}
