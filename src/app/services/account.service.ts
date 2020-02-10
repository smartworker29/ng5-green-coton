import { AccountEvent } from './account-event';
import { Headers, Http, Response } from '@angular/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { environment } from 'environments/environment';
import { ReplaySubject } from 'rxjs/ReplaySubject';

@Injectable()
export class AccountService {
  private apiUrl = environment.apiBaseUrl + '/api/v1/account';
  public account = {};
  private headers = new Headers({ 'Content-Type': 'application/json'});
  events = new ReplaySubject<AccountEvent>();


  constructor(private http: Http) {}

  getAccount(): Observable<object> {
    return this.http.get(this.apiUrl)
              .map(res => {
                this.account = res.json();
                return res.json();
              })
  }

  login(email: string, password: string): Observable<object> {
    console.log('LOGIN GO');
    const url = this.apiUrl + '/login';
    return this.http.post(url, this.prepareContent({email: email, password: password}), {headers: this.headers})
             .map(res => {
               const response = res.json();
               if (response.status === 200) {
                this.events.next(new AccountEvent('ACCOUNT_LOGIN', res.json()));
               }
               return response;
             })
  }

  resetPassword(email: string): Observable<object> {
    const url = this.apiUrl + '/reset';
    return this.http.post(url, this.prepareContent({email: email}), {headers: this.headers})
            .map(res => {
              return res.json();
            })
  }

  subscribeToPromotionalEmails(): Observable<object> {
    const url = this.apiUrl + '/promotions';
    return this.http.post(url, this.prepareContent({subscribe: 1}), {headers: this.headers})
      .map(res => {
        return res.json();
      })
  }

  create(account: object): Observable<object> {
    const url = this.apiUrl + '/create';
    return this.http.post(url, this.prepareContent(account), {headers: this.headers})
             .map(res => {
               const response = res.json();
               if (response.status === 200) {
                console.log('LOGIN RESPONSE');
                this.events.next(new AccountEvent('ACCOUNT_LOGIN', res.json()));
               }
               return response;
             })
  }

  private prepareContent(content: any) {
    return JSON.stringify(content);
  }
}
