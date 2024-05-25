/* eslint-disable no-unused-vars */
import chalk from 'chalk';
import { oraSucceed, oraFail, oraStop, oraStart, oraBackupAndStopCurrent, print, strout } from './oraManager.js'
const singleton = {
    abortQueue: {},
    async debug(data, scopename) {
        const optionscopename = singleton?.options?.debug;
        if (!scopename || !optionscopename) return;
        if (optionscopename !== scopename) return;
        await strout(chalk.red(scopename), (data));
    }
};
export default singleton;
