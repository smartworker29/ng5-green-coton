import { Injectable } from '@angular/core';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';

@Injectable()
export class DialogService {
  private openDialogs = {};

  constructor(private modalService: NgbModal) { }

  public open(content: any, options: any= {}): DialogRef {
    // if it's already open, don't open it again
    if (options.name && this.openDialogs[options.name] !== undefined) {
      return this.openDialogs[options.name];
    }
    const self = this;
    const ref = this.modalService.open(content, {
      backdrop: false,
      container: this.container(options),
      size: options.size || 'sm',
      windowClass: this.classes(options),
      beforeDismiss: function() {
        this.groups.forEach((group) => {
          document.querySelector('body').classList.remove('dialog-group-' + group);
        });
        self.removeDialog(options);
        return true;
      },
    }) as DialogRef;

    ref.name = options.name;
    ref.groups = options.groups || [];

    // mark body class with list of open dialog's groups
    ref.groups.forEach((group) => {
      document.querySelector('body').classList.add('dialog-group-' + group);
    });

    // if opening an 'edit-element' dialog...
    if (this.dialogHasGroup(ref, 'edit-element')) {
      // close any other edit-element dialogs
      this.closeGroup('edit-element');
    }
    this.openDialogs[options.name] = ref;

    return ref;
  }

  public closeGroup(groupName: string) {
    Object.keys(this.openDialogs).forEach((name) => {
      const dialog = this.openDialogs[name];
      if (this.dialogHasGroup(dialog, groupName)) {
        this.close(dialog);
      }
    });
  }

  public closeAll() {
    Object.keys(this.openDialogs).forEach((name) => {
      if (name !== 'layers') {
        const dialog = this.openDialogs[name];
        this.close(dialog);
      }
    });
  }

  public close(dialogRef: DialogRef) {
    delete(this.openDialogs[dialogRef.name]);
    // remove list of dialog's groups from body class
    dialogRef.groups.forEach((group) => {
      document.querySelector('body').classList.remove('dialog-group-' + group);
    });
    dialogRef.close();
  }

  public hide(dialogRef: DialogRef) {
    this.elementRef(dialogRef).classList.remove('show-anyway');
  }

  public show(dialogRef: DialogRef) {
    this.elementRef(dialogRef).classList.add('show-anyway');
  }

  private elementRef(dialogRef: DialogRef): Element {
    return document.querySelector('.dialog-' + dialogRef.name);
  }

  private removeDialog(options) {
    delete(this.openDialogs[options['name']]);
  }

  private container(options: any = {}) {
    if (options.block) {
      return '#dialog-block-' + options.block;
    }
    return 'body';
  }

  private classes(options: any = {}) {
    const classNames = [];

    if (options.block) {
      classNames.push('block-' + options.block);
    }

    if (options.permanent) {
      classNames.push('permanent');
    }

    if (options.name) {
      classNames.push('dialog-' + options.name);
    }

    if (options.classes) {
      classNames.push(options.classes);
    }

    return classNames.join(' ');
  }

  dialogHasGroup(dialog: DialogRef, groupName: string): boolean {
    return !!dialog.groups.find((name) => name === groupName);
  }
}

export class DialogRef extends NgbModalRef {
  public name = '';
  public groups = Array<string>();
}
