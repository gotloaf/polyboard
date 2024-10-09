import { useLayoutEffect, useRef, useState } from 'react'

import './App.css'
import github from './assets/github.svg'
import { eventToOutput, EN_US, KeyboardLayout, LAYOUTS } from './keyboard/layout';
import KeyboardLayoutDisplay from './keyboard/preview';

function App() {
  // Text content management
  const textArea = useRef<HTMLTextAreaElement>(null);
  const [textContent, setTextContent] = useState("Type any text here.");
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

  return (
    <div className="main-content-anchor">
      <textarea
        className="main-text"
        ref={textArea}
        value={textContent}
        onKeyDown={(event) => {
          // Update modifiers
          setShiftPressed(event.shiftKey);
          setCtrlPressed(event.ctrlKey);
          setAltPressed(event.altKey);
          setCapsPressed(event.getModifierState("CapsLock"));
          setLastKey(event.code);

          // Bisect text
          const [beforeText, selectedText, afterText] = getTextParts();

          // Certain non-mutating keyboard actions we should just ignore
          if (
            (event.code == 'KeyA' && event.ctrlKey) ||  // Select all
            (event.code == 'KeyC' && event.ctrlKey) ||  // Copy
            (event.code == 'KeyV' && event.ctrlKey)  // Paste - this is mutating but we must let it propagate for it to work
          ) {
            // Event ignored..

          // Backspace - if there is a selection, just delete it. Otherwise, trim the last character from the before text.
          } else if (event.code == 'Backspace') {
            event.preventDefault();
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

          // Delete - if there is a selection, just delete it. Otherwise, trim the first character from the after text.
          } else if (event.code == 'Delete') {
            event.preventDefault();
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

          // Enter - just insert a line break
          } else if (event.code == 'Enter') {
            event.preventDefault();
            setTextContent(beforeText + "\n" + afterText);
            selectionArea.current = [
              beforeText.length + 1, beforeText.length + 1
            ];

          // Standard keyboard handling, mapped according to the layout.
          } else if (event.code in layout.bindings) {
            // We handle this through keyboard transforms instead.
            event.preventDefault();

            const binding = layout.bindings[event.code];
            const output = eventToOutput(binding, event);

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
          }
        }}

        onKeyUp={(event) => {
          // Update modifiers
          setShiftPressed(event.shiftKey);
          setCtrlPressed(event.ctrlKey);
          setAltPressed(event.altKey);
          setCapsPressed(event.getModifierState("CapsLock"));
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
        <span className="language-name">{layout.language_name}</span>
        <span className="language-subtitle">{layout.locale_name}</span>
      </div>
      { pickerShown ?
      <div className="picker">
        {LAYOUTS.map((value) => {
          return <div className="layout-option" key={value.language_name + value.locale_name} onClick={() => {setLayout(value); setPickerShown(false);}}>
            {value.language_name} <span className="locale-name">({value.locale_name})</span>
          </div>;
        })}
      </div> : null }
      <a href="https://github.com/gotloaf/polyboard" target="_blank" className="credit">
        <img src={github} className="logo small invert-when-dark" alt="GitHub Logo" />
        <span>gotloaf/<span className="credit-repo-name">polyboard</span></span>
      </a>
      <div className="keyboard-display">
        <KeyboardLayoutDisplay layout={layout} shiftPressed={shiftPressed} ctrlPressed={ctrlPressed} altPressed={altPressed} capsLock={capsPressed} deadKey={deadKey} lastKey={lastKey}/>
      </div>
    </div>
  )
}

export default App
