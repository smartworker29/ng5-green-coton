import { Injectable } from '@angular/core';
import { Design } from '../designs/design';

@Injectable()
export class GlobalService {
  public designId: String;
  public cartItemId: String;
  public exportMode: String;
  public spoofSession: String;
  public orderId: String;
  public itemId: String;
  public sharedDesignId: String;
  public currentDesign: Design;
  public productId: String;
  public preview: boolean;
}
