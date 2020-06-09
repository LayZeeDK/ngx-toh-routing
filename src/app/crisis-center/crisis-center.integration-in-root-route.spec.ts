import { Location } from '@angular/common';
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
  Router,
  RouterOutlet,
  RouterStateSnapshot,
} from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';

import { Crisis } from './crisis';
import { CrisisCenterModule } from './crisis-center.module';
import { CrisisDetailResolverService } from './crisis-detail-resolver.service';
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
      ],
      providers: [
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

  it('navigates to the crisis center home when an invalid ID is in the URL', fakeAsync(() => {
    navigateById(0);
    advance();

    const message =
      rootFixture.debugElement.query(By.css('p'));
    expect(message.nativeElement.textContent)
      .toContain('Welcome to the Crisis Center');
  }));
});
