import { assert } from '../utils/index.js';

/** Definition for a single config property. */
interface ConfigProperty<T = unknown> {
  value: T;
  getter?: (value: T) => T;
  setter?: (value: T) => T;
}

/** Options when defining a config property. */
export interface ConfigDefineOptions<T = unknown> {
  /** Default value for the property. */
  defaultValue: T;
  /** Optional transform applied when reading the value. */
  getter?: (value: T) => T;
  /** Optional transform applied when writing the value. */
  setter?: (value: T) => T;
}

/**
 * Manages named configuration properties with optional getter/setter transforms.
 */
export class ConfigManager {
  private readonly properties = new Map<string, ConfigProperty>();

  /** Defines a new config property. */
  define<T>(name: string, options: ConfigDefineOptions<T>): this {
    assert(!this.properties.has(name), `config "${name}" is already defined`);

    const { defaultValue, getter, setter } = options;
    const value = setter ? setter(defaultValue) : defaultValue;

    this.properties.set(name, {
      value,
      getter: getter as ConfigProperty['getter'],
      setter: setter as ConfigProperty['setter'],
    });

    return this;
  }

  /** Returns the value of a config property. */
  get<T>(name: string): T {
    const property = this.getProperty(name);
    const { value, getter } = property;
    return (getter ? getter(value) : value) as T;
  }

  /** Sets the value of a config property. */
  set<T>(name: string, value: T): this {
    const property = this.getProperty(name);
    property.value = property.setter ? property.setter(value) : value;
    return this;
  }

  /** Sets multiple config properties at once. */
  setBatch(values: Record<string, unknown>): this {
    for (const [name, value] of Object.entries(values)) {
      this.set(name, value);
    }
    return this;
  }

  /** Returns all config values as a plain object. */
  getAll(): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    for (const [name] of this.properties) {
      result[name] = this.get(name);
    }
    return result;
  }

  /** Returns `true` if the named config property exists. */
  has(name: string): boolean {
    return this.properties.has(name);
  }

  /** Retrieves a property or throws if not defined. */
  private getProperty(name: string): ConfigProperty {
    const property = this.properties.get(name);
    assert(property, `config "${name}" is not defined`);
    return property;
  }
}
