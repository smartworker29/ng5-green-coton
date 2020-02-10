import { SavageDesignerPage } from './app.po';

describe('savage-designer App', function() {
  let page: SavageDesignerPage;

  beforeEach(() => {
    page = new SavageDesignerPage();
  });

  it('should initialize the svg drawing area', () => {
    page.navigateTo();
    expect(page.getSvgDrawingArea()).toBeDefined();
  });
});
