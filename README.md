<h1 align="center">
    <img alt="polyboard logo" src="/.github/artefacts/polyboard_header.gif">
</h1>

polyboard is a web-based tool for typing using other keyboard layouts. It allows you to type as if you were using a layout for a different language, without needing to install or switch keyboard layouts in your system.

It supports:
- Conversion of hardware keyboard input, allowing you to use your real keyboard to type
- A virtual software keyboard, allowing you to type with a touch screen, or to access keys that may not exist on your hardware keyboard
- Dead key support, allowing you to combine accents or other diacritics by pressing the respective dead key combination.
- Support for Shift, Ctrl, Alt, and Caps Lock modifier modes, including support for Shift+CapsLock tertiary layouts in languages that support it.

polyboard does not support layouts that require Input Method Editors (IMEs), such as Pinyin typing.

You can access a live version of polyboard at [polyboard.gotloaf.dev](https://polyboard.gotloaf.dev/)

## Building

polyboard uses Vite, so building it is as simple as:
```bash
npm install
npm run build
```
The contents of the resulting `dist` folder can be hosted via any static file hosting solution you prefer, such as Apache or NGINX.
