import { CommonModule, Location } from '@angular/common';
import { ComponentFixture, fakeAsync, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';

import { CrisisCenterHomeComponent } from './crisis-center-home/crisis-center-home.component';
import { CrisisCenterRoutingModule } from './crisis-center-routing.module';
import { CrisisCenterComponent } from './crisis-center/crisis-center.component';
import { CrisisDetailResolverService } from './crisis-detail-resolver.service';
import { CrisisDetailComponent } from './crisis-detail/crisis-detail.component';
import { CrisisListComponent } from './crisis-list/crisis-list.component';
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
        CrisisCenterComponent,
        CrisisListComponent,
        CrisisCenterHomeComponent,
        CrisisDetailComponent,
      ],
      imports: [
        CommonModule,
        FormsModule,
        RouterTestingModule.withRoutes([
          {
            path: basePath,
            loadChildren: () => CrisisCenterRoutingModule,
          },
          {
            path: '',
            pathMatch: 'full',
            redirectTo: basePath,
          }
        ]),
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

  const basePath = 'crisis-center';
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
