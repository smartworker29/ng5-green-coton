import { InMemoryDbService } from 'angular-in-memory-web-api';

export class DemoData implements InMemoryDbService {
  createDb() {
    const productImage = 'https://placeholdit.co/i/600x800?text=ProductImage';
    const productPreviewImage = 'https://placeholdit.co/i/270x360?text=ProductImage';
    const productColors = ['#FFFFFF', '#DDDDDD', '#000000', '#FF0000'];
    const sizes = ['S', 'M', 'L', 'XL', 'XXL', 'XXL', 'YS', 'YM', 'YL'];

    const products = [
      {
        id: '1',
        name: '2001 American Apparel Fine Jersey Tee',
        categoryId: '11',
        colors: productColors,
        sizes: sizes,
        sides: [
          {
            name: 'Front',
            imageUrl: 'https://www.bluecotton.com/images/garment/2001copy.jpg',
            previewImageUrl: 'https://www.bluecotton.com/images/garment/designImage/2001copy.jpg',
            maskImageUrl: 'https://www.bluecotton.com/images/garment/2001-MASK1.gif',
            maskPreviewUrl: 'https://www.bluecotton.com/images/garment/mask/2001-MASK1.gif',
            pixelsPerInch: 23,
            areas: [ {x: 0, y: 145, h: 664 - 145, w: 23 * 13}, ]
          },
          {
            name: 'Back',
            imageUrl: 'https://www.bluecotton.com/images/garment/2001b.jpg',
            previewImageUrl: 'https://www.bluecotton.com/images/garment/designImage/2001b.jpg',
            maskImageUrl: 'https://www.bluecotton.com/images/garment/2001b.gif',
            maskPreviewUrl: 'https://www.bluecotton.com/images/garment/mask/2001b.gif',
            pixelsPerInch: 23,
            areas: [ {x: 0, y: 98, h: 659 - 98, w: 23 * 13}, ]
          },
        ],
      },
      {
        id: '2',
        name: 'Fancy Short Sleeve',
        categoryId: '11',
        colors: productColors,
        sizes: sizes,
        sides: [
          {
            name: 'Front',
            imageUrl: productImage,
            previewImageUrl: productPreviewImage,
            areas: [ {x: 0, y: 0, h: 100, w: 100}, ]
          },
        ],
      },
      {
        id: '3',
        name: 'Basic Long Sleeve',
        categoryId: '12',
        colors: productColors,
        sizes: sizes,
        sides: [
          {
            name: 'Front',
            imageUrl: productImage,
            previewImageUrl: productPreviewImage,
            areas: [ {x: 0, y: 0, h: 100, w: 100}, ]
          },
        ],
      },
      {
        id: '4',
        name: 'Fancy Long Sleeve',
        categoryId: '12',
        colors: productColors,
        sizes: sizes,
        sides: [
          {
            name: 'Front',
            imageUrl: productImage,
            previewImageUrl: productPreviewImage,
            areas: [ {x: 0, y: 0, h: 100, w: 100}, ]
          },
        ],
      },
      {
        id: '5',
        name: 'Hoodie',
        categoryId: '21',
        colors: productColors,
        sizes: sizes,
        sides: [
          {
            name: 'Front',
            imageUrl: productImage,
            previewImageUrl: productPreviewImage,
            areas: [ {x: 0, y: 0, h: 100, w: 100}, ]
          },
        ],
      },
      {
        id: '6',
        name: 'Hoodie',
        categoryId: '22',
        colors: productColors,
        sizes: sizes,
        sides: [
          {
            name: 'Front',
            imageUrl: productImage,
            previewImageUrl: productPreviewImage,
            areas: [ {x: 0, y: 0, h: 100, w: 100}, ]
          },
        ],
      },
    ];

    const categoryImage = 'https://placeholdit.co/i/200x200?text=CategoryImage';
    const categories = [
      { id: '1', name: 'Tees', parentId: null, imageUrl: categoryImage },
      { id: '11', name: 'Short Sleeved', parentId: '1', imageUrl: categoryImage },
      { id: '12', name: 'Long Sleeved', parentId: '1', imageUrl: categoryImage },
      { id: '2', name: 'Sweatshirts', parentId: null, imageUrl: categoryImage },
      { id: '21', name: 'Hoodies', parentId: '2', imageUrl: categoryImage },
      { id: '22', name: 'Zippered', parentId: '2', imageUrl: categoryImage },
    ];

    const colors: any = [
      {'rgb': '000000', 'name': 'Black', 'id': 21},
      {'rgb': 'FFFFFF', 'name': 'White', 'id': 20},
      {'rgb': '6a6863', 'name': 'Gray', 'id': 22},
      {'rgb': '43403d', 'name': 'Charcoal Gray', 'id': 23},
      {'rgb': '818e16', 'name': 'Olive Green', 'id': 44},
      {'rgb': '193b1f', 'name': 'Forest Green', 'id': 24},
      {'rgb': '005a2f', 'name': 'Kelly Green', 'id': 10},
      {'rgb': '007936', 'name': 'Dallas Green', 'id': 7},
      {'rgb': '57be32', 'name': 'Medium Green', 'id': 25},
      {'rgb': '3dea00', 'name': 'Lime Green', 'id': 26},
      {'rgb': '051631', 'name': 'Navy Blue', 'id': 11},
      {'rgb': '1e3980', 'name': 'Royal Blue', 'id': 6},
      {'rgb': '56a0d2', 'name': 'Contact Blue', 'id': 18},
      {'rgb': '6cd4e2', 'name': 'Aqua', 'id': 33},
      {'rgb': 'a7d6ac', 'name': 'Mint Green', 'id': 46},
      {'rgb': '431a64', 'name': 'Purple', 'id': 14},
      {'rgb': '874fa0', 'name': 'Violet', 'id': 37},
      {'rgb': 'b89bc9', 'name': 'Lavender', 'id': 38},
      {'rgb': '36838e', 'name': 'Teal', 'id': 34},
      {'rgb': '9ed5f2', 'name': 'Light Blue', 'id': 31},
      {'rgb': 'e64097', 'name': 'Hot Pink', 'id': 32},
      {'rgb': 'ff82b9', 'name': 'Shortys Pink', 'id': 17},
      {'rgb': 'fbcece', 'name': 'Light Pink', 'id': 12},
      {'rgb': 'FFCC99', 'name': 'Light Fleshtone', 'id': 35},
      {'rgb': 'bf9a06', 'name': 'Old Gold', 'id': 30},
      {'rgb': 'f5b124', 'name': 'Yellow Gold', 'id': 28},
      {'rgb': 'ffff00', 'name': 'Yellow', 'id': 27},
      {'rgb': 'ffff7d', 'name': 'Pale Yellow', 'id': 29},
      {'rgb': 'ffffcc', 'name': 'Creme', 'id': 42},
      {'rgb': 'ff8947', 'name': 'Melon', 'id': 47},
      {'rgb': 'fd5826', 'name': 'Orange', 'id': 15},
      {'rgb': 'ed1c24', 'name': 'Red', 'id': 8},
      {'rgb': '961e32', 'name': 'Cardinal', 'id': 19},
      {'rgb': '522237', 'name': 'Burgundy', 'id': 39},
      {'rgb': 'c95900', 'name': 'Burnt Orange', 'id': 40},
      {'rgb': '7c4c37', 'name': 'Spice Brown', 'id': 16},
      {'rgb': '3a2618', 'name': 'Dark Brown', 'id': 45},
      {'rgb': 'C8B481', 'name': 'Palooza Tan', 'id': 36},
      {'rgb': '000000', 'name': 'Promo Black Test', 'id': 49},
      {'rgb': 'c00213', 'name': 'Promo Red Test', 'id': 50},
    ];


    return {categories, products, colors};
  }
}
