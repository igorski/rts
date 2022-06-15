# RTS

A WIP browser based real time strategy game in the vein of 90's classics such as Dune 2 and Command & Conquer.

## Game model

The game is written in TypeScript using Vue 3 with Pinia.

All the game's actors and properties are Object structures inside Pinia store states making
these reactive.

In order to create a new structure, a factory pattern is provided and every
game structure has its own factory (see _./src/model/factories/_). You should never
create your own Object structure but use a factory instead.

Operations on structures are done using the action modules (see _./src/model/actions/_).
A lot of structures specify their own getters as well as mutations (remember when changing values
of a Pinia state object that these should be called from a store action).

While the game clock could increment at a lower speed than in actual life (e.g. when paused), think of all
time related operations (e.g. _Effects_) as if they were actual time (e.g. _"the effect of this item should last for fifteen minutes during gameplay"_). The unit used is the _millisecond_ and is automatically
scaled to the game/real life ratio when creating a new Effect using the EffectFactory.

All of the games behaviour and time bound effects update in the same place: the _update()_-handler
in the _game_-store. This is bound to the render cycle of the game world (and deferred to animationFrame
so the game is effectively paused when the browser/tab isn't focused).

## Application source outline

 * _./assets/_ resources referenced by the application e.g. images, fonts and SASS stylesheets
 * _./components/_ Vue components
 * _./definitions/_ enumerations for game specific actions
 * _./model/_ game actor factories and actions (e.g. game logic)
 * _./renderers/_ visualizers of game actors (these are zCanvas Sprites)
 * _./store/_ Pinia store root and sub modules
 * _./utils/_ common helper methods

## Project setup
```
npm install
```

### Development

Create a local development server with hot module reload:

```
npm run dev
```

Creating a production build (build output will reside in _./dist/_-folder):

```
npm run build
```

Running unit tests:

```
npm run test
```
