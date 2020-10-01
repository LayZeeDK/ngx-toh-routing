import { fakeAsync } from '@angular/core/testing';

import { CrisisCenterModule } from './crisis-center.module';
import { CrisisDetailResolverService } from './crisis-detail-resolver.service';
import { CrisisService } from './crisis.service';
import { FakeCrisisDetailResolver } from './fake-crisis-detail.resolver';
import { FakeCrisisService } from './fake-crisis.service';
import { featureTestSetup } from './feature-test-setup';
import { CRISES } from './mock-crises';

describe('Crisis center', () => {
  const { advance, clickButton, expectPathToBe, getText, navigateByUrl } = featureTestSetup({
    featureModule: CrisisCenterModule,
    featurePath: 'crisis-center',
    providers: [
      { provide: CrisisService, useClass: FakeCrisisService },
      { provide: CrisisDetailResolverService, useClass: FakeCrisisDetailResolver },
    ]
  });

  it('shows crisis detail when a valid ID is in the URL', fakeAsync(() => {
    const [{ id, name }] = CRISES;

    navigateByUrl(id.toString());
    advance();

    expect(getText('h3')).toContain(name);
  }));

  it('navigates to the crisis center home when an invalid ID is in the URL', fakeAsync(async () => {
    const invalidId = Number.MAX_SAFE_INTEGER;

    const didNavigationSucceed = await navigateByUrl(invalidId.toString());
    advance();

    expect(didNavigationSucceed).toBeFalse();
    expect(getText('p')).toContain('Welcome to the Crisis Center');
  }));

  it('navigates to the crisis center home when cancelling crisis detail editing', fakeAsync(() => {
    const [{ id }] = CRISES;
    navigateByUrl(id.toString());
    advance();

    clickButton('Cancel');
    advance();

    expectPathToBe(`/${id};id=${id};foo=foo`);
  }));
});
