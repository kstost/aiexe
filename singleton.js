/* eslint-disable no-unused-vars */
import chalk from 'chalk';
import { oraSucceed, oraFail, oraStop, oraStart, oraBackupAndStopCurrent, print } from './oraManager.js'
const singleton = {
    debug(data, scopename) {
        const optionscopename = singleton?.options?.debug;
        if (!scopename || !optionscopename) return;
        if (optionscopename !== scopename) return;
        print(chalk.red(scopename), (data));
    }
};
export default singleton;
