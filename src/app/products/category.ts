export class Category {
  public id: string;
  public name: string;
  public sort: number;
  public imageUrl: string;
  public parentId: string;
  public parent: Category;
  private _parents: Category[];

  constructor(id?: string, name?: string, parentId?: string) {
    this.id = id;
    this.name = name;
    this.parentId = parentId;
  }

  get parents(): Category[] {
    if (this._parents === undefined) {
      this._parents = this.getParents([]);
    }

    return this._parents;
  }

  private getParents(results: Category[] = []): Category[] {
    if (this.parent) {
      results.push(this.parent);
      return this.parent.getParents(results);
    } else {
      return results;
    }
  }
}
