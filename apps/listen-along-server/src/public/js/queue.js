let queue = [];

const add = (song) => {
  queue.push(song);
}

const next = () => {
  return queue.length > 0 ? queue.pop() : null;
}

const clear = () => {
  queue.clear();
}

const remove = (id) => {
  queue = queue.filter(s => s.id === id);
}


export const Queue = {
  add,
  next,
  clear,
  remove
}
