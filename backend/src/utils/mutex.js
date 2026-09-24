// Promise-chain mutex: queues async operations so read->check->write is atomic
export function createMutex() {
  let queue = Promise.resolve();
  return function lock(fn) {
    const result = queue.then(() => fn());
    queue = result.catch(() => {});
    return result;
  };
}
