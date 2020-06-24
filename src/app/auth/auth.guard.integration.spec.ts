import { Location } from '@angular/common';
import { Component, Injectable, NgModule, NgZone } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, RouterModule, Routes } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';

import { AuthGuard } from './auth.guard';
import { AuthService } from './auth.service';

function parseUrl(url: string) {
  const urlPattern = /^(?<path>.*?)(\?(?<queryString>.*?))?(#(?<fragment>.*))?$/;
  const { groups: { fragment = '', path, queryString = '' } } =
    url.match(urlPattern);
  const query = new URLSearchParams(queryString);

  return {
    fragment,
    path,
    query,
  };
}


function testRouteGuard({
  routes,
  testUrl,
}: {
  routes: Routes,
  testUrl: string,
}) {
  describe('AuthGuard#canActivateChild (integrated)', () => {
    beforeEach(async () => {
      TestBed.configureTestingModule({
        declarations: [
          TestLoginComponent,
          TestRootComponent,
          TestTargetComponent,
        ],
        imports: [
          RouterTestingModule.withRoutes([
            ...routes,
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
            canNavigate = await router.navigateByUrl(testUrl));
        });

        let canNavigate: boolean;

        it('grants access', () => {
          expect(canNavigate).toBeTrue();
        });

        it('lazy loads a feature module', () => {
          expect(location.path()).toBe(testUrl);
        });
      });
    });

    describe('when the user is logged out', () => {
      describe('and navigates to a guarded feature', () => {
        beforeEach(async () => {
          await ngZone.run(async () =>
            canNavigate = await router.navigateByUrl(testUrl));
        });

        let canNavigate: boolean;

        it('rejects access', () => {
          expect(canNavigate).toBeFalse();
        });

        it('navigates to the login page', () => {
          const { path } = parseUrl(location.path());
          expect(path).toBe('/login');
        });

        it('stores the redirect URL', () => {
          expect(fakeService.redirectUrl).toBe(testUrl);
        });

        it('adds a token to the login URL', () => {
          const expectedToken = 'anchor';
          const { fragment } = parseUrl(location.path());
          expect(fragment).toBe(expectedToken);
        });

        it('adds a session ID to the login URL', () => {
          const { query } = parseUrl(location.path());
          const sessionIdPattern = /^\d+$/;
          expect(query.get('session_id')).toMatch(sessionIdPattern);
        });
      });
    });
  });
}

@Component({
  template: '',
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
  template: '',
})
class TestTargetComponent { }

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

testRouteGuard({
  routes: [{
    path: 'lazy',
    canLoad: [AuthGuard],
    loadChildren: () => TestFeatureModule,
  }],
  testUrl: '/lazy',
});

testRouteGuard({
  routes: [{
    path: 'target',
    canActivate: [AuthGuard],
    component: TestTargetComponent,
  }],
  testUrl: '/target',
});

testRouteGuard({
  routes: [{
    path: '',
    canActivateChild: [AuthGuard],
    children: [
      {
        path: 'target',
        component: TestTargetComponent,
      },
    ],
  }],
  testUrl: '/target',
});
