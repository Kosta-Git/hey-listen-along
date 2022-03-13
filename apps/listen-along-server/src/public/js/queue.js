export class Queue {
  constructor() {
    this.data = [];
  }

  add(elem) { this.data.push(elem); }

  hasNext() { return this.data.length !== 0; }

  next() { return this.data.shift(); }

  clear() { this.data = []; }

  remove(id) { this.data = this.data.filter(s => s.id === id); }

  removeMany(ids) {
    ids.forEach(id => {
      this.data = this.data.filter(s => s.id === id);
    });
  }

  all() { return this.data; }
}
