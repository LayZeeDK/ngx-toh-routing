import { fakeAsync } from '@angular/core/testing';

import { CrisisCenterModule } from './crisis-center.module';
import { CrisisDetailResolverService } from './crisis-detail-resolver.service';
import { CrisisService } from './crisis.service';
import { FakeCrisisDetailResolver } from './fake-crisis-detail.resolver';
import { FakeCrisisService } from './fake-crisis.service';
import { featureTestSetup } from './feature-test-setup';
import { CRISES } from './mock-crises';
import { Crisis } from './crisis';

describe('Crisis center', () => {
  const { advance, clickButton, getPath, getText, navigateByUrl } = featureTestSetup({
    featureModule: CrisisCenterModule,
    featurePath: 'crisis-center',
    providers: [
      { provide: CrisisService, useClass: FakeCrisisService },
      { provide: CrisisDetailResolverService, useClass: FakeCrisisDetailResolver },
    ]
  });

  const [aCrisis] = CRISES;
  const unknownCrisis: Crisis = {
    id: Number.MAX_SAFE_INTEGER,
    name: 'Unknown crisis',
  };

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

    expect(getPath()).toBe(`/${aCrisis.id};id=${aCrisis.id};foo=foo`);
  }));
});
