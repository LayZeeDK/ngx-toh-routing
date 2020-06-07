import { Location } from '@angular/common';
import { SpyLocation } from '@angular/common/testing';
import { Component, Injectable, ViewChild } from '@angular/core';
import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
} from '@angular/core/testing';
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
import { CrisisCenterModule } from './crisis-center.module';
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
    const id = Number.parseInt(route.paramMap.get('id'), 10);

    const maybeCrisis = CRISES.find(crisis => crisis.id === id);

    if (maybeCrisis === undefined) {
      this.router.navigate(['/']);
    }

    return maybeCrisis;
  }
}

describe('Crisis center', () => {
  function advance() {
    tick();
    rootFixture.detectChanges();
  }

  function navigateById(id: number) {
    return rootFixture.ngZone.run(() => router.navigate([id]));
  }

  beforeEach(async () => {
    TestBed.configureTestingModule({
      declarations: [
        TestRootComponent,
      ],
      imports: [
        CrisisCenterModule,
        RouterTestingModule,
        // RouterTestingModule.withRoutes([
        //   {
        //     path: 'crisis-center',
        //     loadChildren: () => CrisisCenterRoutingModule,
        //   },
        //   {
        //     path: '',
        //     pathMatch: 'full',
        //     redirectTo: 'crisis-center',
        //   }
        // ]),
      ],
    });

    await TestBed.compileComponents();

    rootFixture = TestBed.createComponent(TestRootComponent);
    router = TestBed.inject(Router);
    navigateSpy = router.navigate = jasmine.createSpy('Router#navigate', router.navigate)
      .and.callThrough();
    location = TestBed.inject(Location) as SpyLocation;
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

  let location: SpyLocation;
  let navigateSpy: jasmine.Spy;
  let rootFixture: ComponentFixture<TestRootComponent>;
  let router: Router;

  it('shows crisis detail when a valid ID is in the URL', fakeAsync(() => {
    const [firstCrisis] = CRISES;

    navigateById(firstCrisis.id);
    advance();

    const crisisTitle =
      rootFixture.debugElement.query(By.css('h3'));
    expect(crisisTitle.nativeElement.textContent).toContain(firstCrisis.name);
  }));

  it('navigates to the crisis center home when an invalid ID is in the URL', fakeAsync(() => {
    navigateById(0);
    advance();

    const message =
      rootFixture.debugElement.query(By.css('p'));
    expect(message.nativeElement.textContent)
      .toContain('Welcome to the Crisis Center');
  }));

  it('navigates to the crisis center home when canceling crisis detail edit', fakeAsync(() => {
    const [firstCrisis] = CRISES;
    navigateById(firstCrisis.id);
    advance();
    const cancelButton = rootFixture.debugElement.queryAll(By.css('button'))
      .find(button => button.nativeElement.textContent.trim() === 'Cancel');

    cancelButton.triggerEventHandler('click', { button: 0 });
    advance();

    expect(location.path()).toBe('/');
  }));
});
