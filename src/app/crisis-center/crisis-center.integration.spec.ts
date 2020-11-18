import { fakeAsync, TestBed } from '@angular/core/testing';

import { DialogService } from '../dialog.service';
import { createFeatureTestHarness } from './create-feature-test-harness';
import { Crisis } from './crisis';
import { CrisisCenterModule } from './crisis-center.module';
import { CrisisService } from './crisis.service';
import { FakeCrisisService } from './fake-crisis.service';
import { FakeDialogService } from './fake-dialog.service';
import { CRISES } from './mock-crises';

describe('Crisis center', () => {
  const { advance, clickButton, enterTextInElement, getPath, getText, navigateByUrl } = createFeatureTestHarness({
    featureModule: CrisisCenterModule,
    featurePath: 'crisis-center',
    providers: [
      { provide: CrisisService, useClass: FakeCrisisService },
      { provide: DialogService, useClass: FakeDialogService },
    ],
  });

  const expectCrisisToBeSelected = (crisis: Crisis) =>
    expect(getText('.selected')).toBe(`${crisis.id}${crisis.name}`);
  const expectToBeAtTheCrisisCenterHome = () =>
    expect(getText('p')).toBe('Welcome to the Crisis Center');
  const expectToBeEditing = (crisis: Crisis) => {
    expect(getPath()).toMatch(new RegExp(`^${crisis.id}\$|^${crisis.id}.+|\/${crisis.id}\$`));
    expect(getText('h3')).toContain(crisis.name);
  }

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
    navigateByUrl('');
    advance();

    expectToBeAtTheCrisisCenterHome();
  }));

  describe('Crisis detail', () => {
    it('shows crisis detail when a valid ID is in the URL', fakeAsync(() => {
      navigateByUrl(aCrisis.id.toString());
      advance();

      expectToBeEditing(aCrisis);
    }));

    it('navigates to the crisis center home when an invalid ID is in the URL', fakeAsync(async () => {
      const didNavigationSucceed = await navigateByUrl(unknownCrisis.id.toString());
      advance();

      expect(didNavigationSucceed).toBeFalse();
      expectToBeAtTheCrisisCenterHome();
    }));

    describe('Editing crisis name', () => {
      beforeEach(fakeAsync(() => {
        navigateByUrl(aCrisis.id.toString());
        advance();

        enterTextInElement('input', newCrisisName);
      }));

      describe('Canceling change', () => {
        beforeEach(fakeAsync(() => {
          clickButton('Cancel');
          advance();
        }));

        describe('When discarding unsaved changes is confirmed', () => {
          beforeEach(fakeAsync(() => {
            fakeDialog.clickOk();
            advance();
          }));

          it('navigates to the crisis center home with the crisis selected ', () => {
            expectToBeAtTheCrisisCenterHome();
            expectCrisisToBeSelected(aCrisis);
          });

          it('adds matrix parameters', () => {
            expect(getPath()).toMatch(new RegExp(`;id=${aCrisis.id};foo=foo`));
          });
        });

        it('keeps the change and stays on the crisis detail when discarding unsaved changes is canceled', fakeAsync(() => {
          fakeDialog.clickCancel();
          advance();

          expectToBeEditing({ id: aCrisis.id, name: newCrisisName });
        }));
      });

      describe('Saving change', () => {
        it('navigates to the crisis center home with the crisis selected', fakeAsync(() => {
          clickButton('Save');
          advance();

          expectToBeAtTheCrisisCenterHome();
          expectCrisisToBeSelected({ id: aCrisis.id, name: newCrisisName });
        }));
      });
    });
  });
});
