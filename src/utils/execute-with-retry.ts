/**
 * Retry a function, but not endlessly. This should only be used when provided
 * fn is non-deterministic and thus able to generate different conditions on
 * each iteration, returning boolean true/false to indicate its success state.
 *
 * As long as no success is reached within given amount of tries, a retry is executed.
 *
 * This can be used for random positioning of Objects within a randomly generated
 * environment (where given fn checks whether an object can be placed at a randomly
 * defined position).
 *
 * @param {Function} fn function to execute and retry
 * @param {Number=} tries maximum amount of retries to execute as long as fn
 *                  does not return success
 * @return {Boolean} whether fn has been executed successfully
 */
export default function( fn: Function, tries: number = 255 ): boolean {
    while ( true ) {
        if ( fn()) {
            return true;
        }
        if ( --tries === 0 ) {
            break;
        }
    }
    return false;
}
