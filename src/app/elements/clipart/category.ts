export class Category {
  id: string;
  title: string;
  parentId: string;
  sort = 0;
  subcategories: Category[] = [];
}
