import { CommonModule, Location } from '@angular/common';
import { Component, Injectable, ViewChild } from '@angular/core';
import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
} from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { Router, RouterOutlet } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';

import { Crisis } from './crisis';
import {
  CrisisCenterHomeComponent,
} from './crisis-center-home/crisis-center-home.component';
import { CrisisCenterRoutingModule } from './crisis-center-routing.module';
import { CrisisCenterComponent } from './crisis-center/crisis-center.component';
import { CrisisDetailComponent } from './crisis-detail/crisis-detail.component';
import { CrisisListComponent } from './crisis-list/crisis-list.component';
import { CrisisService } from './crisis.service';
import { CRISES } from './mock-crises';

@Component({
  template: '<router-outlet></router-outlet>',
})
class TestRootComponent {
  @ViewChild(RouterOutlet)
  routerOutlet: RouterOutlet;

  getActiveComponent<T>(): T {
    return this.routerOutlet.component as T;
  }
}

@Injectable()
class FakeCrisisService implements Partial<CrisisService> {
  private crises$: BehaviorSubject<Crisis[]> = new BehaviorSubject<Crisis[]>(CRISES);

  getCrises() {
    return this.crises$;
  }

  getCrisis(id: number | string) {
    if (typeof id === 'string') {
      id = Number.parseInt(id, 10);
    }

    return this.getCrises().pipe(
      map(crises => crises.find(crisis => crisis.id === id)),
    );
  }
}

describe('Crisis center', () => {
  function advance() {
    tick();
    rootFixture.detectChanges();
  }

  function clickButton(label: string) {
    const button = rootFixture.debugElement.queryAll(By.css('button'))
      .find(b => b.nativeElement.textContent.trim() === label);

    rootFixture.ngZone.run(
      () => button.triggerEventHandler('click', { button: 0 }));
  }

  function getText(query: string) {
    return rootFixture.debugElement.query(By.css(query))
      .nativeElement.textContent;
  }

  function navigateById(id: number) {
    return rootFixture.ngZone.run(() => router.navigate(['crisis-center', id]));
  }

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
        CrisisCenterRoutingModule,
        RouterTestingModule.withRoutes([
          {
            path: 'crisis-center',
            loadChildren: () => CrisisCenterRoutingModule,
          },
          {
            path: '',
            pathMatch: 'full',
            redirectTo: 'crisis-center',
          }
        ], {
          relativeLinkResolution: 'corrected',
        }),
      ],
      providers: [
        { provide: CrisisService, useClass: FakeCrisisService },
      ],
    });

    await TestBed.compileComponents();

    rootFixture = TestBed.createComponent(TestRootComponent);
    router = TestBed.inject(Router);
    location = TestBed.inject(Location);
  });

  beforeEach(fakeAsync(() => {
    rootFixture.ngZone.run(() => router.initialNavigation());
    advance();
  }));

  let location: Location;
  let rootFixture: ComponentFixture<TestRootComponent>;
  let router: Router;

  it('shows crisis detail when a valid ID is in the URL', fakeAsync(() => {
    const [firstCrisis] = CRISES;

    navigateById(firstCrisis.id);
    advance();

    expect(getText('h3')).toContain(firstCrisis.name);
  }));

  xit('navigates to the crisis center home when an invalid ID is in the URL', fakeAsync(() => {
    navigateById(0);
    advance();

    expect(getText('p')).toContain('Welcome to the Crisis Center');
  }));

  it('navigates to the crisis center home when canceling crisis detail edit', fakeAsync(() => {
    const [firstCrisis] = CRISES;
    navigateById(firstCrisis.id);
    advance();

    clickButton('Cancel');
    advance();

    expect(location.path().startsWith('/crisis-center')).toBeTrue();
  }));
});
