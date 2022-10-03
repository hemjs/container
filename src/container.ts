import { NoArgument, Type } from '@hemjs/types';
import type {
  ClassProvider,
  ExistingProvider,
  Factory,
  FactoryProvider,
  IContainer,
  Provider,
  ProviderToken,
  ValueProvider,
} from '@hemjs/types/container';
import { isFunction, isUndefined } from '@hemjs/util';
import { CyclicAliasException } from './exception/cyclic-alias.exception';
import { InvalidClassException } from './exception/invalid-class.exception';
import { InvalidConstructorException } from './exception/invalid-constructor.exception';
import { InvalidProviderException } from './exception/invalid-provider.exception';
import { ProviderNotFoundException } from './exception/provider-not-found.exception';
import { ServiceNotCreatedException } from './exception/service-not-created.exception';

class Container implements IContainer {
  private readonly services = new Map<ProviderToken, any>();
  private readonly factories = new Map<ProviderToken, Factory<any>>();
  private readonly aliases = new Map<ProviderToken, any>();
  protected isInitialized = false;

  /**
   * Create a new Container instance.
   * @param providers the providers to initialize
   */
  constructor(providers: Provider[] = []) {
    this.init(providers);
  }

  /**
   * Initialize the given container.
   * @param providers the providers to initialize
   * @returns the initialized container instance
   * @throws InvalidProviderException if an invalid provider definition
   */
  public init(providers: Provider[]): Container {
    let newAliases = false;
    for (const provider of providers) {
      if (this.isValueProvider(provider)) {
        this.services.set(provider.provide, provider.useValue);
      } else if (this.isClassProvider(provider)) {
        const factory: () => any = this.classToFactory(provider.useClass);
        this.factories.set(provider.provide, factory);
      } else if (this.isFactoryProvider(provider)) {
        this.factories.set(provider.provide, provider.useFactory);
      } else if (this.isExistingProvider(provider)) {
        this.aliases.set(provider.provide, provider.useExisting);
        newAliases = true;
      } else {
        throw new InvalidProviderException(provider);
      }
    }
    if (newAliases) {
      this.mapAliasesToTargets();
    } else if (!this.isInitialized && newAliases) {
      this.mapAliasesToTargets();
    }
    this.isInitialized = true;
    return this;
  }

  /**
   * Find an entry of the container based on the provided token.
   * @param token the provider token of the entry to look for
   * @returns an entry from the container if defined
   */
  public get<T>(token: ProviderToken): T {
    if (this.services.has(token)) {
      return this.services.get(token);
    }
    if (this.aliases.size === 0) {
      const object = this.doCreate(token);
      this.services.set(token, object);
      return object;
    }
    const resolvedToken = this.aliases.get(token) ?? token;
    if (this.services.has(token)) {
      const object = this.services.get(resolvedToken);
      this.services.set(token, object);
      return object;
    }
    const object = this.doCreate(resolvedToken);
    this.services.set(resolvedToken, object);
    this.services.set(token, object);
    return object;
  }

  /**
   * Check if an entry for the given provider token exists.
   * @param token the provider token of the entry to look for
   * @returns whether an entry for the given provider exists
   */
  public has(token: ProviderToken): boolean {
    if (this.services.has(token) || this.factories.has(token)) {
      return true;
    }
    const resolvedToken = this.aliases.get(token) ?? token;
    if (resolvedToken !== token) {
      return this.has(resolvedToken);
    }
    return false;
  }

  /**
   * Add the given provider to the container.
   * @param provider the provider to add
   * @returns the added provider
   * @throws InvalidProviderException if an invalid provider definition
   */
  public addProvider(provider: Provider) {
    if (this.isValueProvider(provider)) {
      this.services.set(provider.provide, provider.useValue);
    } else if (this.isClassProvider(provider)) {
      const factory: () => any = this.classToFactory(provider.useClass);
      this.factories.set(provider.provide, factory);
    } else if (this.isFactoryProvider(provider)) {
      this.factories.set(provider.provide, provider.useFactory);
    } else if (this.isExistingProvider(provider)) {
      const { useExisting: target, provide: alias } = provider;
      this.mapAliasToTarget(alias, target);
    } else {
      throw new InvalidProviderException(provider);
    }
    return this;
  }

  /**
   * Check if the given provider is a value provider.
   * @param provider the provider to check
   * @returns whether the given provider is a value provider
   */
  public isValueProvider(provider: Provider): provider is ValueProvider {
    return !isUndefined((provider as ValueProvider).useValue);
  }

  /**
   * Check if the given provider is a class provider.
   * @param provider the provider to check
   * @returns whether the given provider is a class provider
   */
  public isClassProvider(provider: Provider): provider is ClassProvider {
    return !isUndefined((provider as ClassProvider).useClass);
  }

  /**
   * Check if the given provider is a factory provider.
   * @param provider the provider to check
   * @returns whether the given provider is a factory provider
   */
  public isFactoryProvider(provider: Provider): provider is FactoryProvider {
    return !isUndefined((provider as FactoryProvider).useFactory);
  }

  /**
   * Check if the given provider is an alias provider.
   * @param provider the provider to check
   * @returns whether the given provider is an alias provider
   */
  public isExistingProvider(provider: Provider): provider is ExistingProvider {
    return !isUndefined((provider as ExistingProvider).useExisting);
  }

  /**
   * Actually create a new service instance for the provider token.
   * @param token the provider token of the requested service
   * @returns the actual service instance that should be injected
   * @throws Error if a service could not be created
   */
  private doCreate(token: ProviderToken) {
    let object: any;
    try {
      const factory = this.getFactory(token);
      object = factory(this);
    } catch (error: any) {
      throw new ServiceNotCreatedException(token, error.message);
    }
    return object;
  }

  /**
   * Return the factory function that matches the given provider token, if any.
   * @param token the provider token of the factory to retrieve
   * @returns the factory function to create the service instance
   * @throws Error if there is no service with the given provider token
   */
  private getFactory(token: ProviderToken): Factory {
    const factory = this.factories.get(token) ?? null;
    if (factory === null) {
      throw new ProviderNotFoundException(token);
    }
    if (isFunction(factory)) {
      return factory;
    }
    return factory;
  }

  /**
   * Maps a particular token to another for a given service instance.
   * @param alias the token to locate service associated with the target token
   * @param target the token associated with a given service instance
   * @throws CyclicAliasException if a cycle is detected
   */
  private mapAliasToTarget(alias: ProviderToken, target: ProviderToken): void {
    const nTarget = this.aliases.get(target) ?? target;
    this.aliases.set(alias, nTarget);
    if (alias === this.aliases.get(alias)) {
      throw new CyclicAliasException(alias, this.aliases);
    }
  }

  /**
   * Map aliases to target services in a group for optimal performance.
   *
   * This method maps this.aliases in place.
   *
   * The algorithm is an adaptated version of Tarjans Strongly
   * Connected Components. Instead of returning the strongly
   * connected components (i.e. cycles in this case), we throw.
   * If nodes are not strongly connected (i.e. resolvable in
   * this case), they get resolved.
   *
   * @throws CyclicAliasException if a cycle is detected
   */
  private mapAliasesToTargets(): void {
    const tagged = new Map<any, any>();
    for (const alias of this.aliases.keys()) {
      if (tagged.has(alias)) {
        continue;
      }
      let tCursor = this.aliases.get(alias);
      let aCursor = alias;
      if (aCursor === tCursor) {
        throw new CyclicAliasException(alias, this.aliases);
      }
      if (!this.aliases.has(tCursor)) {
        continue;
      }
      const stack = [];
      while (this.aliases.has(tCursor)) {
        stack.push(aCursor);
        if (aCursor === this.aliases.get(tCursor)) {
          throw new CyclicAliasException(alias, this.aliases);
        }
        aCursor = tCursor;
        tCursor = this.aliases.get(tCursor);
      }
      tagged.set(aCursor, true);
      for (const alias of stack) {
        if (alias === tCursor) {
          throw new CyclicAliasException(alias, this.aliases);
        }
        this.aliases.set(alias, tCursor);
        tagged.set(alias, true);
      }
    }
  }

  /**
   * Convert a type to a factory function - expect a defult (no-argument) constructor.
   * @param type the type to convert
   * @returns the factory used to create the instance that should be injected
   * @throws InvalidClassException if type not constructable
   * @throws InvalidConstructorException if type not defult constructor
   */
  private classToFactory(type: NoArgument): () => any {
    if (!this.isNewable(type)) {
      throw new InvalidClassException(type);
    }
    const paramLength = type.length;
    if (paramLength > 0) {
      throw new InvalidConstructorException(type);
    }
    return () => new (type as NoArgument<any>)();
  }

  /**
   * Check if the given type can be instantiated.
   * @param type the type to check
   * @returns whether the given type can be instantiated
   */
  private isNewable(type: Type): boolean {
    return type && isFunction(type) && type.prototype;
  }
}

export default Container;
