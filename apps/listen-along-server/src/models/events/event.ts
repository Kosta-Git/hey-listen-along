import { EventType } from "./event-type";

export default interface Event<T> {
  type: EventType;
  sentAt: Date;
  payload: T;
}
