import { Location } from '@angular/common';
import { Component, Injectable, NgZone, ViewChild } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ActivatedRouteSnapshot, Router, RouterOutlet, RouterStateSnapshot } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { asapScheduler, BehaviorSubject } from 'rxjs';
import { map, observeOn } from 'rxjs/operators';

import { Crisis } from './crisis';
import { CrisisCenterModule } from './crisis-center.module';
import { CrisisDetailResolverService } from './crisis-detail-resolver.service';
import { CrisisService } from './crisis.service';
import { CRISES } from './mock-crises';

@Injectable()
class FakeCrisisService implements Partial<CrisisService> {
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

@Injectable()
export class FakeCrisisDetailResolverService implements Resolve<Crisis> {
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
    return rootFixture.ngZone.run(() => router.navigate([id]));
  }

  beforeEach(async () => {
    TestBed.configureTestingModule({
      declarations: [
        TestRootComponent,
      ],
      imports: [
        CrisisCenterModule,
        RouterTestingModule.withRoutes([
          { path: 'crisis-center', pathMatch: 'full', redirectTo: '/' },
        ]),
      ],
      providers: [
        { provide: CrisisService, useClass: FakeCrisisService },
        { provide: CrisisDetailResolverService, useClass: FakeCrisisDetailResolverService },
      ],
    });

    await TestBed.compileComponents();

    rootFixture = TestBed.createComponent(TestRootComponent);
    router = TestBed.inject(Router);
    location = TestBed.inject(Location);
  });

  beforeEach(fakeAsync(() => {
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

  it('navigates to the crisis center home when an invalid ID is in the URL', fakeAsync(() => {
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

    expect(location.path().startsWith('/')).toBeTrue();
    expect(location.path()).toBe('/foobar');
  }));
});
