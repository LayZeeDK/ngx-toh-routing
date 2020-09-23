import { Injectable } from '@angular/core';
import { asapScheduler, BehaviorSubject } from 'rxjs';
import { map, observeOn } from 'rxjs/operators';

import { Crisis } from './crisis';
import { CrisisService } from './crisis.service';
import { CRISES } from './mock-crises';

@Injectable()
export class FakeCrisisService implements Partial<CrisisService> {
  private crises$: BehaviorSubject<Crisis[]> = new BehaviorSubject<Crisis[]>(CRISES);

  getCrises() {
    return this.crises$;
  }

  getCrisis(id: number | string) {
    return this.getCrises().pipe(
      map(crises => crises.find(crisis => crisis.id === +id)),
      observeOn(asapScheduler),
    );
  }
}
