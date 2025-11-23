import { useEffect, useRef, useCallback } from 'react'

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
  const lastButtonState = useRef<boolean[]>([])
  const lastAxisState = useRef<{ up: boolean; down: boolean; left: boolean; right: boolean }>({
    up: false,
    down: false,
    left: false,
    right: false
  })
  const animationFrameId = useRef<number | undefined>(undefined)
  const configRef = useRef(config)
  const isMounted = useRef(true)
  const lastGamepadIndex = useRef<number | null>(null)
  const hasLoggedInit = useRef(false)

  // Update config ref whenever config changes
  useEffect(() => {
    configRef.current = config
  }, [config])

  // Reset state when gamepad changes
  const resetGamepadState = useCallback(() => {
    lastButtonState.current = []
    lastAxisState.current = {
      up: false,
      down: false,
      left: false,
      right: false
    }
  }, [])

  const checkGamepad = useCallback(() => {
    if (!isMounted.current) {
      return
    }

    const gamepads = navigator.getGamepads()
    const gamepad = gamepads[0] || gamepads[1] || gamepads[2] || gamepads[3]

    // Log initialization only once
    if (!hasLoggedInit.current) {
      console.log('[useGamepad] Initialization:', {
        gamepadAPIAvailable: !!navigator.getGamepads,
        gamepadsDetected: gamepads.filter(g => g !== null).length,
        allGamepads: gamepads.map((g, i) => g ? { index: i, id: g.id, buttons: g.buttons.length, axes: g.axes.length } : null)
      })
      hasLoggedInit.current = true
    }

    if (!gamepad) {
      // Reset state when no gamepad is connected
      if (lastGamepadIndex.current !== null) {
        console.log('[useGamepad] Gamepad disconnected')
        lastGamepadIndex.current = null
        resetGamepadState()
      }
      // Continue polling even without a gamepad
      animationFrameId.current = requestAnimationFrame(checkGamepad)
      return
    }

    // Find the current gamepad index
    let currentIndex = -1
    for (let i = 0; i < gamepads.length; i++) {
      if (gamepads[i] === gamepad) {
        currentIndex = i
        break
      }
    }
    
    // If gamepad index changed, reset state
    if (lastGamepadIndex.current !== currentIndex) {
      console.log('[useGamepad] Gamepad connected/changed:', {
        index: currentIndex,
        id: gamepad.id,
        buttons: gamepad.buttons.length,
        axes: gamepad.axes.length,
        mapping: gamepad.mapping
      })
      lastGamepadIndex.current = currentIndex
      resetGamepadState()
    }

    // Initialize button state array if needed
    if (lastButtonState.current.length === 0) {
      lastButtonState.current = new Array(gamepad.buttons.length).fill(false)
      console.log('[useGamepad] Button state initialized with', gamepad.buttons.length, 'buttons')
    }

    // Check buttons
    gamepad.buttons.forEach((button, index) => {
      const isPressed = button.pressed
      const wasPressed = lastButtonState.current[index]

      // Only trigger on button press (not on release or hold)
      if (isPressed && !wasPressed) {
        console.log('[useGamepad] Button pressed:', {
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

      lastButtonState.current[index] = isPressed
    })

    // Check D-pad and left analog stick
    const dpadUp = gamepad.buttons[12]?.pressed || gamepad.axes[1] < -STICK_THRESHOLD
    const dpadDown = gamepad.buttons[13]?.pressed || gamepad.axes[1] > STICK_THRESHOLD
    const dpadLeft = gamepad.buttons[14]?.pressed || gamepad.axes[0] < -STICK_THRESHOLD
    const dpadRight = gamepad.buttons[15]?.pressed || gamepad.axes[0] > STICK_THRESHOLD

    // Trigger on state change from not pressed to pressed
    if (dpadUp && !lastAxisState.current.up) {
      console.log('[useGamepad] D-pad/Stick UP', { 
        dpadButton: gamepad.buttons[12]?.pressed, 
        axisValue: gamepad.axes[1] 
      })
      configRef.current.onUp?.()
    }
    if (dpadDown && !lastAxisState.current.down) {
      console.log('[useGamepad] D-pad/Stick DOWN', { 
        dpadButton: gamepad.buttons[13]?.pressed, 
        axisValue: gamepad.axes[1] 
      })
      configRef.current.onDown?.()
    }
    if (dpadLeft && !lastAxisState.current.left) {
      console.log('[useGamepad] D-pad/Stick LEFT', { 
        dpadButton: gamepad.buttons[14]?.pressed, 
        axisValue: gamepad.axes[0] 
      })
      configRef.current.onLeft?.()
    }
    if (dpadRight && !lastAxisState.current.right) {
      console.log('[useGamepad] D-pad/Stick RIGHT', { 
        dpadButton: gamepad.buttons[15]?.pressed, 
        axisValue: gamepad.axes[0] 
      })
      configRef.current.onRight?.()
    }

    lastAxisState.current = {
      up: dpadUp,
      down: dpadDown,
      left: dpadLeft,
      right: dpadRight
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
      resetGamepadState()
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
