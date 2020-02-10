import { Component, EventEmitter, ElementRef, Input, OnInit, OnDestroy, Output, ViewChild } from '@angular/core';
import { AlertsService, Alert } from '../ui/alerts.service';
import { AccountService } from '../services/account.service';
import { GlobalService } from '../services/global.service';
import { Subscription } from 'rxjs/Subscription';
import { resolve4 } from 'dns';

@Component({
  selector: 'app-account',
  styleUrls: ['./account.component.scss'],
  templateUrl: './account.component.html',
})

export class AccountComponent implements OnInit, OnDestroy {
  @Output() accountEvent = new EventEmitter<any>();

  public loginEmail: string;
  public loginPassword: string;
  public registerEmail: string;
  public registerPassword: string;
  public registerPasswordConfirm: string;
  public registerFirstName: string;
  public resetEmail: string;
  public hideResetForm = true;
  public buttonsDisabled = true;
  public errors: Array<string>;

  constructor(
    private accountService: AccountService,
    private alertsService: AlertsService,
    private globalService: GlobalService,
  ) {}

  ngOnInit() {
    this.errors = [];
    this.enableButtons();
  }

  ngOnDestroy() {
  }

  onShowResetForm() {
    this.hideResetForm = !this.hideResetForm;
  }

  onForgotPassword() {
    if (!this.resetEmail) {
      this.addError('Enter an email to reset your password.');
      return;
    }

    this.disableButtons();
    this.accountService.resetPassword(this.resetEmail).subscribe((res: any) => {
      if (res.status === 200) {
        const message = 'An email with instructions to reset your password has been sent to ' + this.resetEmail;
        this.alertsService.broadcast(new Alert({content: message, dismissIn: 8}));
        this.accountEvent.emit('close');
      } else {
        this.addError('The password for that email could not be reset.');
      }
      this.enableButtons();
    });
  }

  onLogin() {
    if (!this.loginEmail || !this.loginPassword) {
      this.addError('Please enter a value for all login fields.');
      return;
    }

    this.disableButtons();
    this.accountService.login(this.loginEmail, this.loginPassword).subscribe((res: any) => {
      if (res.status === 200) {
        this.updateCookies();
        const message = 'Successfully logged in.';
        this.alertsService.broadcast(new Alert({content: message, dismissIn: 8}));
      } else {
        this.addError('The username or password specified is incorrect.');
      }
      this.enableButtons();
    });
  }

  onRegister() {
    if (this.registerPassword !== this.registerPasswordConfirm) {
      this.addError('Passwords do not match.');
      return;
    }

    if (this.registerEmail && this.registerPassword && this.registerPasswordConfirm && this.registerFirstName) {
      this.disableButtons();
      const account = {
        email: this.registerEmail,
        password: this.registerPassword,
        passwordConfirmation: this.registerPasswordConfirm,
        firstName: this.registerFirstName
      };

      this.accountService.create(account).subscribe((res: any) => {
        if (res.status === 200) {
          this.updateCookies();
          const message = 'Account successfully created.';
          this.alertsService.broadcast(new Alert({content: message, dismissIn: 8}));
        } else {
          switch (res.reason) {
            case 'duplicate':
              this.addError('An account with that email already exists');
              break;
            default:
              this.addError(res.reason);
          }
        }
        this.enableButtons();
      });
    } else {
      this.addError('Please enter a value for all registration fields.');
    }
  }

  private disableButtons() {
    this.buttonsDisabled = true;
  }

  private enableButtons() {
    this.buttonsDisabled = false;
  }

  private updateCookies() {
    this.accountService.getAccount().subscribe((account) => {
    });
  }

  private clearErrors() {
    this.errors = [];
  }

  private addError(error: string, clear = false) {
    this.clearErrors();
    this.errors.push(error);
  }
}
