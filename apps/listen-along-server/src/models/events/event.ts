export default interface Event<T> {
  sentAt: number;
  payload: T;
}
