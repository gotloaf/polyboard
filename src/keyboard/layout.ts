
import de_de from './layouts/de_de.json'
import el_gr from './layouts/el_gr.json'
import en_gb from './layouts/en_gb.json'
import en_us_dvorak from './layouts/en_us_dvorak.json'
import en_us from './layouts/en_us.json'
import es_es from './layouts/es_es.json'
import fi_fi from './layouts/fi_fi.json'
import fr_fr from './layouts/fr_fr.json'
import he_il from './layouts/he_il.json'
import it_it from './layouts/it_it.json'
import nl_nl from './layouts/nl_nl.json'
import pl_pl_programmers from './layouts/pl_pl_programmers.json'
import pl_pl from './layouts/pl_pl.json'
import ro_ro from './layouts/ro_ro.json'
import ru_ru from './layouts/ru_ru.json'
import ru_ru_phonetic from './layouts/ru_ru_phonetic.json'
import sl_si from './layouts/sl_si.json'
import sv_se from './layouts/sv_se.json'
import sy_sy from './layouts/sy_sy.json'


export type KeyOutput = {
    value: string,
    is_deadkey: boolean,
};

export type KeyBinding = {
    caps_is_shift: boolean,
    output_default: KeyOutput,
    output_shift?: KeyOutput,
    output_ctrl?: KeyOutput,
    output_shiftctrl?: KeyOutput,
    output_ctrlalt?: KeyOutput,
    output_shiftctrlalt?: KeyOutput,
    output_shiftcaps?: KeyOutput,
};

export type KeyboardLayout = {
    bindings: {
        [name: string]: KeyBinding,
    },
    deadkeys: {
        [deadkey: string]: {
            [source_character: string]: string
        }
    },
    locale_name: string,
    language_name: string,
};

export const EN_US: KeyboardLayout = en_us;
export const LAYOUTS: KeyboardLayout[] = [
    de_de,
    el_gr,
    en_gb,
    en_us_dvorak,
    en_us,
    es_es,
    fi_fi,
    fr_fr,
    he_il,
    it_it,
    nl_nl,
    pl_pl_programmers,
    pl_pl,
    ro_ro,
    ru_ru,
    ru_ru_phonetic,
    sl_si,
    sv_se,
    sy_sy,
];

export function keyStateToOutput(
    binding: KeyBinding,
    shiftPressed: boolean, ctrlPressed: boolean, altPressed: boolean, capsLock: boolean,
): KeyOutput {
    // In languages where Caps+Shift is distinct, if such a binding exists, prioritize it.
    if (capsLock && shiftPressed && binding.output_shiftcaps != undefined) {
        return binding.output_shiftcaps;
    }

    // Certain keys, e.g. letter keys, consider caps lock to be equivalent to shift.
    // In these cases, caps produces the shift version, and caps+shift produces the non-shift version.
    const isShift = binding.caps_is_shift ?
        (capsLock != shiftPressed) :
        shiftPressed;

    // These are binding-predicate pairs, in order of priority.
    // The first binding that exists whose predicate is satisfied is chosen.
    // If nothing matches, the default binding is instead returned.
    const potentialBindings: [KeyOutput | undefined, boolean][] = [
        [binding.output_shiftctrlalt, isShift && ctrlPressed && altPressed],
        [binding.output_ctrlalt, ctrlPressed && altPressed],
        [binding.output_shiftctrl, isShift && ctrlPressed],
        [binding.output_ctrl, ctrlPressed],
        [binding.output_shift, isShift]
    ];

    for (const [bind, predicate] of potentialBindings) {
        if (predicate && bind !== undefined)
            return bind;
    }

    return binding.output_default;
}

/** This takes a KeyEvent and a KeyBinding to produce a KeyOutput
 * according to the modifier keys and etc being pressed alongside this key. */
export function eventToOutput(binding: KeyBinding, event: React.KeyboardEvent<HTMLTextAreaElement>): KeyOutput {
    const isCapsLock = event.getModifierState("CapsLock");
    const isShiftRaw = event.shiftKey;
    const isCtrl = event.ctrlKey;
    const isAlt = event.altKey;

    return keyStateToOutput(binding, isShiftRaw, isCtrl, isAlt, isCapsLock);
}

/**
 * Outputs the key that would be inputted from pressing it in this state, whether it is a dead key, and whether it is affected by the dead key.
 */
export function labelFromKeyState(
    layout: KeyboardLayout, keyName: string,
    shiftPressed: boolean, ctrlPressed: boolean, altPressed: boolean, capsLock: boolean,
    deadKey: string | null
): [string, boolean, boolean] {
    const binding = layout.bindings[keyName];

    if (binding === undefined) {
        return ["", false, false];
    }

    const output = keyStateToOutput(binding, shiftPressed, ctrlPressed, altPressed, capsLock);
    const isDeadKey = output.value in layout.deadkeys;

    if (deadKey === null) {
        return [output.value, isDeadKey, false];
    } else {
        // If there is a value for this dead key combination, output it, otherwise the original value.
        const transformedKey = (layout.deadkeys[deadKey] || {})[output.value];

        if (transformedKey !== undefined) {
            return [transformedKey, isDeadKey, true];
        } else {
            return [output.value, isDeadKey, false];
        }
    }
}
