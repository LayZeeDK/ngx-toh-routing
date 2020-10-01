import { Location } from '@angular/common';
import { Provider, Type } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NavigationExtras, Router } from '@angular/router';
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
    getTestUrl(url: string): string {
      return stripTrailingCharacter('/', router.serializeUrl(router.parseUrl('')))
        + '/'
        + stripLeadingCharacter('/', url.replace(/^\//, ''));
    },
    getText(query: string): string {
      return rootFixture.debugElement.query(By.css(query))
        .nativeElement.textContent;
    },
    navigate(commands: any[], extras?: NavigationExtras) {
      return rootFixture.ngZone.run(() => router.navigate(commands, extras));
    },
  };
}

function patchRelativeRouterNavigation(router: Router): void {
  const navigate = router.navigate.bind(router);
  const isSpiedUpon = typeof (router.navigate as jasmine.Spy).and !== 'undefined';

  if (isSpiedUpon) {
    return;
  }

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
