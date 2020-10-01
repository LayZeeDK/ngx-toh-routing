import { fakeAsync } from '@angular/core/testing';

import { CrisisCenterModule } from './crisis-center.module';
import { CrisisDetailResolverService } from './crisis-detail-resolver.service';
import { CrisisService } from './crisis.service';
import { FakeCrisisDetailResolver } from './fake-crisis-detail.resolver';
import { FakeCrisisService } from './fake-crisis.service';
import { featureTestSetup } from './feature-test-setup';
import { CRISES } from './mock-crises';

describe('Crisis center', () => {
  const { advance, getText, navigate } = featureTestSetup({
    featureModule: CrisisCenterModule,
    featurePath: 'crisis-center',
    providers: [
      { provide: CrisisService, useClass: FakeCrisisService },
      { provide: CrisisDetailResolverService, useClass: FakeCrisisDetailResolver },
    ]
  });
  const navigateById = (id: number): Promise<boolean> => navigate([id]);

  it('shows crisis detail when a valid ID is in the URL', fakeAsync(() => {
    const [{ id, name }] = CRISES;

    navigateById(id);
    advance();

    expect(getText('h3')).toContain(name);
  }));
});
