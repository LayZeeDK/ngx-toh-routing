import { Params, Router } from '@angular/router';

import { AuthGuard } from './auth.guard';
import { AuthService } from './auth.service';

describe('AuthGuard (isolated)', () => {
  beforeEach(() => {
    routerSpy = jasmine.createSpyObj<Router>('Router', ['navigate']);
    serviceStub = {};
    guard = new AuthGuard(serviceStub as AuthService, routerSpy);
  });

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

    fakeUrls.forEach(url => {
      it('grants access', () => {
        const isAccessGranted = guard.checkLogin(url);

        expect(isAccessGranted).toBeTrue();
      });
    });
  });

  describe('when the user is logged out', () => {
    beforeEach(() => {
      serviceStub.isLoggedIn = false;
    });

    fakeUrls.forEach(url => {
      it('rejects access', () => {
        const isAccessGranted = guard.checkLogin(url);

        expect(isAccessGranted).toBeFalse();
      });

      it('stores the redirect route', () => {
        guard.checkLogin(url);

        expect(serviceStub.redirectUrl).toBe(url);
      });

      it('navigates to the login page', () => {
        guard.checkLogin(url);

        expect(routerSpy.navigate)
          .toHaveBeenCalledWith(['/login'], jasmine.any(Object));
      });

      it('adds a token to the login URL', () => {
        const expectedToken = 'anchor';

        guard.checkLogin(url);

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

        guard.checkLogin(url);

        expect(routerSpy.navigate).toHaveBeenCalledWith(
          jasmine.any(Array),
          jasmine.objectContaining({
            queryParams: expectedQueryParams,
          }));
      });
    });
  });
});
