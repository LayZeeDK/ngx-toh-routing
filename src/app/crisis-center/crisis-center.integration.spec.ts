import { fakeAsync, TestBed } from '@angular/core/testing';

import { CrisisCenterModule } from './crisis-center.module';
import { CrisisService } from './crisis.service';
import { FakeCrisisService } from './fake-crisis.service';
import { setUpFeatureTest } from './set-up-feature-test';
import { CRISES } from './mock-crises';
import { Crisis } from './crisis';
import { DialogService } from '../dialog.service';
import { FakeDialogService } from './fake-dialog.service';

describe('Crisis center', () => {
  const { advance, clickButton, enterTextInElement, getPath, getText, navigateByUrl } = setUpFeatureTest({
    featureModule: CrisisCenterModule,
    featurePath: 'crisis-center',
    providers: [
      { provide: CrisisService, useClass: FakeCrisisService },
      { provide: DialogService, useClass: FakeDialogService },
    ],
  });

  beforeEach(() => {
    fakeDialog = TestBed.inject(DialogService) as FakeDialogService;
  });

  let fakeDialog: FakeDialogService;

  const [aCrisis] = CRISES;
  const unknownCrisis: Crisis = {
    id: Number.MAX_SAFE_INTEGER,
    name: 'Unknown crisis',
  };
  const newCrisisName = 'Coral reefs are dying';

  it('starts at the crisis center home', fakeAsync(() => {
    navigateByUrl('/');
    advance();

    expect(getText('p')).toBe('Welcome to the Crisis Center');
  }));

  describe('Crisis detail', () => {
    it('shows crisis detail when a valid ID is in the URL', fakeAsync(() => {
      navigateByUrl(aCrisis.id.toString());
      advance();

      expect(getText('h3')).toContain(aCrisis.name);
    }));

    it('navigates to the crisis center home when an invalid ID is in the URL', fakeAsync(async () => {
      const didNavigationSucceed = await navigateByUrl(unknownCrisis.id.toString());
      advance();

      expect(didNavigationSucceed).toBeFalse();
      expect(getText('p')).toContain('Welcome to the Crisis Center');
    }));

    it('navigates to the crisis center home when cancelling crisis detail editing', fakeAsync(() => {
      navigateByUrl(aCrisis.id.toString());
      advance();

      clickButton('Cancel');
      advance();

      expect(getPath()).toBe(`/;id=${aCrisis.id};foo=foo`);
    }));

    describe('Editing crisis name', () => {
      beforeEach(fakeAsync(() => {
        navigateByUrl(aCrisis.id.toString());
        advance();

        enterTextInElement('input', newCrisisName);
      }));

      describe('Canceling crisis editing', () => {
        beforeEach(fakeAsync(() => {
          clickButton('Cancel');
          advance();
        }));

        it('navigates to the crisis list with the crisis selected when discarding unsaved changes is confirmed', fakeAsync(() => {
          expect(getPath()).toBe(`/${aCrisis.id}`);
          fakeDialog.clickOk();
          advance();

          expect(getPath()).toBe(`/;id=${aCrisis.id};foo=foo`);
          expect(getText('p')).toBe('Welcome to the Crisis Center');
        }));

        it('keeps the change and stays on the crisis detail when discarding unsaved changes is canceled', fakeAsync(() => {
          expect(getPath()).toBe(`/${aCrisis.id}`);
          fakeDialog.clickCancel();
          advance();

          expect(getPath()).toBe(`/${aCrisis.id}`);
          expect(getText('h3')).toBe(`"${newCrisisName}"`);
        }));
      });
    });
  });
});
