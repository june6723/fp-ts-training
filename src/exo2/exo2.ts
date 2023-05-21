// `fp-ts` training Exercise 2
// Let's have fun with combinators!

import * as E from 'fp-ts/Either';
import * as O from 'fp-ts/Option';
import * as RA from 'fp-ts/ReadonlyArray';
import { flow, pipe } from 'fp-ts/lib/function';
import { Failure } from '../Failure';

///////////////////////////////////////////////////////////////////////////////
//                                   SETUP                                   //
///////////////////////////////////////////////////////////////////////////////

// We are developing a small game, and the player can control either one of
// three types of characters, mainly differentiated by the type of damage they
// can put out.

// Our main `Character` type is a simple union of all the concrete character
// types.
export type Character = Warrior | Wizard | Archer;

// We have three types of `Damage`, each corresponding to a character type.
export enum Damage {
  Physical = 'Physical damage',
  Magical = 'Magical damage',
  Ranged = 'Ranged damage',
}

// A `Warrior` only can output physical damage.
export class Warrior {
  smash() {
    return Damage.Physical;
  }

  toString() {
    return 'Warrior';
  }
}

// A `Wizard` only can output magical damage.
export class Wizard {
  burn() {
    return Damage.Magical;
  }

  toString() {
    return 'Wizard';
  }
}

// An `Archer` only can output ranged damage.
export class Archer {
  shoot() {
    return Damage.Ranged;
  }

  toString() {
    return 'Archer';
  }
}

// We also have convenient type guards to help us differentiate between
// character types when given a `Character`.

export const isWarrior = (character: Character): character is Warrior => {
  return (character as Warrior).smash !== undefined;
};

export const isWizard = (character: Character): character is Wizard => {
  return (character as Wizard).burn !== undefined;
};

export const isArcher = (character: Character): character is Archer => {
  return (character as Archer).shoot !== undefined;
};

// Finally, we have convenient and expressive error types, defining what can
// go wrong in our game:
// - the player can try to perform an action with no character targeted
// - the player can try to perform the wrong action for a character class

export enum Exo2FailureType {
  NoTarget = 'Exo2FailureType_NoTarget',
  InvalidTarget = 'Exo2FailureType_InvalidTarget',
}

export type NoTargetFailure = Failure<Exo2FailureType.NoTarget>;
export const noTargetFailure = Failure.builder(Exo2FailureType.NoTarget);

export type InvalidTargetFailure = Failure<Exo2FailureType.InvalidTarget>;
export const invalidTargetFailure = Failure.builder(
  Exo2FailureType.InvalidTarget,
);

///////////////////////////////////////////////////////////////////////////////
//                                  EITHER                                   //
///////////////////////////////////////////////////////////////////////////////

// The next three functions take the unit currently targeted by the player and
// return the expected damage type if appropriate.
//
// If no unit is selected, it should return
// `either.left(noTargetFailure('No unit currently selected'))`
//
// If a unit of the wrong type is selected, it should return
// `either.left(invalidTargetFailure('<unit_type> cannot perform <action>'))`
//
// Otherwise, it should return `either.right(<expected_damage_type>)`
//
// HINT: These functions represent the public API. But it is heavily
// recommended to break those down into smaller private functions that can be
// reused instead of doing one big `pipe` for each.
//
// HINT: `Either` has a special constructor `fromPredicate` that can accept
// a type guard such as `isWarrior` to help with type inference.
//
// HINT: Sequentially check for various possible errors is one of the most
// common operations done with the `Either` type and it is available through
// the `chain` operator and its slightly relaxed variant `chainW`.

const checkTargetSelected = E.fromOption(() =>
  noTargetFailure('No unit currently selected'),
);

const checkWarrior = E.fromPredicate(isWarrior, c =>
  invalidTargetFailure(`${c.toString()} cannot perform smash`),
);
const smash = flow(
  checkWarrior,
  E.map(w => w.smash()),
);

const checkWizard = E.fromPredicate(isWizard, c =>
  invalidTargetFailure(`${c.toString()} cannot perform burn`),
);
const burn = flow(
  checkWizard,
  E.map(w => w.burn()),
);
const checkArcher = E.fromPredicate(isArcher, c =>
  invalidTargetFailure(`${c.toString()} cannot perform shoot`),
);
const shoot = flow(
  checkArcher,
  E.map(a => a.shoot()),
);

export const checkTargetAndSmash: (
  target: O.Option<Character>,
) => E.Either<NoTargetFailure | InvalidTargetFailure, Damage> = flow(
  checkTargetSelected,
  E.chainW(smash),
);

export const checkTargetAndBurn: (
  target: O.Option<Character>,
) => E.Either<NoTargetFailure | InvalidTargetFailure, Damage> = flow(
  checkTargetSelected,
  E.chainW(burn),
);

export const checkTargetAndShoot: (
  target: O.Option<Character>,
) => E.Either<NoTargetFailure | InvalidTargetFailure, Damage> = flow(
  checkTargetSelected,
  E.chainW(shoot),
);

///////////////////////////////////////////////////////////////////////////////
//                                  OPTION                                   //
///////////////////////////////////////////////////////////////////////////////

// The next three functions take a `Character` and optionally return the
// expected damage type if the unit matches the expected character type.
//
// HINT: These functions represent the public API. But it is heavily
// recommended to break those down into smaller private functions that can be
// reused instead of doing one big `pipe` for each.
//
// HINT: `Option` has a special constructor `fromEither` that discards the
// error type.
//
// BONUS POINTS: If you properly defined small private helpers in the previous
// section, they should be easily reused for those use-cases.

export const smashOption: (character: Character) => O.Option<Damage> = flow(
  smash,
  O.fromEither,
);

export const burnOption: (character: Character) => O.Option<Damage> = flow(
  burn,
  O.fromEither,
);

export const shootOption: (character: Character) => O.Option<Damage> = flow(
  shoot,
  O.fromEither,
);

///////////////////////////////////////////////////////////////////////////////
//                                   ARRAY                                   //
///////////////////////////////////////////////////////////////////////////////

// We now want to aggregate all the attacks of a selection of arbitrarily many
// units and know how many are Physical, Magical or Ranged.
//
// HINT: You should be able to reuse the attackOption variants defined earlier
//
// HINT: `ReadonlyArray` from `fp-ts` has a neat `filterMap` function that
// perform mapping and filtering at the same time by applying a function
// of type `A => Option<B>` over the collection.

export interface TotalDamage {
  [Damage.Physical]: number;
  [Damage.Magical]: number;
  [Damage.Ranged]: number;
}

export const attack: (
  army: ReadonlyArray<Character>,
) => TotalDamage = army => ({
  [Damage.Physical]: pipe(army, RA.filterMap(smashOption), RA.size),
  [Damage.Magical]: pipe(army, RA.filterMap(burnOption), RA.size),
  [Damage.Ranged]: pipe(army, RA.filterMap(shootOption), RA.size),
});
