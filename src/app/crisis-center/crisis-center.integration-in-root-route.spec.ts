import { Location } from '@angular/common';
import { ComponentFixture, fakeAsync, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';

import { CrisisCenterModule } from './crisis-center.module';
import { CrisisDetailResolverService } from './crisis-detail-resolver.service';
import { CrisisService } from './crisis.service';
import { FakeCrisisDetailResolver } from './fake-crisis-detail.resolver';
import { FakeCrisisService } from './fake-crisis.service';
import { CRISES } from './mock-crises';
import { setup } from './setup';
import { TestRootComponent } from './test-root.component';

describe('Crisis center', () => {
  beforeEach(async () => {
    TestBed.configureTestingModule({
      declarations: [
        TestRootComponent,
      ],
      imports: [
        RouterTestingModule.withRoutes([
          { path: 'crisis-center', pathMatch: 'full', redirectTo: '/' },
        ]),
        CrisisCenterModule,
      ],
      providers: [
        { provide: CrisisService, useClass: FakeCrisisService },
        { provide: CrisisDetailResolverService, useClass: FakeCrisisDetailResolver },
      ],
    });

    await TestBed.compileComponents();

    rootFixture = TestBed.createComponent(TestRootComponent);
    router = TestBed.inject(Router);
    location = TestBed.inject(Location);
  });

  beforeEach(fakeAsync(() => {
    const { advance } = setup({
      basePath,
      rootFixture,
      router,
    });
    rootFixture.ngZone.run(() => router.initialNavigation());

    advance();
  }));

  const basePath = '';
  let location: Location;
  let rootFixture: ComponentFixture<TestRootComponent>;
  let router: Router;

  it('shows crisis detail when a valid ID is in the URL', fakeAsync(() => {
    const { advance, getText, navigateById } = setup({
      basePath,
      rootFixture,
      router,
    });
    const [firstCrisis] = CRISES;

    navigateById(firstCrisis.id);
    advance();

    expect(getText('h3')).toContain(firstCrisis.name);
  }));

  it('navigates to the crisis center home when an invalid ID is in the URL', fakeAsync(() => {
    const { advance, getText, navigateById } = setup({
      basePath,
      rootFixture,
      router,
    });
    navigateById(0);
    advance();

    expect(getText('p')).toContain('Welcome to the Crisis Center');
  }));

  it('navigates to the crisis center home when cancelling crisis detail edit', fakeAsync(() => {
    const { advance, clickButton, getTestUrl, navigateById } = setup({
      basePath,
      rootFixture,
      router,
    });
    const [firstCrisis] = CRISES;
    navigateById(firstCrisis.id);
    advance();

    clickButton('Cancel');
    advance();

    expect(location.path()).toBe(getTestUrl('/1;id=1;foo=foo'));
  }));
});
