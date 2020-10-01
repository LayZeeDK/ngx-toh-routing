import { ComponentFixture, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NavigationExtras, Router } from '@angular/router';

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

export function setup<TFixture>({
  basePath,
  rootFixture,
  router,
}: {
  basePath: string;
  rootFixture: ComponentFixture<TFixture>;
  router: Router;
}) {
  patchRelativeRouterNavigation(router);

  return {
    advance() {
      tick();
      rootFixture.detectChanges();
    },
    clickButton(label: string) {
      const button = rootFixture.debugElement.queryAll(By.css('button'))
        .find(b => b.nativeElement.textContent.trim() === label);

      rootFixture.ngZone.run(
        () => button.triggerEventHandler('click', { button: 0 }));
    },
    getTestUrl(url: string): string {
      return stripTrailingCharacter('/', router.serializeUrl(router.parseUrl(basePath)))
        + '/'
        + stripLeadingCharacter('/', url.replace(/^\//, ''));
    },
    getText(query: string) {
      return rootFixture.debugElement.query(By.css(query))
        .nativeElement.textContent;
    },
    navigateById(id: number) {
      return rootFixture.ngZone.run(() => router.navigate([basePath, id]));
    },
  };
}
