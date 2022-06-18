const START_TIME = Date.now(); // application start time (deliberately a Date, not performance start time!)
let GENERATED    = 0;          // amount of generated instances

export const getUid = (): string => {
    ++GENERATED;
    return `${START_TIME}_${GENERATED}`;
};
