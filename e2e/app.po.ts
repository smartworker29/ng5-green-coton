import { browser, element, by } from 'protractor';

export class SavageDesignerPage {
  navigateTo() {
    return browser.get('/');
  }

  getSvgDrawingArea() {
    return element(by.css('svg.canvas'));
  }

  getParagraphText() {
    return element(by.css('app-root h1')).getText();
  }
}
