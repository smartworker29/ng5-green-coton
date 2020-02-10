// This file is required by karma.conf.js and loads recursively all the .spec and framework files

import 'zone.js/dist/long-stack-trace-zone';
import 'zone.js/dist/proxy.js';
import 'zone.js/dist/sync-test';
import 'zone.js/dist/jasmine-patch';
import 'zone.js/dist/async-test';
import 'zone.js/dist/fake-async-test';
import { getTestBed } from '@angular/core/testing';
import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting
} from '@angular/platform-browser-dynamic/testing';

// Unfortunately there's no typing for the `__karma__` variable. Just declare it as any.
declare var __karma__: any;
declare var require: any;

// Prevent Karma from running prematurely.
__karma__.loaded = function () {};

// First, initialize the Angular testing environment.
getTestBed().initTestEnvironment(
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting()
);
// Then we find all the tests.
const context = require.context('./', true, /\.spec\.ts$/);
// And load the modules.

// NOTE:
//   If you want to only run *some* tests, you can define which ones in this array...
//   (Due to the way the app is programmed, you must always run this app.component.spec.ts first...)
const files = [
  './app/app.component.spec.ts',
  //'./app/elements/clipart/clipart-element.spec.ts',
  //'./app/elements/image-upload/image-upload-element.spec.ts',
  //'./app/elements/image-upload/image-upload-element.spec.ts',
  //'./app/elements/names-and-numbers/names-and-numbers-element.spec.ts',
  //'./app/elements/shape/shape-element.star.spec.ts',
  //'./app/elements/text/text-element.spec.ts',
];

//   And then tell karma to only run those...
// context.keys().filter((k) => !!files.find(f => f === k)).map(context);

//   Or... you can just run them all.
context.keys().map(context);

// Finally, start Karma to run the tests.
__karma__.start();
