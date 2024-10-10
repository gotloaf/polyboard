import { useLayoutEffect, useRef, useState } from 'react'

import './App.css'
import defaultText from './default_text.txt?raw'
import github from './assets/github.svg'
import { EN_US, KeyboardLayout, LAYOUTS, keyStateToOutput, layoutToEmoji } from './keyboard/layout';
import KeyboardLayoutDisplay from './keyboard/preview';

function App() {
  // Text content management
  const textArea = useRef<HTMLTextAreaElement>(null);
  const [textContent, setTextContent] = useState(defaultText.replaceAll("\r", ""));
  const selectionArea = useRef<[number, number] | undefined>();
  const [deadKey, setDeadKey] = useState<string | null>(null);

  // Keyboard state management
  const [shiftPressed, setShiftPressed] = useState<boolean>(false);
  const [ctrlPressed, setCtrlPressed] = useState<boolean>(false);
  const [altPressed, setAltPressed] = useState<boolean>(false);
  const [capsPressed, setCapsPressed] = useState<boolean>(false);
  const [lastKey, setLastKey] = useState<string | null>(null);

  // Layout and switcher management
  const [pickerShown, setPickerShown] = useState<boolean>(false);
  const [layout, setLayout] = useState<KeyboardLayout>(EN_US);

  // This layout effect ensures that updates to the selection area occur after rerendering.
  // Otherwise, the cursor just moves to the end every time.
  useLayoutEffect(() => {
    if (selectionArea.current !== undefined) {
      if (textArea.current !== null) {
        textArea.current.setSelectionRange(selectionArea.current[0], selectionArea.current[1]);
      }
      // Ensure the selection area set here does not persist beyond this render (it should only be required once)
      selectionArea.current = undefined;
    }
  });

  // Bisect the text content into three parts: before selection, in selection, and after selection.
  const getTextParts = () => {
    if (textArea.current === null)
      return ["", "", ""];

    const selectionStart = textArea.current.selectionStart;
    const selectionEnd = textArea.current.selectionEnd < textArea.current.selectionStart ?
      textArea.current.selectionStart : textArea.current.selectionEnd;

    const beforeText = textContent.substring(0, selectionStart);
    const selectedText = textContent.substring(selectionStart, selectionEnd);
    const afterText = textContent.substring(selectionEnd);

    return [beforeText, selectedText, afterText];
  }

  const handleKeyPressed = (keyname: string): boolean => {
    setLastKey(keyname);
    // Bisect text
    const [beforeText, selectedText, afterText] = getTextParts();

    if (keyname == 'ShiftLeft' || keyname == 'ShiftRight') {
      // If this wasn't caught by an event handler, it means this was caused by someone *clicking* shift on the virtual keyboard.
      // In this case, we want to toggle shift.
      setShiftPressed(!shiftPressed);
      return true;

    } else if (keyname == 'ControlLeft' || keyname == 'ControlRight') {
      // Same as above, this *toggles* ctrl because the handler would have caught it otherwise.
      setCtrlPressed(!ctrlPressed);
      return true;

    } else if (keyname == 'AltLeft' || keyname == 'AltRight') {
      setAltPressed(!altPressed);
      return true;

    } else if (keyname == 'CapsLock') {
      setCapsPressed(!capsPressed);
      return true;

    } else if (keyname == 'Backspace') {
      // Backspace - if there is a selection, just delete it. Otherwise, trim the last character from the before text.
      if (selectedText.length > 0) {
        setTextContent(beforeText + afterText);
        selectionArea.current = [
          beforeText.length, beforeText.length
        ];
      } else {
        const cursorText = beforeText.substring(0, Math.max(0, beforeText.length - 1));
        setTextContent(cursorText + afterText);
        selectionArea.current = [
          cursorText.length, cursorText.length
        ];
      }
      return true;

    } else if (keyname == 'Delete') {
      // Delete - if there is a selection, just delete it. Otherwise, trim the first character from the after text.
      if (selectedText.length > 0) {
        setTextContent(beforeText + afterText);
        selectionArea.current = [
          beforeText.length, beforeText.length
        ];
      } else {
        const afterTrimmed = afterText.length >= 1 ? afterText.substring(1) : afterText;
        setTextContent(beforeText + afterTrimmed);
        selectionArea.current = [
          beforeText.length, beforeText.length
        ];
      }
      return true;

    } else if (keyname == 'Enter') {
      // Enter - just insert a line break
      setTextContent(beforeText + "\n" + afterText);
      selectionArea.current = [
        beforeText.length + 1, beforeText.length + 1
      ];
      return true;

    } else if (keyname in layout.bindings) {
      // Standard keyboard handling, mapped according to the layout.

      const binding = layout.bindings[keyname];
      const output = keyStateToOutput(binding, shiftPressed, ctrlPressed, altPressed, capsPressed);

      // If this is a dead key..
      if (output.is_deadkey) {
        // If there already was a dead key loaded, dispense of it..
        if (deadKey !== null) {
          setTextContent(beforeText + deadKey + afterText);
          selectionArea.current = [
            beforeText.length + deadKey.length, beforeText.length + deadKey.length
          ];
        }

        // Then set the new dead key
        setDeadKey(output.value);
      } else {
        // Otherwise, check if there is a dead key to process..
        if (deadKey !== null) {
          // If there is a value for this dead key combination..
          const transformedKey = (layout.deadkeys[deadKey] || {})[output.value];
          if (transformedKey !== undefined) {
            // Output the transformed value
            const cursorContent = beforeText + transformedKey;
            setTextContent(cursorContent + afterText);
            setDeadKey(null);
            selectionArea.current = [
              cursorContent.length, cursorContent.length
            ];
          } else {
            // Otherwise, send the dead key's value and the pre-transform value
            const cursorContent = beforeText + deadKey + output.value;
            setTextContent(cursorContent + afterText);
            setDeadKey(null);
            selectionArea.current = [
              cursorContent.length, cursorContent.length
            ];
          }

        } else {
          // If there is no dead key, just input the text as is.
          setTextContent(beforeText + output.value + afterText);
          selectionArea.current = [
            beforeText.length + output.value.length, beforeText.length + output.value.length
          ];
        }
      }

      return true;
    } else {
      // No handling was done, fall back to whatever the system wants to do.
      // This allows keyboard shortcuts like F5 or other things to function correctly.
      return false;
    }
  };

  return (
    <div className="main-content-anchor">
      <textarea
        className="main-text"
        ref={textArea}
        value={textContent}
        onKeyDown={(event) => {
          setLastKey(event.code);

          // Certain non-mutating keyboard actions we should just ignore
          if (
            (event.key == 'a' && event.ctrlKey) ||  // Select all, this must use .key because it varies depending on source keyboard
            (event.code == 'KeyC' && event.ctrlKey) ||  // Copy
            (event.code == 'KeyV' && event.ctrlKey)  // Paste - this is mutating but we must let it propagate for it to work
          ) {
            // Event ignored..

          } else if (event.key == 'Shift') {
            setShiftPressed(true);
          } else if (event.key == 'Control') {
            setCtrlPressed(true);
          } else if (event.key == 'Alt') {
            setAltPressed(true);
          } else if (event.key == 'CapsLock') {
            setCapsPressed(event.getModifierState("CapsLock"));
          } else {
            // If the key press is intercepted, prevent this event from bubbling.
            if (handleKeyPressed(event.code)) {
              event.preventDefault();
            }
          }
        }}

        onKeyUp={(event) => {
          // Update modifiers
          if (event.key == 'Shift') {
            setShiftPressed(false);
          } else if (event.key == 'Control') {
            setCtrlPressed(false);
          } else if (event.key == 'Alt') {
            setAltPressed(false);
          } else if (event.key == 'CapsLock') {
            setCapsPressed(event.getModifierState("CapsLock"));
          }
        }}

        // Clipboard access is difficult unless we hook into the paste event
        onPaste={(event) => {
          const [beforeText, _, afterText] = getTextParts();
          const cursorContent = beforeText + event.clipboardData.getData('text/plain');
          setTextContent(cursorContent + afterText);
          selectionArea.current = [
            cursorContent.length, cursorContent.length
          ];
        }}
      />
      <div className="bottom-bar">

      </div>
      <div className="selector" onClick={() => {setPickerShown(true)}}>
        <img src={layoutToEmoji(layout)}/>
        <div className="selector-content">
          <span className="language-name">{layout.language_name}</span>
          <span className="language-subtitle">{layout.locale_name}</span>
        </div>
      </div>
      <div className="credit-anchor">
        <a href="https://github.com/gotloaf/polyboard" target="_blank" className="credit">
          <img src={github} className="logo small invert-when-dark" alt="GitHub Logo" />
          <span>gotloaf/<span className="credit-repo-name">polyboard</span></span>
        </a>
      </div>
      <div className="keyboard-display">
        <KeyboardLayoutDisplay
          layout={layout}
          shiftPressed={shiftPressed} ctrlPressed={ctrlPressed} altPressed={altPressed} capsLock={capsPressed}
          deadKey={deadKey} lastKey={lastKey}
          onClick={handleKeyPressed}
        />
      </div>
      { pickerShown ?
      <div className="picker">
        {LAYOUTS.map((value) => {
          return <div className="layout-option" key={value.language_name + value.locale_name} onClick={() => {setLayout(value); setPickerShown(false);}}>
            <img src={layoutToEmoji(value)}/>
            {value.language_name} <span className="locale-name">({value.locale_name})</span>
          </div>;
        })}
      </div> : null }
    </div>
  )
}

export default App
