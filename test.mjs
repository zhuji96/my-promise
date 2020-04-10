import MyPromise from "./promise.mjs";

new MyPromise((r, j) => {
    setTimeout(() => r(1), 1000);
}).then(console.log, console.error);
