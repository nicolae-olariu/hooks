#!/bin/sh

find . -type f -name "*.js" -exec js-beautify -r {} \;
