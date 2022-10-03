import { IContainer, Provider } from '@hemjs/types/container';
import { Container } from '../src/';

class Engine {}

class BrokenEngine {
  constructor() {
    throw new Error('Broken Engine');
  }
}

class DashboardSoftware {}

class Dashboard {
  constructor(software: DashboardSoftware) {}
}

class TurboEngine extends Engine {}

class Car {
  constructor(public engine: Engine) {}
}

class CarWithOptionalEngine {
  constructor(public engine?: Engine) {}
}

class CarWithDashboard {
  engine: Engine;
  dashboard: Dashboard;
  constructor(engine: Engine, dashboard: Dashboard) {
    this.engine = engine;
    this.dashboard = dashboard;
  }
}

class SportsCar extends Car {}

function createContainer(providers: Provider[] = []): Container {
  return new Container(providers);
}

describe('Container', () => {
  it('should return an instance of Container', () => {
    expect(createContainer()).toBeInstanceOf(Container);
  });

  it('should instantiate a class without dependencies', () => {
    const container = createContainer([
      { provide: Engine.name, useClass: Engine },
    ]);
    const engine = container.get(Engine.name);

    expect(engine).toBeInstanceOf(Engine);
  });

  it('should resolve dependencies based on the constructor', () => {
    const container = createContainer([
      { provide: Engine.name, useClass: Engine },
      {
        provide: Car.name,
        useFactory: (container: IContainer) =>
          new Car(container.get(Engine.name)),
      },
    ]);
    const car = container.get<Car>(Car.name);

    expect(car).toBeInstanceOf(Car);
    expect(car.engine).toBeInstanceOf(Engine);
  });

  it('should cache instances', () => {
    const container = createContainer([
      { provide: Engine.name, useClass: Engine },
    ]);

    const a1 = container.get(Engine.name);
    const a2 = container.get(Engine.name);

    expect(a1).toBe(a2);
  });

  it('should provide to a value', () => {
    const container = createContainer([
      { provide: Engine.name, useValue: 'fake engine' },
    ]);
    const engine = container.get(Engine.name);

    expect(engine).toEqual('fake engine');
  });

  it('should provide to a factory', () => {
    function sportsCarFactory(container: IContainer) {
      return new SportsCar(container.get(Engine.name));
    }
    const container = createContainer([
      { provide: Engine.name, useClass: Engine },
      { provide: Car.name, useFactory: sportsCarFactory },
    ]);
    const car = container.get<Car>(Car.name);

    expect(car).toBeInstanceOf(SportsCar);
    expect(car.engine).toBeInstanceOf(Engine);
  });

  it('should supporting provider to null', () => {
    const container = createContainer([
      { provide: Engine.name, useValue: null },
    ]);
    const engine = container.get(Engine.name);

    expect(engine).toBeNull();
  });

  it('should provide to an alias', () => {
    const container = createContainer([
      { provide: Engine.name, useClass: Engine },
      {
        provide: SportsCar.name,
        useFactory: (container: IContainer) =>
          new SportsCar(container.get(Engine.name)),
      },
      { provide: Car.name, useExisting: SportsCar.name },
    ]);
    const car = container.get(Car.name);
    const sportsCar = container.get(SportsCar.name);

    expect(car).toBeInstanceOf(SportsCar);
    expect(car).toBe(sportsCar);
  });

  it('should throw when the aliased provider does not exist', () => {
    const container = createContainer([
      { provide: 'car', useExisting: SportsCar },
    ]);

    expect(() => container.get('car')).toThrowError();
  });

  it('should support overriding factory dependencies', () => {
    const container = createContainer([
      { provide: Engine.name, useClass: Engine },
      {
        provide: Car.name,
        useFactory: (container: IContainer) =>
          new SportsCar(container.get(Engine.name)),
      },
    ]);
    const car = container.get<Car>(Car.name);

    expect(car).toBeInstanceOf(SportsCar);
    expect(car.engine).toBeInstanceOf(Engine);
  });

  it('should support optional dependencies', () => {
    const container = createContainer([
      {
        provide: CarWithOptionalEngine.name,
        useFactory: (container: IContainer) =>
          new CarWithOptionalEngine(<any>null),
      },
    ]);
    const car = container.get<CarWithOptionalEngine>(
      CarWithOptionalEngine.name,
    );

    expect(car.engine).toEqual(null);
  });

  it('should use the last provider when there are multiple providers for same token', () => {
    const container = createContainer([
      { provide: Engine.name, useClass: Engine },
      { provide: Engine.name, useClass: TurboEngine },
    ]);

    expect(container.get(Engine.name)).toBeInstanceOf(TurboEngine);
  });

  it('should resolve when chain dependencies', () => {
    const container = createContainer([
      {
        provide: CarWithDashboard.name,
        useFactory: (container: IContainer) =>
          new CarWithDashboard(
            container.get(Engine.name),
            container.get(Dashboard.name),
          ),
      },
      { provide: Engine.name, useClass: Engine },
      {
        provide: Dashboard.name,
        useFactory: (container: IContainer) =>
          new Dashboard(container.get(DashboardSoftware.name)),
      },
      { provide: DashboardSoftware.name, useClass: DashboardSoftware },
    ]);
    const car = container.get<CarWithDashboard>(CarWithDashboard.name);

    expect(car).toBeInstanceOf(CarWithDashboard);
    expect(car.engine).toBeInstanceOf(Engine);
    expect(car.dashboard).toBeInstanceOf(Dashboard);
  });

  it('should throw when missing chain dependencies', () => {
    const container = createContainer([
      {
        provide: CarWithDashboard.name,
        useFactory: (container: IContainer) =>
          new CarWithDashboard(
            container.get(Engine.name),
            container.get(Dashboard.name),
          ),
      },
      { provide: Engine.name, useClass: Engine },
      {
        provide: Dashboard.name,
        useFactory: (container: IContainer) =>
          new Dashboard(container.get(DashboardSoftware.name)),
      },
      // missing 'DashboardSoftware'
    ]);

    expect(() => container.get(CarWithDashboard.name)).toThrowError(
      'Unable to resolve service',
    );
  });

  it('should throw when invalid class', () => {
    try {
      createContainer([{ provide: Engine.name, useClass: <any>Engine.name }]);
    } catch (error: any) {
      expect(error.message).toBe(
        'Unable to instantiate class (Engine is not constructable).',
      );
    }
  });

  it('should throw when invalid class type', () => {
    try {
      createContainer([{ provide: Car.name, useClass: <any>Car }]);
    } catch (error: any) {
      expect(error.message).toBe(
        'An invalid class, "Car", was provided; expected a defult (no-argument) constructor.',
      );
    }
  });

  it('should throw when cyclic aliases detetected', () => {
    try {
      createContainer([
        { provide: Engine.name, useClass: Engine },
        { provide: Engine.name, useClass: TurboEngine },
        { provide: TurboEngine.name, useExisting: TurboEngine },
      ]);
    } catch (error: any) {
      expect(error.message).toBe('A cycle has been detected');
    }
  });

  it('should return true when provider exist', () => {
    const container = createContainer([
      { provide: String.name, useValue: 'Hello' },
      { provide: Engine.name, useClass: Engine },
      {
        provide: SportsCar.name,
        useFactory: (container: IContainer) =>
          new SportsCar(container.get(Engine.name)),
      },
      { provide: Car.name, useExisting: SportsCar.name },
    ]);

    expect(container.has(String.name)).toBe(true); // service
    expect(container.has(Engine.name)).toBe(true); // class
    expect(container.has(SportsCar.name)).toBe(true); // factory
    expect(container.has(Car.name)).toBe(true); // alias
  });

  it('should return false when provider does not exist', () => {
    const container = createContainer([]);

    expect(container.has('NonExisting')).toBe(false);
  });

  it('shoul fail to instantiate when error happens in a constructor', () => {
    try {
      createContainer([{ provide: Engine.name, useClass: BrokenEngine }]);
    } catch (error: any) {
      expect(error.message).toContain('Broken Engine');
    }
  });
});
