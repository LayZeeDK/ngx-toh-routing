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

function fakeRouterState(url: string): RouterStateSnapshot {
  return {
    url,
  } as RouterStateSnapshot;
}

describe('AuthGuard (isolated)', () => {
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

      describe('and navigates to a guarded route configuration', () => {
        it('grants route access', () => {
          const canActivate =
            guard.canActivate(dummyRoute, fakeRouterState(fakeUrl));

          expect(canActivate).toBeTrue();
        });

        it('grants child route access', () => {
          const canActivateChild =
            guard.canActivateChild(dummyRoute, fakeRouterState(fakeUrl));

          expect(canActivateChild).toBeTrue();
        });

        const paths = fakeUrl.split('/').filter(path => path !== '');

        paths.forEach(path => {
          it('grants feature access', () => {
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

      it('stores the redirect URL', () => {
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

      describe('and navigates to a guarded route configuration', () => {
        it('rejects route access', () => {
          const canActivate =
            guard.canActivate(dummyRoute, fakeRouterState(fakeUrl));

          expect(canActivate).toBeFalse();
        });

        it('rejects child route access', () => {
          const canActivateChild =
            guard.canActivateChild(dummyRoute, fakeRouterState(fakeUrl));

          expect(canActivateChild).toBeFalse();
        });

        const paths = fakeUrl.split('/').filter(path => path !== '');

        paths.forEach(path => {
          it('rejects feature access', () => {
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
