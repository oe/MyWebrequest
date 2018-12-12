# My Webrequest [![Build Status](https://travis-ci.org/evecalm/MyWebrequest.svg?branch=dev)](https://travis-ci.org/evecalm/MyWebrequest)

Control your network connection

Please visit http://app.evecalm.com/MyWebrequest/ for more introduction and installation instructions.

## Building Steps

### prepare your environment

1. install **[nodejs](https://nodejs.org/en/download/)** on your computer
2. install **yarn** as your node package manager by run `npm i yarn -g` in your shell

### install deps

run `yarn` in your shell,

### dev

1. run `yarn run dev` in your shell
2. then open chrome and navigate to `chrome://extensions/`
3. turn on `Developer mode` on top right
4. click **LOAD UNPACKED** and choose directory `MyWebrequest/dist`

### build

run `yarn run build` in your shell, a file named `ext.zip` & `ext.crx` of packed extension will be generated.
