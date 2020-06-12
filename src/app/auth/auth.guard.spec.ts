import {
  ActivatedRouteSnapshot,
  Params,
  Route,
  Router,
  RouterStateSnapshot,
  UrlSegment,
} from '@angular/router';

import { AuthGuard } from './auth.guard';
import { AuthService } from './auth.service';

describe('AuthGuard (isolated)', () => {
  function fakeRouterState(url: string): RouterStateSnapshot {
    return {
      url,
    } as RouterStateSnapshot;
  }

  beforeEach(() => {
    routerSpy = jasmine.createSpyObj<Router>('Router', ['navigate']);
    serviceStub = {};
    guard = new AuthGuard(serviceStub as AuthService, routerSpy);
  });

  const dummyRoute = {} as ActivatedRouteSnapshot;
  const fakeUrls = [
    '/',
    '/admin',
    '/crisis-center',
    '/a/deep/route',
  ];
  let guard: AuthGuard;
  let routerSpy: jasmine.SpyObj<Router>;
  let serviceStub: Partial<AuthService>;

  describe('when the user is logged in', () => {
    beforeEach(() => {
      serviceStub.isLoggedIn = true;
    });

    fakeUrls.forEach(fakeUrl => {
      it('grants access', () => {
        const isAccessGranted = guard.checkLogin(fakeUrl);

        expect(isAccessGranted).toBeTrue();
      });

      describe('when routing', () => {
        it('can activate a route', () => {
          const canActivate =
            guard.canActivate(dummyRoute, fakeRouterState(fakeUrl));

          expect(canActivate).toBeTrue();
        });

        it('can activate a child route', () => {
          const canActivateChild =
            guard.canActivateChild(dummyRoute, fakeRouterState(fakeUrl));

          expect(canActivateChild).toBeTrue();
        });

        const paths = fakeUrl.split('/').filter(path => path !== '');

        paths.forEach(path => {
          it('can lazy load a feature module', () => {
            const fakeRoute: Route = { path };
            const fakeUrlSegment = { path } as UrlSegment;

            const canLoad = guard.canLoad(fakeRoute, [fakeUrlSegment]);

            expect(canLoad).toBeTrue();
          });
        });
      });
    });
  });

  describe('when the user is logged out', () => {
    beforeEach(() => {
      serviceStub.isLoggedIn = false;
    });

    fakeUrls.forEach(fakeUrl => {
      it('rejects access', () => {
        const isAccessGranted = guard.checkLogin(fakeUrl);

        expect(isAccessGranted).toBeFalse();
      });

      it('stores the redirect route', () => {
        guard.checkLogin(fakeUrl);

        expect(serviceStub.redirectUrl).toBe(fakeUrl);
      });

      it('navigates to the login page', () => {
        guard.checkLogin(fakeUrl);

        expect(routerSpy.navigate)
          .toHaveBeenCalledWith(['/login'], jasmine.any(Object));
      });

      it('adds a token to the login URL', () => {
        const expectedToken = 'anchor';

        guard.checkLogin(fakeUrl);

        expect(routerSpy.navigate).toHaveBeenCalledWith(
          jasmine.any(Array),
          jasmine.objectContaining({
            fragment: expectedToken,
          }));
      });

      it('adds a session ID to the login URL', () => {
        const expectedQueryParams: Params = {
          session_id: jasmine.any(Number),
        };

        guard.checkLogin(fakeUrl);

        expect(routerSpy.navigate).toHaveBeenCalledWith(
          jasmine.any(Array),
          jasmine.objectContaining({
            queryParams: expectedQueryParams,
          }));
      });

      describe('when routing', () => {
        it('cannot activate a route', () => {
          const canActivate =
            guard.canActivate(dummyRoute, fakeRouterState(fakeUrl));

          expect(canActivate).toBeFalse();
        });

        it('cannot activate a child route', () => {
          const canActivateChild =
            guard.canActivateChild(dummyRoute, fakeRouterState(fakeUrl));

          expect(canActivateChild).toBeFalse();
        });

        const paths = fakeUrl.split('/').filter(path => path !== '');

        paths.forEach(path => {
          it('cannot lazy load a feature module', () => {
            const fakeRoute: Route = { path };
            const fakeUrlSegment = { path } as UrlSegment;

            const canLoad = guard.canLoad(fakeRoute, [fakeUrlSegment]);

            expect(canLoad).toBeFalse();
          });
        });
      });
    });
  });
});
