import { IContainer, Provider } from '@hemtypes/container';
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
      'No provider for "DashboardSoftware" was found; are you certain you provided it during configuration?',
    );
  });

  it('should throw when invalid provider definition', () => {
    try {
      createContainer(<any>[<any>'blah']);
    } catch (error: any) {
      expect(error.message).toBe(
        'An invalid provider definition has been detected; only instances of Provider are allowed, got: [blah].',
      );
    }
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
        { provide: TurboEngine.name, useClass: TurboEngine },
        { provide: Engine.name, useExisting: TurboEngine.name },
        { provide: TurboEngine.name, useExisting: Engine.name },
      ]);
    } catch (error: any) {
      expect(error.message).toBe(
        'A cycle has been detected within the aliases definitions:\n Engine -> TurboEngine -> Engine\n',
      );
    }
  });

  it('should throw when no provider defined', () => {
    const container = createContainer([]);

    expect(() => container.get('NonExisting')).toThrowError(
      'Service for "NonExisting" could not be created. Reason: No provider for "NonExisting" was found; are you certain you provided it during configuration?',
    );
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

  it('should add a single value provider', () => {
    const container = createContainer([]);
    container.addProvider({ provide: String.name, useValue: 'Hello' });

    expect(container.get(String.name)).toEqual('Hello');
  });

  it('should add a single class provider', () => {
    const container = createContainer([]);
    container.addProvider({ provide: Engine.name, useClass: TurboEngine });
    const engine: Engine = container.get(Engine.name);

    expect(engine instanceof TurboEngine).toBe(true);
  });

  it('should add a single factory provider', () => {
    const container = createContainer([]);
    container.addProvider({
      provide: Engine.name,
      useClass: Engine,
    });
    container.addProvider({
      provide: Car.name,
      useFactory: (container: IContainer) =>
        new SportsCar(container.get(Engine.name)),
    });
    const car: Car = container.get(Car.name);

    expect(car instanceof SportsCar).toBe(true);
  });

  it('should add a single alias provider', () => {
    const container = createContainer([]);
    container.addProvider({
      provide: TurboEngine.name,
      useClass: TurboEngine,
    });
    container.addProvider({
      provide: Engine.name,
      useExisting: TurboEngine.name,
    });

    expect(container.get(Engine.name)).toBe(container.get(TurboEngine.name));
  });

  it('should throw when given invalid single provider', () => {
    expect(() => createContainer([]).addProvider(<any>'blah')).toThrowError(
      'An invalid provider definition has been detected; only instances of Provider are allowed, got: [blah].',
    );
  });

  it('should throw when single provider cyclic aliases detetected', () => {
    try {
      const container = createContainer([]);
      container.addProvider({
        provide: TurboEngine.name,
        useClass: TurboEngine,
      });
      container.addProvider({
        provide: TurboEngine.name,
        useExisting: Engine.name,
      });
    } catch (error: any) {
      expect(error.message).toBe(
        'A cycle has been detected within the aliases definitions:\n Engine -> TurboEngine -> Engine\n',
      );
    }
  });
});
