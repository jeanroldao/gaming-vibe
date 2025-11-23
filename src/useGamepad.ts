import { useEffect, useRef, useCallback } from 'react'

// NOTE: This hook includes extensive console logging to help debug gamepad issues.
// This is intentional to assist users in troubleshooting Xbox controller problems
// on Chrome/Windows 11. Users can filter logs by searching for '[useGamepad]' in the console.

export interface GamepadConfig {
  onUp?: () => void
  onDown?: () => void
  onLeft?: () => void
  onRight?: () => void
  onA?: () => void // A button (bottom face button)
  onB?: () => void // B button (right face button)
  onX?: () => void // X button (left face button)
  onY?: () => void // Y button (top face button)
  onStart?: () => void
  onSelect?: () => void
}

// Xbox controller button indices
const BUTTON_A = 0
const BUTTON_B = 1
const BUTTON_X = 2
const BUTTON_Y = 3
const BUTTON_START = 9
const BUTTON_SELECT = 8

// Threshold for analog stick to register as pressed
const STICK_THRESHOLD = 0.5

// Helper function to get button name for logging
const getButtonName = (index: number): string => {
  const buttonNames: Record<number, string> = {
    [BUTTON_A]: 'A',
    [BUTTON_B]: 'B',
    [BUTTON_X]: 'X',
    [BUTTON_Y]: 'Y',
    [BUTTON_START]: 'START',
    [BUTTON_SELECT]: 'SELECT'
  }
  return buttonNames[index] || `Button ${index}`
}

export const useGamepad = (config: GamepadConfig) => {
  // Track state for each gamepad separately (up to 4 gamepads)
  const lastButtonStates = useRef<Map<number, boolean[]>>(new Map())
  const lastAxisStates = useRef<Map<number, { up: boolean; down: boolean; left: boolean; right: boolean }>>(new Map())
  const animationFrameId = useRef<number | undefined>(undefined)
  const configRef = useRef(config)
  const isMounted = useRef(true)
  const connectedGamepads = useRef<Set<number>>(new Set())
  const hasLoggedInit = useRef(false)

  // Update config ref whenever config changes
  useEffect(() => {
    configRef.current = config
  }, [config])

  // Reset state for a specific gamepad
  const resetGamepadState = useCallback((gamepadIndex: number) => {
    lastButtonStates.current.delete(gamepadIndex)
    lastAxisStates.current.delete(gamepadIndex)
  }, [])

  const checkGamepad = useCallback(() => {
    if (!isMounted.current) {
      return
    }

    const gamepads = navigator.getGamepads()
    
    // Log initialization only once
    if (!hasLoggedInit.current) {
      console.log('[useGamepad] Initialization:', {
        gamepadAPIAvailable: !!navigator.getGamepads,
        gamepadsDetected: gamepads.filter(g => g !== null).length,
        allGamepads: gamepads.map((g, i) => g ? { index: i, id: g.id, buttons: g.buttons.length, axes: g.axes.length } : null)
      })
      hasLoggedInit.current = true
    }

    // Track which gamepads are currently connected
    const currentlyConnected = new Set<number>()
    
    // Check each gamepad slot
    for (let i = 0; i < gamepads.length; i++) {
      const gamepad = gamepads[i]
      
      if (!gamepad) {
        // If this gamepad was previously connected, clean up its state
        if (connectedGamepads.current.has(i)) {
          console.log('[useGamepad] Gamepad disconnected at index', i)
          resetGamepadState(i)
          connectedGamepads.current.delete(i)
        }
        continue
      }
      
      currentlyConnected.add(i)
      
      // If this is a newly connected gamepad, log it
      if (!connectedGamepads.current.has(i)) {
        console.log('[useGamepad] Gamepad connected:', {
          index: i,
          id: gamepad.id,
          buttons: gamepad.buttons.length,
          axes: gamepad.axes.length,
          mapping: gamepad.mapping
        })
        connectedGamepads.current.add(i)
      }

      // Get or initialize button state for this gamepad
      if (!lastButtonStates.current.has(i)) {
        lastButtonStates.current.set(i, new Array(gamepad.buttons.length).fill(false))
        console.log('[useGamepad] Button state initialized for gamepad', i, 'with', gamepad.buttons.length, 'buttons')
      }
      
      // Get or initialize axis state for this gamepad
      if (!lastAxisStates.current.has(i)) {
        lastAxisStates.current.set(i, { up: false, down: false, left: false, right: false })
      }
      
      const lastButtonState = lastButtonStates.current.get(i)!
      const lastAxisState = lastAxisStates.current.get(i)!

      // Check buttons for this gamepad
      gamepad.buttons.forEach((button, index) => {
        const isPressed = button.pressed
        const wasPressed = lastButtonState[index]

        // Only trigger on button press (not on release or hold)
        if (isPressed && !wasPressed) {
          console.log('[useGamepad] Button pressed on gamepad', i, ':', {
            index,
            buttonName: getButtonName(index),
            value: button.value
          })
          
          switch (index) {
            case BUTTON_A:
              configRef.current.onA?.()
              break
            case BUTTON_B:
              configRef.current.onB?.()
              break
            case BUTTON_X:
              configRef.current.onX?.()
              break
            case BUTTON_Y:
              configRef.current.onY?.()
              break
            case BUTTON_START:
              configRef.current.onStart?.()
              break
            case BUTTON_SELECT:
              configRef.current.onSelect?.()
              break
          }
        }

        lastButtonState[index] = isPressed
      })

      // Check D-pad and left analog stick for this gamepad
      const dpadUp = gamepad.buttons[12]?.pressed || gamepad.axes[1] < -STICK_THRESHOLD
      const dpadDown = gamepad.buttons[13]?.pressed || gamepad.axes[1] > STICK_THRESHOLD
      const dpadLeft = gamepad.buttons[14]?.pressed || gamepad.axes[0] < -STICK_THRESHOLD
      const dpadRight = gamepad.buttons[15]?.pressed || gamepad.axes[0] > STICK_THRESHOLD

      // Trigger on state change from not pressed to pressed
      if (dpadUp && !lastAxisState.up) {
        console.log('[useGamepad] D-pad/Stick UP on gamepad', i, { 
          dpadButton: gamepad.buttons[12]?.pressed, 
          axisValue: gamepad.axes[1] 
        })
        configRef.current.onUp?.()
      }
      if (dpadDown && !lastAxisState.down) {
        console.log('[useGamepad] D-pad/Stick DOWN on gamepad', i, { 
          dpadButton: gamepad.buttons[13]?.pressed, 
          axisValue: gamepad.axes[1] 
        })
        configRef.current.onDown?.()
      }
      if (dpadLeft && !lastAxisState.left) {
        console.log('[useGamepad] D-pad/Stick LEFT on gamepad', i, { 
          dpadButton: gamepad.buttons[14]?.pressed, 
          axisValue: gamepad.axes[0] 
        })
        configRef.current.onLeft?.()
      }
      if (dpadRight && !lastAxisState.right) {
        console.log('[useGamepad] D-pad/Stick RIGHT on gamepad', i, { 
          dpadButton: gamepad.buttons[15]?.pressed, 
          axisValue: gamepad.axes[0] 
        })
        configRef.current.onRight?.()
      }

      // Update axis state for this gamepad
      lastAxisStates.current.set(i, {
        up: dpadUp,
        down: dpadDown,
        left: dpadLeft,
        right: dpadRight
      })
    }

    animationFrameId.current = requestAnimationFrame(checkGamepad)
  }, [resetGamepadState])

  useEffect(() => {
    isMounted.current = true
    // NOTE: Console logging is intentionally verbose to help users debug gamepad issues
    // Users can filter logs by searching for '[useGamepad]' in the console
    console.log('[useGamepad] Hook mounted, starting gamepad polling')
    
    // Handle gamepad connection/disconnection events
    const handleGamepadEvent = (event: GamepadEvent) => {
      console.log('[useGamepad] Gamepad event:', event.type, {
        gamepad: event.gamepad ? {
          id: event.gamepad.id,
          index: event.gamepad.index,
          buttons: event.gamepad.buttons.length,
          axes: event.gamepad.axes.length,
          mapping: event.gamepad.mapping
        } : null
      })
      if (event.gamepad) {
        resetGamepadState(event.gamepad.index)
      }
      hasLoggedInit.current = false // Reset to log new gamepad info
    }
    
    window.addEventListener('gamepadconnected', handleGamepadEvent)
    window.addEventListener('gamepaddisconnected', handleGamepadEvent)
    
    // Start polling
    animationFrameId.current = requestAnimationFrame(checkGamepad)

    return () => {
      console.log('[useGamepad] Hook unmounting, stopping gamepad polling')
      isMounted.current = false
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current)
      }
      window.removeEventListener('gamepadconnected', handleGamepadEvent)
      window.removeEventListener('gamepaddisconnected', handleGamepadEvent)
    }
  }, [checkGamepad, resetGamepadState])
}
