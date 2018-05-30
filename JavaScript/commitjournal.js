'use strict';

function Transaction() {}

Transaction.start = (data) => {
  console.log('\nstart transaction');
  const events = {
    commit: [], rollback: [], timeout: [], change: []
  };
  let delta = {};
  const commitJournal = [{
    date: Date(),
    operation: 'start',
    delta: {}
  }];
  const emit = (name) => {
    const event = events[name];
    for (const listener of event) listener(data);
  };

  const methods = {
    commit: () => {
      Object.assign(data, delta);
      const obj = {};
      Object.assign(obj, delta);
      delta = {};
      emit('commit');
      commitJournal.push({
        date: Date(),
        operation: 'commit',
        delta: obj
      });
      console.log(commitJournal);
    },
    rollback: () => {
      delta = {};
      emit('rollback');
      commitJournal.push({
        date: Date(),
        operation: 'rollback',
        delta: {}
      });
    },
    clone: () => {
      const cloned = Transaction.start(data);
      Object.assign(cloned.delta, delta);
      return cloned;
    },
    on: (name, callback) => {
      const event = events[name];
      if (event) event.push(callback);
    }
  };

  return new Proxy(data, {
    get(target, key) {
      if (key === 'delta') return delta;
      if (methods.hasOwnProperty(key)) return methods[key];
      if (delta.hasOwnProperty(key)) return delta[key];
      return target[key];
    },
    getOwnPropertyDescriptor: (target, key) => (
      Object.getOwnPropertyDescriptor(
        delta.hasOwnProperty(key) ? delta : target, key
      )
    ),
    ownKeys() {
      const changes = Object.keys(delta);
      const keys = Object.keys(data).concat(changes);
      return keys.filter((x, i, a) => a.indexOf(x) === i);
    },
    set(target, key, val) {
      console.log('set', key, val);
      if (target[key] === val) delete delta[key];
      else delta[key] = val;
      const obj = {};
      Object.assign(obj, delta);
      commitJournal.push({
        date: Date(),
        operation: 'set',
        delta: obj
      });
      return true;
    }
  });
};

// Usage

const data = { name: 'Marcus Aurelius', born: 121 };

const transaction = Transaction.start(data);

transaction.on('commit', () => {
  console.log('\ncommit transaction');
});

transaction.on('rollback', () => {
  console.log('\nrollback transaction');
});

transaction.city = 'Shaoshan';
transaction.rollback();
transaction.city = 'Shao';
transaction.commit();

console.dir({ data });
