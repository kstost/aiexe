#!/bin/bash
node cloneCLI.js
node _temp.js "$@"
rm _temp.js
