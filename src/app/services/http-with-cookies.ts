import { Injectable } from '@angular/core';
import { Http, ConnectionBackend, RequestOptions, XHRBackend } from '@angular/http';

@Injectable()
export class HttpWithCookies extends Http {
  constructor(backend: ConnectionBackend, defaultOptions: RequestOptions) {
    defaultOptions.withCredentials = true;
    super(backend, defaultOptions);
  }
}
export function httpFactory(backend: XHRBackend, defaultOptions: RequestOptions) {
  return new HttpWithCookies(backend, defaultOptions);
}
