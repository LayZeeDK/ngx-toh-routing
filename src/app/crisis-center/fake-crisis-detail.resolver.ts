import { Injectable, NgZone } from '@angular/core';
import { ActivatedRouteSnapshot, Resolve, Router, RouterStateSnapshot } from '@angular/router';

import { Crisis } from './crisis';
import { CRISES } from './mock-crises';

@Injectable()
export class FakeCrisisDetailResolver implements Resolve<Crisis> {
  constructor(
    private router: Router,
    private ngZone: NgZone,
  ) { }

  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Crisis | undefined {
    const id = route.paramMap.get('id');

    const maybeCrisis = CRISES.find(crisis => crisis.id === +id);

    if (maybeCrisis === undefined) {
      this.ngZone.run(() => this.router.navigate(['/']));
    }

    return maybeCrisis;
  }
}
