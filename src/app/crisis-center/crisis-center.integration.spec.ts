import { Component, Injectable, ViewChild } from '@angular/core';
import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
} from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  Resolve,
  Route,
  Router,
  RouterOutlet,
  RouterStateSnapshot,
} from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { findValueDeep } from 'deepdash-es/standalone';

import { Crisis } from './crisis';
import { CrisisCenterModule } from './crisis-center.module';
import { CrisisCenterComponent } from './crisis-center/crisis-center.component';
import { CrisisDetailComponent } from './crisis-detail/crisis-detail.component';
import { CRISES } from './mock-crises';

@Component({
  template: '<router-outlet></router-outlet>',
})
class TestRootComponent {
  @ViewChild(RouterOutlet)
  routerOutlet: RouterOutlet;

  getActiveComponent<T>(): T {
    return this.routerOutlet.component as T;
  }
}

@Injectable({
  providedIn: 'root',
})
export class FakeCrisisDetailResolverService implements Resolve<Crisis> {
  constructor(private router: Router) { }

  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Crisis | undefined {
    const id = route.paramMap.get('id');

    const maybeCrisis = CRISES.find(crisis =>
      crisis.id === Number.parseInt(id, 10));

    if (maybeCrisis === undefined) {
      this.router.navigate(['/crisis-center']);
    }

    return maybeCrisis;
  }
}

describe('Crisis center', () => {
  function advance() {
    tick();
    rootFixture.detectChanges();
  }

  beforeEach(async () => {
    TestBed.configureTestingModule({
      declarations: [
        TestRootComponent,
      ],
      imports: [
        CrisisCenterModule,
        RouterTestingModule,
      ],
    });

    await TestBed.compileComponents();

    rootFixture = TestBed.createComponent(TestRootComponent);
    router = TestBed.inject(Router);
  });

  beforeEach(fakeAsync(() => {
    const routes = router.config;
    const detailRoute: Route = findValueDeep(
      routes,
      (route: Route) => route.component === CrisisDetailComponent,
      {
        // checkCircular: false,
        // leavesOnly: childrenPath!==undefined,
        // pathFormat: 'string',
        // includeRoot: !_.isArray(obj),
        childrenPath: ['children'],
        // rootIsChildren: !includeRoot && _.isArray(obj),
      });
    detailRoute.resolve.crisis = FakeCrisisDetailResolverService;
    router.resetConfig(routes);

    rootFixture.ngZone.run(() => router.initialNavigation());

    advance();
  }));

  let rootFixture: ComponentFixture<TestRootComponent>;
  let router: Router;

  it('does something', fakeAsync(() => {
    const [firstCrisis] = CRISES;

    router.navigate([firstCrisis.id]);
    advance();

    expect(rootFixture.componentInstance.getActiveComponent()).toBeInstanceOf(CrisisCenterComponent);
  }));
});
