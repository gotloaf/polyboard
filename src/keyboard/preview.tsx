
import { KeyboardLayout, labelFromKeyState } from "./layout";


// A standard key is three ticks long to facilitate non-ortholinear rendering
const KEYBOARD_WIDTH_TICKS = 45;
const KEYBOARD_HEIGHT_KEYS = 5;

// An array of keyboard rows;
//  that contains an array of keyboard keys,
//   which contains their JavaScript key name, size, and maybe a custom label, and maybe a custom predicate
const KEYBOARD_KEY_LAYOUT: [string, number, string?, string?][][] = [
    [["Backquote", 3], ["Digit1", 3], ["Digit2", 3], ["Digit3", 3], ["Digit4", 3], ["Digit5", 3], ["Digit6", 3], ["Digit7", 3], ["Digit8", 3], ["Digit9", 3], ["Digit0", 3], ["Minus", 3], ["Equal", 3], ["IntlYen", 3], ["Backspace", 3, "«"]],
    [["Tab", 4, "Tab"], ["KeyQ", 3], ["KeyW", 3], ["KeyE", 3], ["KeyR", 3], ["KeyT", 3], ["KeyY", 3], ["KeyU", 3], ["KeyI", 3], ["KeyO", 3], ["KeyP", 3], ["BracketLeft", 3], ["BracketRight", 3], ["Backslash", 5]],
    [["CapsLock", 5, "Caps", "caps"], ["KeyA", 3], ["KeyS", 3], ["KeyD", 3], ["KeyF", 3], ["KeyG", 3], ["KeyH", 3], ["KeyJ", 3], ["KeyK", 3], ["KeyL", 3], ["Semicolon", 3], ["Quote", 3], ["Enter", 7, "Enter"]],
    [["ShiftLeft", 4, "Shift", "shift"], ["IntlBackslash", 3], ["KeyZ", 3], ["KeyX", 3], ["KeyC", 3], ["KeyV", 3], ["KeyB", 3], ["KeyN", 3], ["KeyM", 3], ["Comma", 3], ["Period", 3], ["Slash", 3], ["ShiftRight", 8, "Shift", "shift"]],
    [["ControlLeft", 5, "Ctrl", "ctrl"], ["MetaLeft", 4, "\u229e"], ["AltLeft", 4, "Alt", "alt"], ["Space", 15, ""], ["AltRight", 4, "Alt", "alt"], ["MetaRight", 4, "\u229e"], ["ContextMenu", 4, "\u2630"], ["ControlRight", 5, "Ctrl", "ctrl"]]
];


export default function KeyboardLayoutDisplay(props: {
    layout: KeyboardLayout,
    shiftPressed: boolean,
    ctrlPressed: boolean,
    altPressed: boolean,
    capsLock: boolean,
    lastKey: string | null,
    deadKey: string | null,
}) {


    return <div className="keyboard-grid" style={{gridTemplateColumns: `repeat(${KEYBOARD_WIDTH_TICKS}, 1fr)`, gridTemplateRows: `repeat(${KEYBOARD_HEIGHT_KEYS}, 1fr)`}}>

    {
        KEYBOARD_KEY_LAYOUT.flatMap((value, rowIndex) => {
            let offset = 0;

            return value.map((value, columnIndex) => {
                let style = {
                    gridRowStart: `${rowIndex + 1}`,
                    gridRowEnd: `${rowIndex + 2}`,
                    gridColumnStart: `${offset + 1}`,
                    gridColumnEnd: `${offset + value[1] + 1}`
                };
                offset += value[1];
                const [label, isDeadKey, affectedByDeadKey] = labelFromKeyState(props.layout, value[0], props.shiftPressed, props.ctrlPressed, props.altPressed, props.capsLock, props.deadKey);

                // Additional styles for modifiers
                const additionalStyle =
                    value[3] == 'shift' && props.shiftPressed ? 'pressed-key' :
                    value[3] == 'ctrl' && props.ctrlPressed ? 'pressed-key' :
                    value[3] == 'alt' && props.altPressed ? 'pressed-key' :
                    value[3] == 'caps' && props.capsLock ? 'pressed-key' :
                    '';

                // Get key display
                return <div id={`keyboard-key-${value[0]}`} className={`keyboard-key ${props.lastKey == value[0] ? 'last-key' : ''} ${isDeadKey ? 'is-deadkey': ''} ${affectedByDeadKey ? 'affected-by-deadkey': ''} ${additionalStyle}`} key={`key-${rowIndex}-${columnIndex}`} style={style}>
                    {
                        value[2] !== undefined ?
                        value[2] :
                        label
                    }
                </div>;
            });
        })
    }


    </div>
}
