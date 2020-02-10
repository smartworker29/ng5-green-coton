import { Component, EventEmitter, Input, OnDestroy, OnInit, Output, TemplateRef, ViewChild } from '@angular/core';
import { AlertsService, Alert } from '../../ui/alerts.service';
import { Category } from './category';
import { Clipart } from './clipart';
import { ClipartService } from './clipart.service';
import { DialogService, DialogRef } from '../../ui/dialog.service';
import { environment } from '../../../environments/environment';
import { Subscription } from 'rxjs/Subscription';

@Component({
  selector: 'app-clipart-browser',
  styleUrls: ['./clipart-browser.component.scss'],
  templateUrl: './clipart-browser.component.html',
})
export class ClipartBrowserComponent implements OnInit, OnDestroy {
  @Input() searchString = '';
  @Output() selectedClipart = new EventEmitter<Clipart>();
  private searchError = '';
  public category: Category;
  public subcategory: Category;
  public categories: Category[] = [];
  public cliparts: Clipart[] = [];
  private clipartSubscription: Subscription;
  private dialogRef: DialogRef;
  @ViewChild('clipartBrowser') browseDialog: TemplateRef<any>;
  protected page = 1;
  loading = false;
  public greek = false;

  constructor (
    private alertsService: AlertsService,
    private clipartService: ClipartService,
    private dialogService: DialogService,
  ) {}

  ngOnInit() {
    this.clipartSubscription = this.clipartService.getCategories().subscribe((categories) => {
      this.categories = categories;
      if (this.categories[0]) {
        this.category = this.categories[0];
        if (this.category) {
          this.subcategory = this.category.subcategories[0];
        }
        this.getCliparts(this.category, null, 1);
      }
    });
  }

  ngOnDestroy() {
    this.clipartSubscription.unsubscribe();
  }

  greekIcon(): String {
    return environment.assetUrl + 'assets/icons/greek.png';
  }

  open() {
    this.dialogRef = this.dialogService.open(this.browseDialog, {name: 'clipart-browser', size: 'lg' });
  }

  new(clipart: Clipart) {
    this.dialogService.close(this.dialogRef);
    const alert = this.alertsService.broadcast(new Alert({content: 'Loading clipart...'}));
    this.clipartService.getClipart(clipart)
      .subscribe(
        (c) => {
          this.selectedClipart.emit(c);
          this.alertsService.close(alert);
        },
        error => this.searchError = <any>error,
      );
  }


  getCliparts(category: Category, event: Event, pageNumber = 1) {
    if (category.parentId == '131' || category.id == '131') {
      this.greek = true;
    } else {
      this.greek = false;
    }

    console.log(this.greek);

    this.searchString = '';
    this.page = pageNumber;
    if (category.parentId) {
      this.subcategory = category;
    } else {
      this.category = category;
      this.subcategory = null;
    }
    this.loading = true;
    this.clipartService.getCliparts(category, pageNumber).subscribe(
      cliparts => {
        this.cliparts = cliparts;
        this.loading = false;
      },
      error => this.searchError = <any>error,
    );
  }

  search(pageNumber = 1, event: Event) {
    this.category = null;
    this.page = pageNumber;
    this.loading = true;
    this.clipartService.search(this.searchString, pageNumber).subscribe(
      cliparts => {
        this.cliparts = cliparts;
        this.loading = false;
      },
      error => this.searchError = <any>error,
    );
    event.preventDefault();
    event.stopPropagation();
  }

  clearCategory() {
    this.category = null;
    this.cliparts = [];
  }

  protected categoryIsSelected(category: Category) {
    if (!this.category) {
      return false;
    }

    let selected = false;
    // NOTE: We have to check name because some cliparts have the same IDs.. I assume because BC has two "Models" Category and SubCategory
    if ((this.category.title === category.title && this.category.id === category.id) || this.category.parentId === category.id) {
      selected = true;
    };

    return selected;
  }
}
