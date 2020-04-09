function MyPromise(executor) {
	var self = this;
	self.status = "pending";
	self.data = undefined;
	self.onResolvedCallback = [];
	self.onRejectedCallback = [];

	function resolve(value) {
		setTimeout(() => {
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
		setTimeout(() => {
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

MyPromise.prototype.then = function(onResolved, onRejected) {
	var self = this;
	onResolved =
		typeof onResolved === "function"
			? onResolved
			: function(value) {
					return value;
			  };
	onRejected =
		typeof onRejected === "function"
			? onRejected
			: function(reason) {
					throw reason;
			  };

	if (self.status === "resolved") {
		return new MyPromise(function(resolve, reject) {
			try {
				var x = onResolved(self.data);
				if (x instanceof MyPromise) {
					x.then(resolve, reject);
				}
				resolve(x);
			} catch (e) {
				reject(e);
			}
		});
	}

	if (self.status === "rejected") {
		return new MyPromise(function(resolve, reject) {
			try {
				var x = onRejected(self.data);
				if (x instanceof MyPromise) {
					x.then(resolve, reject);
				}
			} catch (e) {
				reject(e);
			}
		});
	}

	if (self.status === "pending") {
		return new MyPromise(function(resolve, reject) {
			self.onResolvedCallback.push(function() {
				try {
					var x = onResolved(self.data);
					if (x instanceof MyPromise) {
						x.then(resolve, reject);
					}
					resolve(x);
				} catch (e) {
					reject(e);
				}
			});

			self.onRejectedCallback.push(function(reason) {
				try {
					var x = onRejected(self.data);
					if (x instanceof MyPromise) {
						x.then(resolve, reject);
					}
				} catch (e) {
					reject(e);
				}
			});
		});
	}
};

MyPromise.prototype.catch = function(onRejected) {
	return this.then(null, onRejected);
};

new MyPromise((r, j) => {
	setTimeout(() => r(1), 1000);
})
	.then()
	.then(console.log);
