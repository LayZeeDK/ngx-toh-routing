import { fakeAsync } from '@angular/core/testing';

import { DialogService } from '../dialog.service';
import { Crisis } from './crisis';
import { CrisisCenterModule } from './crisis-center.module';
import { CrisisDetailResolverService } from './crisis-detail-resolver.service';
import { CrisisService } from './crisis.service';
import { FakeCrisisDetailResolver } from './fake-crisis-detail.resolver';
import { FakeCrisisService } from './fake-crisis.service';
import { FakeDialogService } from './fake-dialog.service';
import { featureTestSetup } from './feature-test-setup';
import { CRISES } from './mock-crises';

type SpecDefinitions = () => void;

describe('Crisis center', () => {
  const fakeDialogService = new FakeDialogService();
  const { advance, clickButton, enterTextInElement, getPath, getText, navigateByUrl } = featureTestSetup({
    featureModule: CrisisCenterModule,
    featurePath: 'crisis-center',
    providers: [
      { provide: CrisisService, useClass: FakeCrisisService },
      { provide: CrisisDetailResolverService, useClass: FakeCrisisDetailResolver },
      { provide: DialogService, useValue: fakeDialogService },
    ],
  });
  const givenIAmEditingCrisisDetailsFor = (crisis: Crisis, spec: SpecDefinitions) => {
    describe(`Given I am editing crisis details for "${crisis.name}"`, () => {
      beforeEach(fakeAsync(() => {
        navigateByUrl(crisis.id.toString());
        advance();
      }));

      spec();
    });
  };
  const givenTheCrisis = (crisis: Crisis, spec: SpecDefinitions) => {
    describe(`Given the crisis "${crisis.name}"`, () => {
      spec();
    });
  };
  const thenIAmAtCrisisCenterHome = () => {
    it('Then I am at crisis center home', () => {
      expect(getPath()).toBe('/');
      expect(getText('p')).toBe('Welcome to the Crisis Center');
    });
  };
  const thenIAmAtCrisisDetails = (crisis: Crisis) => {
    it('Then I am at crisis details', () => {
      expect(getPath()).toBe(`/${crisis.id}`);
    });
  };
  const thenIAmAtCrisisListWithCrisisSelected = (crisis: Crisis) => {
    it('Then I am at crisis list with crisis selected', () => {
      expect(getPath()).toBe(`/${crisis.id};id=${crisis.id};foo=foo`);
    });
  };
  const thenISeeCrisisDetailsFor = (name: string) => {
    it(`Then I see crisis details for "${name}"`, () => {
      expect(getText('h3')).toContain(name);
    });
  };
  const whenICancelEditing = (spec: SpecDefinitions) => {
    describe('When I cancel editing', () => {
      beforeEach(fakeAsync(() => {
        clickButton('Cancel');
        advance();
      }));

      spec();
    });
  };
  const whenIConfirm = (spec: SpecDefinitions) => {
    describe('And I confirm', () => {
      beforeEach(fakeAsync(() => {
        fakeDialogService.clickOk();
        advance();
      }));

      spec();
    });
  };
  const whenIDoNotConfirm = (spec: SpecDefinitions) => {
    describe('And I do not confirm', () => {
      beforeEach(fakeAsync(() => {
        fakeDialogService.clickCancel();
        advance();
      }));

      spec();
    });
  };
  const whenIEnterTheCrisisName = (name: string, spec: SpecDefinitions) => {
    describe(`When I enter the crisis name "${name}"`, () => {
      beforeEach(fakeAsync(() => {
        enterTextInElement('input', name);
        advance();
      }));

      spec();
    });
  };
  const whenIOpenTheApplication = (spec: SpecDefinitions) => {
    describe('When I open the application', () => {
      beforeEach(fakeAsync(() => {
        navigateByUrl('/');
        advance();
      }));

      spec();
    });
  };

  whenIOpenTheApplication(() => {
    thenIAmAtCrisisCenterHome();
  });

  const [aCrisis] = CRISES;
  givenTheCrisis(aCrisis, () => {
    givenIAmEditingCrisisDetailsFor(aCrisis, () => {
      thenISeeCrisisDetailsFor(aCrisis.name);

      whenICancelEditing(() => {
        thenIAmAtCrisisListWithCrisisSelected(aCrisis);
      });

      const coralReefsAreDying = 'Coral reefs are dying';
      whenIEnterTheCrisisName(coralReefsAreDying, () => {
        whenICancelEditing(() => {
          whenIDoNotConfirm(() => {
            thenIAmAtCrisisDetails(aCrisis);
            thenISeeCrisisDetailsFor(coralReefsAreDying);
          });

          whenIConfirm(() => {
            thenIAmAtCrisisListWithCrisisSelected(aCrisis);
          });
        });
      });
    });
  });

  const unknownCrisis: Crisis = {
    id: Number.MAX_SAFE_INTEGER,
    name: 'Unknown crisis',
  };
  givenTheCrisis(unknownCrisis, () => {
    //   const didNavigationSucceed = await navigateByUrl(invalidId.toString());
    //   advance();

    //   expect(didNavigationSucceed).toBeFalse();
    thenIAmAtCrisisCenterHome();
  });
});
