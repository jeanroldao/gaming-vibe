import { useState, useEffect, useCallback, useRef } from 'react'
import './OnScreenKeyboard.css'

interface OnScreenKeyboardProps {
  onInput: (char: string) => void
  onBackspace: () => void
  onEnter: () => void
  onClose: () => void
  visible: boolean
}

const KEYBOARD_LAYOUT = [
  ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', '⌫'],
  ['Z', 'X', 'C', 'V', 'B', 'N', 'M', '!', '?', '✓'],
  ['Space', 'Close']
]

const STICK_THRESHOLD = 0.5

export const OnScreenKeyboard = ({
  onInput,
  onBackspace,
  onEnter,
  onClose,
  visible
}: OnScreenKeyboardProps) => {
  const [selectedRow, setSelectedRow] = useState(0)
  const [selectedCol, setSelectedCol] = useState(0)
  const lastDpadRef = useRef({ up: false, down: false, left: false, right: false })
  const lastARef = useRef(false)
  const lastBRef = useRef(false)

  const handleKeyPress = useCallback((key: string) => {
    if (key === '⌫') {
      onBackspace()
    } else if (key === '✓') {
      onEnter()
    } else if (key === 'Space') {
      onInput(' ')
    } else if (key === 'Close') {
      onClose()
    } else {
      onInput(key)
    }
  }, [onInput, onBackspace, onEnter, onClose])

  useEffect(() => {
    if (!visible) return

    const handleGamepad = () => {
      const gamepads = navigator.getGamepads()
      const gamepad = gamepads[0] || gamepads[1] || gamepads[2] || gamepads[3]

      if (gamepad) {
        // D-pad navigation
        const dpadUp = gamepad.buttons[12]?.pressed || gamepad.axes[1] < -STICK_THRESHOLD
        const dpadDown = gamepad.buttons[13]?.pressed || gamepad.axes[1] > STICK_THRESHOLD
        const dpadLeft = gamepad.buttons[14]?.pressed || gamepad.axes[0] < -STICK_THRESHOLD
        const dpadRight = gamepad.buttons[15]?.pressed || gamepad.axes[0] > STICK_THRESHOLD

        if (dpadUp && !lastDpadRef.current.up) {
          setSelectedRow(prev => Math.max(0, prev - 1))
        }
        if (dpadDown && !lastDpadRef.current.down) {
          setSelectedRow(prev => Math.min(KEYBOARD_LAYOUT.length - 1, prev + 1))
        }
        if (dpadLeft && !lastDpadRef.current.left) {
          setSelectedCol(prev => Math.max(0, prev - 1))
        }
        if (dpadRight && !lastDpadRef.current.right) {
          setSelectedCol(prev => {
            const maxCol = KEYBOARD_LAYOUT[selectedRow].length - 1
            return Math.min(maxCol, prev + 1)
          })
        }

        lastDpadRef.current = { up: dpadUp, down: dpadDown, left: dpadLeft, right: dpadRight }

        // A button to select
        const aPressed = gamepad.buttons[0]?.pressed
        
        if (aPressed && !lastARef.current) {
          const key = KEYBOARD_LAYOUT[selectedRow]?.[selectedCol]
          if (key) {
            handleKeyPress(key)
          }
        }
        lastARef.current = aPressed

        // B button to close
        const bPressed = gamepad.buttons[1]?.pressed
        
        if (bPressed && !lastBRef.current) {
          onClose()
        }
        lastBRef.current = bPressed
      }

      requestAnimationFrame(handleGamepad)
    }

    const animationId = requestAnimationFrame(handleGamepad)
    return () => cancelAnimationFrame(animationId)
  }, [visible, selectedRow, selectedCol, handleKeyPress, onClose])

  // Adjust selected column when changing rows
  useEffect(() => {
    const maxCol = KEYBOARD_LAYOUT[selectedRow].length - 1
    if (selectedCol > maxCol) {
      setSelectedCol(maxCol)
    }
  }, [selectedRow, selectedCol])

  if (!visible) return null

  return (
    <div className="keyboard-overlay">
      <div className="keyboard-container">
        <div className="keyboard-header">
          <h3>🎮 On-Screen Keyboard</h3>
          <p className="keyboard-help">Use D-Pad to navigate, A to select, B to close</p>
        </div>
        <div className="keyboard">
          {KEYBOARD_LAYOUT.map((row, rowIndex) => (
            <div key={rowIndex} className="keyboard-row">
              {row.map((key, colIndex) => (
                <button
                  key={`${rowIndex}-${colIndex}`}
                  className={`keyboard-key ${
                    rowIndex === selectedRow && colIndex === selectedCol ? 'selected' : ''
                  } ${key === 'Space' || key === 'Close' ? 'wide-key' : ''}`}
                  onClick={() => handleKeyPress(key)}
                >
                  {key === 'Space' ? '␣ Space' : key}
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
