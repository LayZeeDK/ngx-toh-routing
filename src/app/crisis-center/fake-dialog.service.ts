import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { take, finalize, tap } from 'rxjs/operators';

import { DialogService } from '../dialog.service';

@Injectable()
export class FakeDialogService implements DialogService {
  private userConfirms = new Subject<boolean>();

  clickCancel(): void {
    this.userConfirms.next(false);
  }

  clickOk(): void {
    this.userConfirms.next(true);
  }

  confirm(message?: string): Observable<boolean> {
    return this.userConfirms.pipe(
      take(1),
      tap({
        next: n => console.log('confirm', n),
        error: e => console.log('confirm error', e),
      }),
    );
  }
}
