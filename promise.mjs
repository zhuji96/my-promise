function MyPromise(executor) {
    var self = this;
    self.status = "pending";
    self.data = undefined;
    self.onResolvedCallback = [];
    self.onRejectedCallback = [];

    function resolve(value) {
        setImmediate(() => {
            if (self.status === "pending") {
                self.status = "resolved";
                self.data = value;
                for (var i = 0; i < self.onResolvedCallback.length; i++) {
                    self.onResolvedCallback[i]();
                }
            }
        });
    }

    function reject(reason) {
        setImmediate(() => {
            if (self.status === "pending") {
                self.status = "rejected";
                self.data = reason;
                for (var i = 0; i < self.onRejectedCallback.length; i++) {
                    self.onRejectedCallback[i]();
                }
            }
        });
    }

    try {
        executor(resolve, reject);
    } catch (e) {
        reject(e);
    }
}

MyPromise.prototype.then = function (onResolved, onRejected) {
    var self = this;
    var promise2;
    onResolved =
        typeof onResolved === "function"
            ? onResolved
            : function (value) {
                  return value;
              };
    onRejected =
        typeof onRejected === "function"
            ? onRejected
            : function (reason) {
                  throw reason;
              };

    if (self.status === "resolved") {
        promise2 = new MyPromise(function (resolve, reject) {
            try {
                var x = onResolved(self.data);
                promiseResolution(promise2, x, resolve, reject);
            } catch (e) {
                reject(e);
            }
        });
        return promise2;
    }

    if (self.status === "rejected") {
        promise2 = new MyPromise(function (resolve, reject) {
            try {
                var x = onRejected(self.data);
                promiseResolution(promise2, x, resolve, reject);
            } catch (e) {
                reject(e);
            }
        });
        return promise2;
    }

    if (self.status === "pending") {
        promise2 = new MyPromise(function (resolve, reject) {
            self.onResolvedCallback.push(function () {
                try {
                    var x = onResolved(self.data);
                    promiseResolution(promise2, x, resolve, reject);
                } catch (e) {
                    reject(e);
                }
            });

            self.onRejectedCallback.push(function () {
                try {
                    var x = onRejected(self.data);
                    promiseResolution(promise2, x, resolve, reject);
                } catch (e) {
                    reject(e);
                }
            });
        });
        return promise2;
    }
};

MyPromise.prototype.catch = function (onRejected) {
    return this.then(null, onRejected);
};

// [Promise Resolution Procedure]
function promiseResolution(promise2, x, resolve, reject) {
    var then;
    var thenCalledOrThrow = false;

    if (promise2 === x) {
        // 标准2.3.1
        return reject(new TypeError("Chaining cycle detected for promise!"));
    }

    if (x instanceof MyPromise) {
        // 标准2.3.2
        // 如果x的状态还没有确定，那么它是有可能被一个thenable决定最终状态和值的
        // 所以这里需要做一下处理，而不能一概的以为它会被一个“正常”的值resolve
        if (x.status === "pending") {
            x.then(function (value) {
                promiseResolution(promise2, value, resolve, reject);
            }, reject);
        } else {
            // 但如果这个Promise的状态已经确定了，那么它肯定有一个“正常”的值，而不是一个thenable，所以这里直接取它的状态
            x.then(resolve, reject);
        }
        return;
    }

    if (x !== null && (typeof x === "object" || typeof x === "function")) {
        // 2.3.3
        try {
            // 2.3.3.1 因为x.then有可能是一个getter，这种情况下多次读取就有可能产生副作用
            // 即要判断它的类型，又要调用它，这就是两次读取
            then = x.then;
            if (typeof then === "function") {
                // 2.3.3.3
                then.call(
                    x,
                    function rs(y) {
                        // 2.3.3.3.1
                        if (thenCalledOrThrow) return; // 2.3.3.3.3 即这三处谁选执行就以谁的结果为准
                        thenCalledOrThrow = true;
                        return promiseResolution(promise2, y, resolve, reject); // 2.3.3.3.1
                    },
                    function rj(r) {
                        // 2.3.3.3.2
                        if (thenCalledOrThrow) return; // 2.3.3.3.3 即这三处谁选执行就以谁的结果为准
                        thenCalledOrThrow = true;
                        return reject(r);
                    }
                );
            } else {
                // 2.3.3.4
                resolve(x);
            }
        } catch (e) {
            // 2.3.3.2
            if (thenCalledOrThrow) return; // 2.3.3.3.3 即这三处谁选执行就以谁的结果为准
            thenCalledOrThrow = true;
            return reject(e);
        }
    } else {
        // 2.3.4
        resolve(x);
    }
}

MyPromise.deferred = MyPromise.defer = function () {
    var dfd = {};
    dfd.promise = new MyPromise(function (resolve, reject) {
        dfd.resolve = resolve;
        dfd.reject = reject;
    });
    return dfd;
};

// module.exports = MyPromise;
export default MyPromise;
