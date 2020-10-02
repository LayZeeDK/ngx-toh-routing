import { Location } from '@angular/common';
import { Provider, Type } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NavigationExtras, Router, UrlTree } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';

import { TestRootComponent } from './test-root.component';

export function featureTestSetup({
  featureModule,
  featurePath,
  providers = [],
}: {
  featureModule: Type<unknown>,
  featurePath: string,
  providers?: Provider[] | Array<Provider | Provider[]>,
}) {
  beforeEach(fakeAsync((() => {
    TestBed.configureTestingModule({
      declarations: [
        TestRootComponent,
      ],
      imports: [
        RouterTestingModule.withRoutes([
          { path: featurePath, pathMatch: 'full', redirectTo: '/' },
        ]),
        featureModule,
      ],
      providers,
    });

    TestBed.compileComponents();

    rootFixture = TestBed.createComponent(TestRootComponent);
    router = TestBed.inject(Router);
    location = TestBed.inject(Location);
    patchRelativeRouterNavigation(router);
    rootFixture.ngZone.run(() => router.initialNavigation());
    tick();
    rootFixture.detectChanges();
  })));

  const getTestUrl = (url: string): string => {
    return stripTrailingCharacter('/', router.serializeUrl(router.parseUrl('')))
      + '/'
      + stripLeadingCharacter('/', url.replace(/^\//, ''));
  };

  let location: Location;
  let rootFixture: ComponentFixture<TestRootComponent>;
  let router: Router;

  return {
    advance(): void {
      tick();
      rootFixture.detectChanges();
    },
    clickButton(label: string): void {
      const button = rootFixture.debugElement.queryAll(By.css('button'))
        .find(b => b.nativeElement.textContent.trim() === label);

      rootFixture.ngZone.run(
        () => button.triggerEventHandler('click', { button: 0 }));
    },
    enterTextInElement(query: string, text: string): void {
      const input = rootFixture.debugElement.query(By.css(query));
      const element = input.nativeElement as HTMLInputElement;
      element.value = text;
      input.triggerEventHandler('input', { target: element });
    },
    getPath(): string {
      return getTestUrl(location.path())
    },
    getText(query: string): string {
      return rootFixture.debugElement.query(By.css(query))
        .nativeElement.textContent;
    },
    navigate(commands: any[], extras?: NavigationExtras) {
      return rootFixture.ngZone.run(() => router.navigate(commands, extras));
    },
    navigateByUrl(url: string | UrlTree, extras?: NavigationExtras) {
      return rootFixture.ngZone.run(() => router.navigateByUrl(url, extras));
    }
  };
}

function isSpy(fn: (...args: any[]) => unknown): boolean {
  return typeof (fn as jasmine.Spy).and !== 'undefined';;
}

function patchRelativeRouterNavigation(router: Router): void {
  if (isSpy(router.navigate)) {
    return;
  }

  const navigate = router.navigate.bind(router);
  spyOn(router, 'navigate').and.callFake(
    (commands: any[], extras?: NavigationExtras): Promise<boolean> => {
      const [firstCommand] = commands;

      if (typeof firstCommand === 'string') {
        commands[0] = firstCommand.replace(/^\.\./, '.');
      }

      return navigate(commands, extras);
    });
}

function stripLeadingCharacter(character: string, text: string): string {
  return text.replace(new RegExp('^' + character), '');
}

function stripTrailingCharacter(character: string, text: string): string {
  return text.replace(new RegExp(character + '$'), '');
}
