import { Component, EventEmitter, Input, OnInit, Output, TemplateRef, ViewChild } from '@angular/core';
import { Category } from './category';
import { Design } from '../designs/design';
import { DesignsService } from '../designs/designs.service';
import { DialogService, DialogRef } from '../ui/dialog.service';
import { Product } from './product';
import { ProductsService } from './products.service';

@Component({
  selector: 'app-products',
  styles: [`
    .categories { cursor: pointer; }
    .products { cursor: pointer; }
    .product-col { flex: 1 0 20%; }
    #garment-search{margin-bottom: 10px; }
    input[type="search"] {
      border-radius: 19px 0 0 19px;
      padding-left: 15px;
    }
    .search-button {
      border: none;
      border-radius: 0 19px 19px 0;
      background: #07bff7;
      color: #fff;
    }
  `],
  template: `
  <ng-template #content let-c="close" let-d="dismiss" class="products-modal">
    <div class="modal-header">
      <h4 class="modal-title">Select a Product</h4>
      <button type="button" class="close" aria-label="Close" (click)="d('Cross click')">
        <span aria-hidden="true">&times;</span>
      </button>
    </div>
    <div class="modal-body">
      <div id='garment-search' class="input-group">
        <input type="search" [(ngModel)]="searchString" (keyup.enter)="search(1, $event)" placeholder="Search garments" class="form-control" />
        <span class="input-group-btn">
          <button class="btn btn-default search-button" type="button" (click)="search(1, $event)">
            <i class="fa fa-search"></i>
          </button>
        </span>
      </div>
      <div *ngIf="loading">
        <app-ui-loading></app-ui-loading>
      </div>
      <p class="alert alert-warning" *ngIf="errorMessage">{{errorMessage}}</p>

      <div *ngIf="selectedCategory && !searchResults">
        <span><a href='#' (click)="onSelectCategory(null, $event)">All</a></span>
        <span><i class="fa fa-chevron-right">&nbsp;</i></span>
        <ng-template ngFor let-parent [ngForOf]="selectedCategory.parents">
          <span><a href='#' (click)="onSelectCategory(parent, $event)">{{parent.name}}</a></span>
          <span><i class="fa fa-chevron-right">&nbsp;</i></span>
        </ng-template>
        <span>{{selectedCategory.name}}</span>
      </div>
      <div *ngIf="searchResults">
        <span><a href='#' (click)="onClearSearch($event)">Clear Search</a></span>
        <span><i class="fa fa-chevron-right">&nbsp;</i></span>
        <span>{{searchString}}</span>
      </div>

      <div class="categories row" *ngIf="categories && !searchResults">
        <div *ngFor="let category of categories" class="col product-col" (click)="onSelectCategory(category, $event)">
          <div class="text-center">
            <img src="{{category.imageUrl}}" alt="{{category.name}}" />
          </div>
          <p class="text-center">{{category.name}}</p>
        </div>
      </div>
      <div class="products row" *ngIf="products">
        <div *ngFor="let product of products" class="col product-col" (click)="onSelectProduct(product, event)">
          <div class="text-center">
            <img src="{{product.imageUrl}}" alt="{{product.name}}" />
          </div>
          <p class="text-center">{{product.name}}</p>
        </div>
      </div>
      <div *ngIf="searchResults" class="col-12">
        <button
          *ngIf="page > 1"
          type="button"
          class="btn btn-primary pull-left"
          (click)="search(page - 1, $event)"
          >Prev</button>
        <button
          *ngIf="products.length == productsService.limit"
          type="button"
          class="btn btn-primary pull-right"
          (click)="search(page + 1, $event)"
          >Next</button>
      </div>
    </div>
  </ng-template>
  `
})
export class ProductsComponent implements OnInit {
  @Input() searchString = '';
  @Output() select = new EventEmitter<Product>();
  @Output() cancel = new EventEmitter();
  private allCategories: Category[];
  private currentDesign: Design;
  private dialogRef: DialogRef;
  private searchError = '';
  public products: Product[];
  public categories: Category[];
  public selectedCategory: Category;
  public breadcrumbs: Array<Category> = [];
  public errorMessage: string;
  public searchResults: boolean;
  protected page = 1;
  loading = false;
  @ViewChild('content') productsPopup: TemplateRef<any>;

  constructor(private designsService: DesignsService, private dialogService: DialogService, private productsService: ProductsService) {}

  ngOnInit() {
    this.designsService.selectedDesign.subscribe((d) => {
      this.currentDesign = d;
    });
    this.loadCategories();
  }

  open() {
    this.dialogRef = this.dialogService.open(this.productsPopup, { name: 'products', size: 'lg' });
  }

  close() {
    this.dialogService.close(this.dialogRef);
  }

  onCancelBrowsingProducts(event: Event) {
    this.cancel.emit();
  }

  onSelectCategory(category: Category, event: Event) {
    this.selectedCategory = category;
    this.getCategories(this.selectedCategory);
    if (this.selectedCategory) {
      this.getProducts(this.selectedCategory);
    } else {
      this.products = [];
    }

    event.preventDefault();
  }

  onSelectProduct(product: Product, event: Event) {
    this.productsService.getProduct(product.id).subscribe((p) => {
      this.select.emit(p);
    });
  }

  onClearSearch(event: Event) {
    this.searchResults = false;
    this.searchString = '';
    this.products = [];
    this.selectedCategory = null;
    this.getCategories(this.selectedCategory);
  }

  search(pageNumber = 1, event: Event) {
    this.page = pageNumber;
    this.loading = true;
    this.productsService.search(this.searchString, pageNumber).subscribe(
      products => {
        this.products = products;
        this.loading = false;
        this.searchResults = true;
      },
      error => this.searchError = <any>error,
    );
    event.preventDefault();
    event.stopPropagation();
  }

  private getCategories(selectedCategory?: Category): void {
    const id = selectedCategory ? selectedCategory.id : null;
    this.categories = this.allCategories.filter((c) => c.parentId === id);
  }

  private getProducts(selectedCategory?: Category) {
    this.loading = true;
    this.productsService.getProducts(selectedCategory).subscribe(
      products => {
        this.products = products ? products : [];
        // hide products with bad image url
        this.products = this.products.filter((p) => p.imageUrl.substr(p.imageUrl.length - 1) !== '/');
        this.loading = false;
      },
      error => this.errorMessage = <any>error);
  }

  private loadCategories() {
    this.loading = true;
    this.productsService.getCategories().subscribe(
      (categories) => {
        // for each category, set its parent
        for (let i = 0; i < categories.length; i++) {
          const c = categories[i];
          for (let j = 0; j < categories.length; j++) {
            const s = categories[j];
            if (s.parentId === c.id) {
              s.parent = c;
            }
          }
        }
        this.allCategories = categories;
        this.getCategories();
        this.loading = false;
      },
      (error) => this.errorMessage = <any>error,
    );
  }
}
