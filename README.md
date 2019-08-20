# Ajeeb Coroutines

Unity-inspired Coroutines for the browser and nodejs.

Ajeeb Coroutines are a TypeScript implementation of [a similar idea][unicoro] from [the Unity 3D engine][unity].
They use [ES6 generators][es6gen] to turn code that *reads sequentially* into code that *runs across multiple frames*.
They were designed for the [Ajeeb Game Engine][ajeeb] but have no dependencies and can be used anywhere.

## Installation

```
npm install nasser/ajeeb-coroutines
```

## Usage

An instance of an ES6 generator is treated as [*a coroutine*][wikicoro]. An instance of the [[Coroutines]] class schedules and runs coroutines.

[[Coroutines.start]] adds a couroutine to the collection. [[Coroutines.tick]] runs every coroutine in the collection up to their next [yield][yielddoc]
statement. You can think of [yield][yielddoc] as a way of "waiting one frame".

```js
import { Coroutines } from "ajeeb-coroutines"

let coro = new Coroutines()

coro.start(function* () {
    console.log("hello")  // prints hello
    yield;                // waits one frame
    console.log("world")  // prints world
    yield; yield;         // waits two frames
    console.log("!!!")    // prints world
})

coro.tick()
// prints "hello"
coro.tick()
// prints "world"
coro.tick()
// does nothing
coro.tick()
// prints "!!!"
// further calls to coro.tick() will do nothing
```

Coroutines are designed to run across multiple frames. [[tick]] can be scheduled
to run regularly using [requestAnimationFrame][raf] or [setInterval][si] in the
browser or node respectively, advancing every coroutine in the collection
automatically once per frame.

This library also exports a number of generically useful coroutines, like [[wait]],
that can be combined with your own in powerful ways. A coroutine can be made to
wait for another coroutine with the [yield*][yieldstar] statement. If
[yield][yielddoc] is read as "wait one frame" [yield*][yieldstar] is read as
"wait until this other coroutine completes"

```js
import { Coroutines, wait } from "ajeeb-coroutines"

let coro = new Coroutines()

// schedule coroutines to tick every frame
// in the browser
function runCoroutines() {
    requestAnimationFrame( runCoroutines )
    coro.tick()
}
runCoroutines()

// in node
setInterval(() => coro.tick(), 1000/60)

// you can start coroutines after 
coro.start(function* () {
    console.log("hello")  // prints "hello"
    yield* wait(2)        // wait for 2 seconds
    console.log("world")  // prints "world"
    yield* wait(3)        // waits 3 seconds
    console.log("!!!")    // prints "!!!"
})

// prints "hello" immediately 
// waits 2 seconds
// prints "world" 
// waits 3 seconds
// prints "!!!" 
```

Coroutines can be treated as normal functions. They take arguments, and can be as complex as needed.

```js
import fs from "fs"
import { Coroutines, waitUntil } from "ajeeb-coroutines"

let coro = new Coroutines()

function* waitForFile(path) {
    console.log("waiting for", path);
    yield* waitUntil(() => fs.existsSync(path))
    console.log("ok");
}

coro.start(waitForFile("nice.txt"))

// in the browser
function runCoroutines() {
    requestAnimationFrame( runCoroutines )
    coro.tick()
}
runCoroutines()

// in node
setInterval(() => coro.tick(), 1000/60)
```

[es6gen]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Generator
[ajeeb]: http://ajeeb.games
[yieldstar]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/yield*
[yielddoc]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/yield
[unity]: https://www.unity3d.com/
[unicoro]: https://docs.unity3d.com/Manual/Coroutines.html
[wikicoro]: https://en.wikipedia.org/wiki/Coroutine
[raf]: https://developer.mozilla.org/en-US/docs/Web/API/window/requestAnimationFrame
[si]: https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/setInterval