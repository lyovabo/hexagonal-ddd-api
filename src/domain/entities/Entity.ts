import { v4 as uuidv4 } from 'uuid';
import { DomainEvent } from '../events/DomainEvent';

export abstract class Entity<T> {
  protected readonly _id: string;
  protected props: T;
  private _domainEvents: DomainEvent[] = [];

  constructor(props: T, id?: string) {
    this._id = id ?? uuidv4();
    this.props = props;
  }

  get id(): string {
    return this._id;
  }

  get domainEvents(): DomainEvent[] {
    return this._domainEvents;
  }

  protected addDomainEvent(event: DomainEvent): void {
    this._domainEvents.push(event);
  }

  clearDomainEvents(): void {
    this._domainEvents = [];
  }

  equals(entity?: Entity<T>): boolean {
    if (!entity) return false;
    if (this === entity) return true;
    return this._id === entity._id;
  }
}
