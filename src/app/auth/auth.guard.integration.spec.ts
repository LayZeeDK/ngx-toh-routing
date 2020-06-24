import { Location } from '@angular/common';
import { Component, Injectable, NgModule, NgZone } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, RouterModule } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';

import { AuthGuard } from './auth.guard';
import { AuthService } from './auth.service';

@Component({
  template: 'TestLazyComponent',
})
class TestLazyComponent { }

@NgModule({
  declarations: [
    TestLazyComponent,
  ],
  imports: [
    RouterModule.forChild([
      {
        path: '',
        component: TestLazyComponent,
      },
    ]),
  ],
})
class TestFeatureModule { }

@Component({
  template: '<router-outlet></router-outlet>',
})
class TestRootComponent { }

@Component({
  template: 'TestLoginComponent',
})
class TestLoginComponent { }

@Injectable()
class FakeAuthService implements Partial<AuthService> {
  isLoggedIn = false;
  redirectUrl;

  login() {
    this.isLoggedIn = true;

    return of(true);
  }

  logout() {
    this.isLoggedIn = false;
  }
}

describe('AuthGuard (integrated)', () => {
  beforeEach(async () => {
    TestBed.configureTestingModule({
      declarations: [
        TestRootComponent,
        TestLoginComponent,
      ],
      imports: [
        RouterTestingModule.withRoutes([
          {
            path: 'lazy',
            canLoad: [AuthGuard],
            loadChildren: () => TestFeatureModule,
          },
          {
            path: 'login',
            component: TestLoginComponent,
          },
        ]),
      ],
      providers: [
        { provide: AuthService, useClass: FakeAuthService },
      ],
    });

    await TestBed.compileComponents();

    rootFixture = TestBed.createComponent(TestRootComponent);

    location = TestBed.inject(Location);
    router = TestBed.inject(Router);
    fakeService = TestBed.inject(AuthService);
    ngZone = TestBed.inject(NgZone);
  });

  let fakeService: FakeAuthService;
  let location: Location;
  let ngZone: NgZone;
  let rootFixture: ComponentFixture<TestRootComponent>;
  let router: Router;

  describe('when the user is logged in', () => {
    beforeEach(async () => {
      await fakeService.login().toPromise();
    });

    describe('and navigates to a guarded feature', () => {
      beforeEach(async () => {
        await ngZone.run(async () =>
          canNavigate = await router.navigateByUrl('/lazy'));
      });

      let canNavigate: boolean;

      it('grants access', () => {
        expect(canNavigate).toBeTrue();
      });

      it('lazy loads a feature module', () => {
        expect(location.path()).toBe('/lazy');
      });
    });
  });

  describe('when the user is logged out', () => {
    describe('and navigates to a guarded feature', () => {
      beforeEach(async () => {
        await ngZone.run(async () =>
          canNavigate = await router.navigateByUrl('/lazy'));
      });

      let canNavigate: boolean;

      it('rejects access', () => {
        expect(canNavigate).toBeFalse();
      });

      it('navigates to the login page', () => {
        const url = location.path();
        const [path] = url.split('?');
        expect(path).toBe('/login');
      });
    });
  });
});
