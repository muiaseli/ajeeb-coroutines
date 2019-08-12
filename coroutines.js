"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * A container for running coroutines.
 *
 * @remarks this might be renamed "Timeline" in the future
 *
 */
class Coroutines {
    constructor(name = generateNewName()) {
        this.name = name;
        this.coroutines = [];
        this.active = true;
    }
    /**
     * Schedules a coroutine for evaluation.
     *
     * Future calls to [[tick]] will run `coro` up to its next `yield` until it is completed.
     *
     * As a convenience if `coro` is a generator function and not a generator, it will be evaluated to produce a generator.
     *
     * ```js
     * function* coroutineFunction() { ... }
     * let coro = new Coroutines()
     * coro.start(coroutineFunction()) // this works
     * coro.start(coroutineFunction)   // so does this
     * ```
     *
     * @param coro coroutine to start
     */
    start(coro) {
        let c = "next" in coro ? coro : coro();
        this.coroutines.push(c);
        return c;
    }
    /**
     * Stops a single coroutine
     *
     * @param coro coroutine to stop
     */
    stop(coro) {
        this.coroutines.splice(this.coroutines.indexOf(coro), 1);
    }
    /**
     * Discards all scheduled coroutines
     */
    stopAll() {
        this.coroutines = [];
    }
    /**
     * Runs all scheduled coroutines once.
     *
     * Each coroutine added with [[start]] will run up to its next `yield` statement. Finished coroutines are removed
     * from the collection.
     */
    tick() {
        let toRemove = [];
        for (const coro of this.coroutines) {
            let result = coro.next();
            if (result.done) {
                toRemove.push(coro);
            }
        }
        for (const x of toRemove) {
            this.coroutines.splice(this.coroutines.indexOf(x), 1);
        }
    }
    /**
     * Start running coroutines every frame.
     *
     * Calls [[tick]] every "frame" as long as [[active]] is true.
     *
     * The meaning of "a frame" depends on the scheduling function. In a browser, requestAnimationFrame is the default
     * and a frame happens every 1/60 seconds or 16.6ms or 60Hz. In node, process.nextTick is the default and a frame
     * happens every iteration of the event loop, which is typically much faster than 1/60 seconds. Coroutines that
     * measure physical time are not affected by this difference.
     *
     * @param scheduleFunction defaults to
     * [requestAnimationFrame](https://developer.mozilla.org/en-US/docs/Web/API/window/requestAnimationFrame)
     * in a browser and [process.nextTick](https://nodejs.org/api/process.html#process_process_nexttick_callback_args) in node.
     */
    startTicking(scheduleFunction = _scheduleFunction) {
        let runCoroutines = () => {
            this.tick();
            if (this.active)
                scheduleFunction(runCoroutines);
        };
        runCoroutines();
    }
}
exports.Coroutines = Coroutines;
let generateNewName = () => Math.random().toString(36).replace("0.", "Coroutines.");
let _scheduleFunction = typeof window === "undefined" ? process.nextTick : requestAnimationFrame;
if (typeof window === "undefined") {
    global["performance"] = require("perf_hooks").performance;
}
let _clock = () => performance.now() / 1000;
/**
 * Sets a new clock function.
 *
 * The clock function returns the elapsed application time in seconds. It is called by some coroutines to measure the
 * passage of time. defaults to `performance.now() / 1000`
 *
 * @param f New clock function
 */
function setClock(f) {
    _clock = f;
}
exports.setClock = setClock;
/**
 * Wait for a number of seconds.
 *
 * @category Coroutine
 *
 * @param seconds How many seconds to wait
 * @param clock A function that returns the elapsed application time in seconds, defaults to the function assigned by [[setClock]]
 * @see [[setClock]]
 */
function* wait(seconds, clock = _clock) {
    let startTime = clock();
    while (clock() - startTime < seconds) {
        yield;
    }
}
exports.wait = wait;
/**
 * Wait for a number of frames.
 *
 * @category Coroutine
 *
 * @param n How many frames to wait
 */
function* waitFrames(n) {
    while (n-- > 0) {
        yield;
    }
}
exports.waitFrames = waitFrames;
/**
 * Wait until a function `f` returns true.
 *
 * @category Coroutine
 *
 * @param f A function to execute every frame. When `f` returns truthy this coroutine completes.
 */
function* waitUntil(f) {
    while (!f()) {
        yield;
    }
}
exports.waitUntil = waitUntil;
/**
 * Wait while a function `f` returns true.
 *
 * @category Coroutine
 *
 * @param f A function to execute every frame. When `f` returns falsey this coroutine completes.
 */
function* waitWhile(f) {
    while (f()) {
        yield;
    }
}
exports.waitWhile = waitWhile;
/**
 * Animate a parameter.
 *
 * @category Coroutine
 *
 * @param obj The object to mutate
 * @param prop The property on `obj` to mutate
 * @param to The final value of `obj.prop`
 * @param options.map A function to shape the animation curve.
 * @param options.map.x A value between 0 and 1
 * @param options.clock b
 * @param options.interpolate c
 * @param options.interpolate.a d
 * @param options.interpolate.b e
 * @param options.interpolate.t f
 */
function* animate(obj, prop, to, options = { clock: _clock, map: (x) => x, interpolate: (a, b, t) => b * t + a * (1 - t) }) {
    let from = obj[prop];
    let t = 0;
    let lastTime = _clock();
    while (t < 1) {
        let nowTime = _clock();
        let delta = nowTime - lastTime;
        lastTime = nowTime;
        obj[prop] = options.interpolate(from, to, options.map(t));
        t += delta;
        yield;
    }
}
exports.animate = animate;
