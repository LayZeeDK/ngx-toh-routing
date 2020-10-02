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
  const Given_I_am_editing_crisis_details_for = (crisis: Crisis, spec: SpecDefinitions) => {
    describe(`Given I am editing crisis details for "${crisis.name}"`, () => {
      beforeEach(fakeAsync(() => {
        navigateByUrl(crisis.id.toString());
        advance();
      }));

      spec();
    });
  };
  const Given_the_crisis = (crisis: Crisis, spec: SpecDefinitions) => {
    describe(`Given the crisis "${crisis.name}"`, () => {
      spec();
    });
  };
  const Then_I_am_at_crisis_center_home = () => {
    it('Then I am at crisis center home', () => {
      expect(getPath()).toBe('/');
      expect(getText('p')).toBe('Welcome to the Crisis Center');
    });
  };
  const Then_I_am_at_crisis_details = (crisis: Crisis) => {
    it('Then I am at crisis details', () => {
      expect(getPath()).toBe(`/${crisis.id}`);
    });
  };
  const Then_I_am_at_crisis_list_with_crisis_selected = (crisis: Crisis) => {
    it('Then I am at crisis list with crisis selected', () => {
      expect(getPath()).toBe(`/${crisis.id};id=${crisis.id};foo=foo`);
    });
  };
  const Then_I_see_crisis_details_for = (name: string) => {
    it(`Then I see crisis details for "${name}"`, () => {
      expect(getText('h3')).toContain(name);
    });
  };
  const When_I_cancel_editing = (spec: SpecDefinitions) => {
    describe('When I cancel editing', () => {
      beforeEach(fakeAsync(() => {
        clickButton('Cancel');
        advance();
      }));

      spec();
    });
  };
  const When_I_confirm = (spec: SpecDefinitions) => {
    describe('When I confirm', () => {
      beforeEach(fakeAsync(() => {
        fakeDialogService.clickOk();
        advance();
      }));

      spec();
    });
  };
  const When_I_do_not_confirm = (spec: SpecDefinitions) => {
    describe('When I do not confirm', () => {
      beforeEach(fakeAsync(() => {
        fakeDialogService.clickCancel();
        advance();
      }));

      spec();
    });
  };
  const When_I_enter_the_crisis_name = (name: string, spec: SpecDefinitions) => {
    describe(`When I enter the crisis name "${name}"`, () => {
      beforeEach(fakeAsync(() => {
        enterTextInElement('input', name);
        advance();
      }));

      spec();
    });
  };
  const When_I_open_the_application = (spec: SpecDefinitions) => {
    describe('When I open the application', () => {
      beforeEach(fakeAsync(() => {
        navigateByUrl('/');
        advance();
      }));

      spec();
    });
  };

  When_I_open_the_application(() => {
    Then_I_am_at_crisis_center_home();
  });

  const [aCrisis] = CRISES;
  Given_the_crisis(aCrisis, () => {
    Given_I_am_editing_crisis_details_for(aCrisis, () => {
      Then_I_see_crisis_details_for(aCrisis.name);

      When_I_cancel_editing(() => {
        Then_I_am_at_crisis_list_with_crisis_selected(aCrisis);
      });

      const coralReefsAreDying = 'Coral reefs are dying';
      When_I_enter_the_crisis_name(coralReefsAreDying, () => {
        When_I_cancel_editing(() => {
          When_I_do_not_confirm(() => {
            Then_I_am_at_crisis_details(aCrisis);
            Then_I_see_crisis_details_for(coralReefsAreDying);
          });

          When_I_confirm(() => {
            Then_I_am_at_crisis_list_with_crisis_selected(aCrisis);
          });
        });
      });
    });
  });

  const unknownCrisis: Crisis = {
    id: Number.MAX_SAFE_INTEGER,
    name: 'Unknown crisis',
  };
  Given_the_crisis(unknownCrisis, () => {
    //   const didNavigationSucceed = await navigateByUrl(invalidId.toString());
    //   advance();

    //   expect(didNavigationSucceed).toBeFalse();
    Then_I_am_at_crisis_center_home();
  });
});
