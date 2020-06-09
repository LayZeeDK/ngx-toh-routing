import { CommonModule, Location } from '@angular/common';
import { Component, Injectable, NgZone, ViewChild } from '@angular/core';
import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
} from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
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
import {
  CrisisCenterHomeComponent,
} from './crisis-center-home/crisis-center-home.component';
import { CrisisCenterRoutingModule } from './crisis-center-routing.module';
import { CrisisCenterComponent } from './crisis-center/crisis-center.component';
import { CrisisDetailComponent } from './crisis-detail/crisis-detail.component';
import { CrisisListComponent } from './crisis-list/crisis-list.component';
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
  constructor(
    private router: Router,
    private ngZone: NgZone,
  ) { }

  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Crisis | undefined {
    const id = Number.parseInt(route.paramMap.get('id'), 10);

    const maybeCrisis = CRISES.find(crisis => crisis.id === id);

    if (maybeCrisis === undefined) {
      this.ngZone.run(() => this.router.navigate(['/crisis-center']));
    }

    return maybeCrisis;
  }
}

describe('Crisis center', () => {
  function advance() {
    tick();
    rootFixture.detectChanges();
  }

  function clickButton(label: string) {
    const button = rootFixture.debugElement.queryAll(By.css('button'))
      .find(b => b.nativeElement.textContent.trim() === label);

    rootFixture.ngZone.run(
      () => button.triggerEventHandler('click', { button: 0 }));
  }

  function getText(query: string) {
    return rootFixture.debugElement.query(By.css(query))
      .nativeElement.textContent;
  }

  function navigateById(id: number) {
    return rootFixture.ngZone.run(() => router.navigate(['crisis-center', id]));
  }

  beforeEach(async () => {
    TestBed.configureTestingModule({
      declarations: [
        TestRootComponent,
        CrisisCenterComponent,
        CrisisListComponent,
        CrisisCenterHomeComponent,
        CrisisDetailComponent,
      ],
      imports: [
        CommonModule,
        FormsModule,
        CrisisCenterRoutingModule,
        RouterTestingModule.withRoutes(
          [
            {
              path: 'crisis-center',
              loadChildren: () => CrisisCenterRoutingModule,
            },
            {
              path: '',
              pathMatch: 'full',
              redirectTo: 'crisis-center',
            }
          ],
          {
            relativeLinkResolution: 'corrected',
          }),
      ],
    });

    await TestBed.compileComponents();

    rootFixture = TestBed.createComponent(TestRootComponent);
    router = TestBed.inject(Router);
    location = TestBed.inject(Location);
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

  let location: Location;
  let rootFixture: ComponentFixture<TestRootComponent>;
  let router: Router;

  it('shows crisis detail when a valid ID is in the URL', fakeAsync(() => {
    const [firstCrisis] = CRISES;

    navigateById(firstCrisis.id);
    advance();

    expect(getText('h3')).toContain(firstCrisis.name);
  }));

  xit('navigates to the crisis center home when an invalid ID is in the URL', fakeAsync(() => {
    navigateById(0);
    advance();

    expect(getText('p')).toContain('Welcome to the Crisis Center');
  }));

  it('navigates to the crisis center home when canceling crisis detail edit', fakeAsync(() => {
    const [firstCrisis] = CRISES;
    navigateById(firstCrisis.id);
    advance();

    clickButton('Cancel');
    advance();

    expect(location.path().startsWith('/crisis-center')).toBeTrue();
  }));
});